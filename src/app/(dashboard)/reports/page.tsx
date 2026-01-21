export const dynamic = 'force-dynamic';

import { db } from "@/lib/db";
import { purchases, areas, suppliers } from "@/lib/db/schema";
import { eq, sum, count, desc, and } from "drizzle-orm";
import { SpendingTrendChart } from "@/components/reports/spending-trend-chart";
import { ExpenseCategory } from "@/lib/categories";
import { ReportsHeader } from "@/components/reports/reports-header";
import { ReportsStats } from "@/components/reports/reports-stats";
import { ReportsCards } from "@/components/reports/reports-cards";

async function getReportData() {
  // Get spending by area
  const spendingByArea = await db
    .select({
      areaId: areas.id,
      areaName: areas.name,
      budget: areas.budget,
      total: sum(purchases.totalAmount),
      count: count(purchases.id),
    })
    .from(areas)
    .leftJoin(
      purchases,
      and(eq(purchases.areaId, areas.id), eq(purchases.isDeleted, false))
    )
    .groupBy(areas.id, areas.name, areas.budget)
    .orderBy(desc(sum(purchases.totalAmount)));

  // Get spending by supplier
  const spendingBySupplier = await db
    .select({
      supplierId: suppliers.id,
      supplierName: suppliers.companyName,
      supplierFirstName: suppliers.firstName,
      supplierLastName: suppliers.lastName,
      supplierType: suppliers.type,
      total: sum(purchases.totalAmount),
      count: count(purchases.id),
    })
    .from(suppliers)
    .leftJoin(
      purchases,
      and(eq(purchases.supplierId, suppliers.id), eq(purchases.isDeleted, false))
    )
    .where(eq(suppliers.isDeleted, false))
    .groupBy(
      suppliers.id,
      suppliers.companyName,
      suppliers.firstName,
      suppliers.lastName,
      suppliers.type
    )
    .orderBy(desc(sum(purchases.totalAmount)))
    .limit(10);

  // Get spending by type
  const spendingByType = await db
    .select({
      type: purchases.purchaseType,
      total: sum(purchases.totalAmount),
      count: count(purchases.id),
    })
    .from(purchases)
    .where(eq(purchases.isDeleted, false))
    .groupBy(purchases.purchaseType);

  // Get spending by expense category
  const spendingByCategory = await db
    .select({
      category: purchases.expenseCategory,
      total: sum(purchases.totalAmount),
      count: count(purchases.id),
    })
    .from(purchases)
    .where(eq(purchases.isDeleted, false))
    .groupBy(purchases.expenseCategory)
    .orderBy(desc(sum(purchases.totalAmount)));

  // Get monthly spending trend
  const allPurchases = await db
    .select({
      date: purchases.date,
      total: purchases.totalAmount,
    })
    .from(purchases)
    .where(eq(purchases.isDeleted, false))
    .orderBy(purchases.date);

  // Group by month
  const monthlySpending = allPurchases.reduce((acc, p) => {
    const month = new Date(p.date).toISOString().slice(0, 7);
    if (!acc[month]) {
      acc[month] = 0;
    }
    acc[month] += Number(p.total);
    return acc;
  }, {} as Record<string, number>);

  // Get total stats
  const [totalStats] = await db
    .select({
      totalSpending: sum(purchases.totalAmount),
      purchaseCount: count(purchases.id),
    })
    .from(purchases)
    .where(eq(purchases.isDeleted, false));

  return {
    spendingByArea: spendingByArea.map((r) => ({
      name: r.areaName,
      budget: Number(r.budget || 0),
      spent: Number(r.total || 0),
      count: Number(r.count || 0),
    })),
    spendingBySupplier: spendingBySupplier.map((r) => ({
      name:
        r.supplierType === "company"
          ? (r.supplierName || "Unknown Company")
          : `${r.supplierFirstName || ""} ${r.supplierLastName || ""}`.trim() || "Unknown",
      spent: Number(r.total || 0),
      count: Number(r.count || 0),
    })),
    spendingByType: spendingByType.map((r) => ({
      type: r.type,
      spent: Number(r.total || 0),
      count: Number(r.count || 0),
    })),
    spendingByCategory: spendingByCategory.map((r) => ({
      category: r.category as ExpenseCategory | null,
      spent: Number(r.total || 0),
      count: Number(r.count || 0),
    })),
    monthlySpending: Object.entries(monthlySpending).map(([month, total]) => ({
      month,
      total,
    })),
    totalSpending: Number(totalStats?.totalSpending || 0),
    purchaseCount: Number(totalStats?.purchaseCount || 0),
  };
}

export default async function ReportsPage() {
  const data = await getReportData();

  return (
    <div className="space-y-6">
      <ReportsHeader />

      <ReportsStats
        totalSpending={data.totalSpending}
        purchaseCount={data.purchaseCount}
      />

      {data.monthlySpending.length > 0 && (
        <SpendingTrendChart data={data.monthlySpending} />
      )}

      <ReportsCards
        spendingByArea={data.spendingByArea}
        spendingBySupplier={data.spendingBySupplier}
        spendingByType={data.spendingByType}
        spendingByCategory={data.spendingByCategory}
      />
    </div>
  );
}
