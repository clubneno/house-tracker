export const dynamic = 'force-dynamic';

import { Suspense } from "react";
import { db } from "@/lib/db";
import { purchases, areas, rooms, suppliers, purchaseLineItems, attachments, expenseCategories } from "@/lib/db/schema";
import { eq, sum, count, desc, and, gte, lte, isNull, or, isNotNull } from "drizzle-orm";
import { formatCurrency, formatDate } from "@/lib/utils";
import { StatsCards } from "@/components/dashboard/stats-cards";
import { SpendingByAreaChart } from "@/components/dashboard/spending-by-area-chart";
import { SpendingByTypeChart } from "@/components/dashboard/spending-by-type-chart";
import { SpendingByCategoryChart } from "@/components/dashboard/spending-by-category-chart";
import { SpendingByRoomChart } from "@/components/dashboard/spending-by-room-chart";
import { RecentPurchases } from "@/components/dashboard/recent-purchases";
import { BudgetProgress } from "@/components/dashboard/budget-progress";
import { UpcomingPayments } from "@/components/dashboard/upcoming-payments";
import { ExpiringWarranties } from "@/components/dashboard/expiring-warranties";
import { ExpiringDocuments } from "@/components/dashboard/expiring-documents";
import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

async function getDashboardStats() {
  const [totalSpending] = await db
    .select({ total: sum(purchases.totalAmount) })
    .from(purchases)
    .where(eq(purchases.isDeleted, false));

  const [supplierCount] = await db
    .select({ count: count() })
    .from(suppliers)
    .where(eq(suppliers.isDeleted, false));

  const [purchaseCount] = await db
    .select({ count: count() })
    .from(purchases)
    .where(eq(purchases.isDeleted, false));

  const [areaCount] = await db.select({ count: count() }).from(areas);

  const [roomCount] = await db.select({ count: count() }).from(rooms);

  // Pending payments
  const [pendingPayments] = await db
    .select({ total: sum(purchases.totalAmount) })
    .from(purchases)
    .where(
      and(
        eq(purchases.isDeleted, false),
        or(eq(purchases.paymentStatus, "pending"), eq(purchases.paymentStatus, "partial"))
      )
    );

  return {
    totalSpending: Number(totalSpending?.total || 0),
    supplierCount: supplierCount?.count || 0,
    purchaseCount: purchaseCount?.count || 0,
    areaCount: areaCount?.count || 0,
    roomCount: roomCount?.count || 0,
    pendingPayments: Number(pendingPayments?.total || 0),
  };
}

async function getSpendingByArea() {
  // Get spending from line items (which have areaId)
  const results = await db
    .select({
      areaId: areas.id,
      areaName: areas.name,
      budget: areas.budget,
      total: sum(purchaseLineItems.totalPrice),
    })
    .from(areas)
    .leftJoin(purchaseLineItems, eq(purchaseLineItems.areaId, areas.id))
    .leftJoin(purchases, eq(purchaseLineItems.purchaseId, purchases.id))
    .where(or(isNull(purchases.id), eq(purchases.isDeleted, false)))
    .groupBy(areas.id, areas.name, areas.budget);

  return results.map((r) => ({
    name: r.areaName,
    budget: Number(r.budget || 0),
    spent: Number(r.total || 0),
  }));
}

async function getSpendingByType() {
  const results = await db
    .select({
      type: purchases.purchaseType,
      total: sum(purchases.totalAmount),
    })
    .from(purchases)
    .where(eq(purchases.isDeleted, false))
    .groupBy(purchases.purchaseType);

  return results.map((r) => ({
    name: r.type,
    value: Number(r.total || 0),
  }));
}

async function getSpendingByCategory() {
  // Get all categories with their labels
  const allCategories = await db
    .select({
      name: expenseCategories.name,
      label: expenseCategories.label,
    })
    .from(expenseCategories)
    .orderBy(expenseCategories.sortOrder);

  // Get spending by category
  const results = await db
    .select({
      category: purchases.expenseCategory,
      total: sum(purchases.totalAmount),
    })
    .from(purchases)
    .where(and(eq(purchases.isDeleted, false), isNotNull(purchases.expenseCategory)))
    .groupBy(purchases.expenseCategory);

  // Create a map for quick lookup
  const categoryLabels = new Map(allCategories.map(c => [c.name, c.label]));

  return results.map((r) => ({
    name: categoryLabels.get(r.category || "") || r.category || "Other",
    value: Number(r.total || 0),
  }));
}

async function getSpendingByRoom() {
  // Get spending from line items grouped by room
  const results = await db
    .select({
      roomId: rooms.id,
      roomName: rooms.name,
      areaName: areas.name,
      budget: rooms.budget,
      total: sum(purchaseLineItems.totalPrice),
    })
    .from(rooms)
    .leftJoin(areas, eq(rooms.areaId, areas.id))
    .leftJoin(purchaseLineItems, eq(purchaseLineItems.roomId, rooms.id))
    .leftJoin(purchases, eq(purchaseLineItems.purchaseId, purchases.id))
    .where(or(isNull(purchases.id), eq(purchases.isDeleted, false)))
    .groupBy(rooms.id, rooms.name, areas.name, rooms.budget);

  return results.map((r) => ({
    name: r.roomName,
    areaName: r.areaName || "",
    budget: Number(r.budget || 0),
    spent: Number(r.total || 0),
  }));
}

