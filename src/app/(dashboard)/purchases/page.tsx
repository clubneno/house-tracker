export const dynamic = 'force-dynamic';

import { db } from "@/lib/db";
import { purchases, suppliers, areas, rooms } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";
import { PurchaseFilters } from "@/components/purchases/purchase-filters";
import { PurchasesHeader } from "@/components/purchases/purchases-header";
import { PendingPaymentsAlert } from "@/components/purchases/pending-payments-alert";
import { NoPurchases } from "@/components/purchases/no-purchases";
import { PurchasesTable } from "@/components/purchases/purchases-table";

async function getPurchases() {
  const result = await db
    .select({
      purchase: purchases,
      supplierName: suppliers.companyName,
      supplierFirstName: suppliers.firstName,
      supplierLastName: suppliers.lastName,
      supplierType: suppliers.type,
      areaName: areas.name,
      roomName: rooms.name,
    })
    .from(purchases)
    .leftJoin(suppliers, eq(purchases.supplierId, suppliers.id))
    .leftJoin(areas, eq(purchases.areaId, areas.id))
    .leftJoin(rooms, eq(purchases.roomId, rooms.id))
    .where(eq(purchases.isDeleted, false))
    .orderBy(desc(purchases.date));

  return result.map((r) => ({
    ...r.purchase,
    totalAmount: Number(r.purchase.totalAmount),
    supplierName:
      r.supplierType === "company"
        ? r.supplierName
        : `${r.supplierFirstName} ${r.supplierLastName}`,
    areaName: r.areaName,
    roomName: r.roomName,
  }));
}

export default async function PurchasesPage() {
  const purchaseList = await getPurchases();

  const totalSpending = purchaseList.reduce((sum, p) => sum + p.totalAmount, 0);
  const pendingCount = purchaseList.filter((p) => p.paymentStatus === "pending").length;

  return (
    <div className="space-y-6">
      <PurchasesHeader purchaseCount={purchaseList.length} totalSpending={totalSpending} />

      <PendingPaymentsAlert pendingCount={pendingCount} />

      <PurchaseFilters />

      {purchaseList.length === 0 ? (
        <NoPurchases />
      ) : (
        <PurchasesTable purchases={purchaseList} />
      )}
    </div>
  );
}
