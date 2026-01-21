export const dynamic = 'force-dynamic';

import { db } from "@/lib/db";
import { purchases, areas, rooms, suppliers, purchaseLineItems, attachments, expenseCategories, homes } from "@/lib/db/schema";
import { eq, count, and, isNotNull, sql } from "drizzle-orm";
import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import { DashboardHomes } from "@/components/dashboard/dashboard-homes";
import { DashboardContent } from "@/components/dashboard/dashboard-content";

async function getHomes() {
  const homesList = await db
    .select()
    .from(homes)
    .where(eq(homes.isDeleted, false));

  // Get area counts and spending for each home
  const homesWithStats = await Promise.all(
    homesList.map(async (home) => {
      const [areaCount] = await db
        .select({ count: count() })
        .from(areas)
        .where(eq(areas.homeId, home.id));

      const purchaseList = await db
        .select({ totalAmount: purchases.totalAmount })
        .from(purchases)
        .where(and(eq(purchases.homeId, home.id), eq(purchases.isDeleted, false)));

      const totalSpending = purchaseList.reduce((sum, p) => sum + Number(p.totalAmount), 0);

      return {
        ...home,
        areaCount: areaCount?.count || 0,
        totalSpending,
      };
    })
  );

  return homesWithStats;
}

async function getPurchases() {
  const results = await db
    .select({
      id: purchases.id,
      date: purchases.date,
      totalAmount: purchases.totalAmount,
      purchaseType: purchases.purchaseType,
      paymentStatus: purchases.paymentStatus,
      paymentDueDate: purchases.paymentDueDate,
      expenseCategory: purchases.expenseCategory,
      homeId: purchases.homeId,
      supplierId: purchases.supplierId,
      supplierName: suppliers.companyName,
      supplierFirstName: suppliers.firstName,
      supplierLastName: suppliers.lastName,
      supplierType: suppliers.type,
    })
    .from(purchases)
    .leftJoin(suppliers, eq(purchases.supplierId, suppliers.id))
    .where(eq(purchases.isDeleted, false));

  return results.map((r) => ({
    id: r.id,
    date: r.date,
    totalAmount: Number(r.totalAmount),
    purchaseType: r.purchaseType,
    paymentStatus: r.paymentStatus,
    paymentDueDate: r.paymentDueDate,
    expenseCategory: r.expenseCategory,
    homeId: r.homeId,
    supplierId: r.supplierId,
    supplierName:
      r.supplierType === "company"
        ? r.supplierName
        : `${r.supplierFirstName || ''} ${r.supplierLastName || ''}`.trim() || null,
  }));
}

async function getAreas() {
  const results = await db
    .select({
      id: areas.id,
      name: areas.name,
      budget: areas.budget,
      homeId: areas.homeId,
    })
    .from(areas);

  return results.map((r) => ({
    id: r.id,
    name: r.name,
    budget: Number(r.budget || 0),
    homeId: r.homeId,
  }));
}

async function getRooms() {
  const results = await db
    .select({
      id: rooms.id,
      name: rooms.name,
      budget: rooms.budget,
      areaId: rooms.areaId,
      areaName: areas.name,
      homeId: areas.homeId,
    })
    .from(rooms)
    .leftJoin(areas, eq(rooms.areaId, areas.id));

  return results.map((r) => ({
    id: r.id,
    name: r.name,
    budget: Number(r.budget || 0),
    areaId: r.areaId,
    areaName: r.areaName || '',
    homeId: r.homeId,
  }));
}

async function getLineItems() {
  const results = await db
    .select({
      id: purchaseLineItems.id,
      description: purchaseLineItems.description,
      brand: purchaseLineItems.brand,
      totalPrice: purchaseLineItems.totalPrice,
      warrantyExpiresAt: purchaseLineItems.warrantyExpiresAt,
      areaId: purchaseLineItems.areaId,
      roomId: purchaseLineItems.roomId,
      purchaseId: purchaseLineItems.purchaseId,
      homeId: purchases.homeId,
    })
    .from(purchaseLineItems)
    .innerJoin(purchases, eq(purchaseLineItems.purchaseId, purchases.id))
    .where(eq(purchases.isDeleted, false));

  return results.map((r) => ({
    id: r.id,
    description: r.description,
    brand: r.brand,
    totalPrice: Number(r.totalPrice),
    warrantyExpiresAt: r.warrantyExpiresAt,
    areaId: r.areaId,
    roomId: r.roomId,
    purchaseId: r.purchaseId,
    homeId: r.homeId,
  }));
}

async function getDocuments() {
  // Get documents with homeId through room -> area or purchase
  const results = await db
    .select({
      id: attachments.id,
      documentTitle: attachments.documentTitle,
      fileName: attachments.fileName,
      houseDocumentType: attachments.houseDocumentType,
      expiresAt: attachments.expiresAt,
      homeIdFromRoom: areas.homeId,
      homeIdFromPurchase: purchases.homeId,
    })
    .from(attachments)
    .leftJoin(rooms, sql`${attachments.roomId} = ${rooms.id}`)
    .leftJoin(areas, sql`${rooms.areaId} = ${areas.id}`)
    .leftJoin(purchases, sql`${attachments.purchaseId} = ${purchases.id}`)
    .where(isNotNull(attachments.houseDocumentType));

  return results.map((r) => ({
    id: r.id,
    documentTitle: r.documentTitle,
    fileName: r.fileName,
    houseDocumentType: r.houseDocumentType,
    expiresAt: r.expiresAt,
    homeId: r.homeIdFromRoom || r.homeIdFromPurchase || null,
  }));
}

async function getCategoryLabels() {
  const results = await db
    .select({
      name: expenseCategories.name,
      label: expenseCategories.label,
    })
    .from(expenseCategories)
    .orderBy(expenseCategories.sortOrder);

  return results;
}

export default async function DashboardPage() {
  const [homesList, purchaseList, areaList, roomList, lineItemList, documentList, categoryLabels] =
    await Promise.all([
      getHomes(),
      getPurchases(),
      getAreas(),
      getRooms(),
      getLineItems(),
      getDocuments(),
      getCategoryLabels(),
    ]);

  return (
    <div className="space-y-6">
      <DashboardHeader />

      <DashboardHomes homes={homesList} />

      <DashboardContent
        purchases={purchaseList}
        areas={areaList}
        rooms={roomList}
        lineItems={lineItemList}
        documents={documentList}
        categoryLabels={categoryLabels}
      />
    </div>
  );
}