async function getRecentPurchases() {
  const results = await db
    .select({
      id: purchases.id,
      date: purchases.date,
      totalAmount: purchases.totalAmount,
      purchaseType: purchases.purchaseType,
      paymentStatus: purchases.paymentStatus,
      supplierName: suppliers.companyName,
      supplierFirstName: suppliers.firstName,
      supplierLastName: suppliers.lastName,
      supplierType: suppliers.type,
    })
    .from(purchases)
    .leftJoin(suppliers, eq(purchases.supplierId, suppliers.id))
    .where(eq(purchases.isDeleted, false))
    .orderBy(desc(purchases.date))
    .limit(5);

  return results.map((r) => ({
    id: r.id,
    date: r.date,
    totalAmount: Number(r.totalAmount),
    purchaseType: r.purchaseType,
    paymentStatus: r.paymentStatus,
    supplierName:
      r.supplierType === "company"
        ? r.supplierName
        : `${r.supplierFirstName} ${r.supplierLastName}`,
  }));
}

async function getUpcomingPayments() {
  const today = new Date();
  const thirtyDaysFromNow = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000);

  const results = await db
    .select({
      id: purchases.id,
      date: purchases.date,
      totalAmount: purchases.totalAmount,
      paymentDueDate: purchases.paymentDueDate,
      supplierName: suppliers.companyName,
      supplierFirstName: suppliers.firstName,
      supplierLastName: suppliers.lastName,
      supplierType: suppliers.type,
    })
    .from(purchases)
    .leftJoin(suppliers, eq(purchases.supplierId, suppliers.id))
    .where(
      and(
        eq(purchases.isDeleted, false),
        or(eq(purchases.paymentStatus, "pending"), eq(purchases.paymentStatus, "partial")),
        gte(purchases.paymentDueDate, today)
      )
    )
    .orderBy(purchases.paymentDueDate)
    .limit(5);

  return results.map((r) => ({
    id: r.id,
    totalAmount: Number(r.totalAmount),
    paymentDueDate: r.paymentDueDate,
    supplierName:
      r.supplierType === "company"
        ? r.supplierName
        : `${r.supplierFirstName} ${r.supplierLastName}`,
  }));
}

async function getExpiringWarranties() {
  const today = new Date();
  const ninetyDaysFromNow = new Date(today.getTime() + 90 * 24 * 60 * 60 * 1000);

  const results = await db
    .select({
      id: purchaseLineItems.id,
      description: purchaseLineItems.description,
      brand: purchaseLineItems.brand,
      warrantyExpiresAt: purchaseLineItems.warrantyExpiresAt,
    })
    .from(purchaseLineItems)
    .innerJoin(purchases, eq(purchaseLineItems.purchaseId, purchases.id))
    .where(
      and(
        eq(purchases.isDeleted, false),
        gte(purchaseLineItems.warrantyExpiresAt, today)
      )
    )
    .orderBy(purchaseLineItems.warrantyExpiresAt)
    .limit(5);

  return results.map((r) => ({
    id: r.id,
    description: r.description,
    brand: r.brand,
    warrantyExpiresAt: r.warrantyExpiresAt,
  }));
}

async function getExpiringDocuments() {
  const today = new Date();
  const ninetyDaysFromNow = new Date(today.getTime() + 90 * 24 * 60 * 60 * 1000);

  const results = await db
    .select({
      id: attachments.id,
      documentTitle: attachments.documentTitle,
      fileName: attachments.fileName,
      houseDocumentType: attachments.houseDocumentType,
      expiresAt: attachments.expiresAt,
    })
    .from(attachments)
    .where(
      and(
        isNotNull(attachments.houseDocumentType),
        isNotNull(attachments.expiresAt),
        lte(attachments.expiresAt, ninetyDaysFromNow)
      )
    )
    .orderBy(attachments.expiresAt)
    .limit(5);

  return results.map((r) => ({
    id: r.id,
    documentTitle: r.documentTitle,
    fileName: r.fileName,
    houseDocumentType: r.houseDocumentType,
    expiresAt: r.expiresAt,
  }));
}

function StatsCardsSkeleton() {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {[...Array(4)].map((_, i) => (
        <Card key={i}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <Skeleton className="h-4 w-24" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-8 w-32" />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

export default async function DashboardPage() {
  const [stats, spendingByArea, spendingByType, spendingByCategory, spendingByRoom, recentPurchases, upcomingPayments, expiringWarranties, expiringDocuments] =
    await Promise.all([
      getDashboardStats(),
      getSpendingByArea(),
      getSpendingByType(),
      getSpendingByCategory(),
      getSpendingByRoom(),
      getRecentPurchases(),
      getUpcomingPayments(),
      getExpiringWarranties(),
      getExpiringDocuments(),
    ]);

  return (
    <div className="space-y-6">
      <DashboardHeader />

      <Suspense fallback={<StatsCardsSkeleton />}>
        <StatsCards stats={stats} />
      </Suspense>

      <div className="grid gap-4 md:grid-cols-2">
        <SpendingByAreaChart data={spendingByArea} />
        <SpendingByTypeChart data={spendingByType} />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <SpendingByCategoryChart data={spendingByCategory} />
        <SpendingByRoomChart data={spendingByRoom} />
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <RecentPurchases purchases={recentPurchases} />
        </div>
        <div className="space-y-4">
          <UpcomingPayments payments={upcomingPayments} />
          <ExpiringWarranties warranties={expiringWarranties} />
          <ExpiringDocuments documents={expiringDocuments} />
        </div>
      </div>

      <BudgetProgress areas={spendingByArea} />
    </div>
  );
}
