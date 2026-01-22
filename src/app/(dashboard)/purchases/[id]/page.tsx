export const dynamic = 'force-dynamic';

import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { purchases, purchaseLineItems, suppliers, areas, rooms, attachments } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { PurchaseDetailContent } from "@/components/purchases/purchase-detail-content";

async function getPurchase(id: string) {
  const [result] = await db
    .select({
      purchase: purchases,
      supplierName: suppliers.companyName,
      supplierFirstName: suppliers.firstName,
      supplierLastName: suppliers.lastName,
      supplierType: suppliers.type,
      supplierEmail: suppliers.email,
      supplierPhone: suppliers.phone,
    })
    .from(purchases)
    .leftJoin(suppliers, eq(purchases.supplierId, suppliers.id))
    .where(and(eq(purchases.id, id), eq(purchases.isDeleted, false)))
    .limit(1);

  if (!result) return null;

  // Get line items with area/room names
  const lineItemsWithAreas = await db
    .select({
      lineItem: purchaseLineItems,
      areaName: areas.name,
      roomName: rooms.name,
    })
    .from(purchaseLineItems)
    .leftJoin(areas, eq(purchaseLineItems.areaId, areas.id))
    .leftJoin(rooms, eq(purchaseLineItems.roomId, rooms.id))
    .where(eq(purchaseLineItems.purchaseId, id));

  const purchaseAttachments = await db
    .select()
    .from(attachments)
    .where(eq(attachments.purchaseId, id));

  return {
    ...result.purchase,
    totalAmount: Number(result.purchase.totalAmount),
    supplierName:
      result.supplierType === "company"
        ? result.supplierName
        : `${result.supplierFirstName} ${result.supplierLastName}`,
    supplierEmail: result.supplierEmail,
    supplierPhone: result.supplierPhone,
    lineItems: lineItemsWithAreas.map((row) => ({
      ...row.lineItem,
      quantity: Number(row.lineItem.quantity),
      unitPrice: Number(row.lineItem.unitPrice),
      totalPrice: Number(row.lineItem.totalPrice),
      areaName: row.areaName,
      roomName: row.roomName,
    })),
    attachments: purchaseAttachments,
  };
}

export default async function PurchaseDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const purchase = await getPurchase(id);

  if (!purchase) {
    notFound();
  }

  return <PurchaseDetailContent id={id} purchase={purchase} />;
}
