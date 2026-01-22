export const dynamic = 'force-dynamic';

import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { rooms, areas, purchases, purchaseLineItems, attachments, suppliers } from "@/lib/db/schema";
import { eq, sum, desc, and } from "drizzle-orm";
import { RoomDetailContent } from "@/components/rooms/room-detail-content";

async function getRoom(id: string) {
  const [result] = await db
    .select({
      room: rooms,
      areaId: areas.id,
      areaName: areas.name,
      areaNameLt: areas.nameLt,
    })
    .from(rooms)
    .leftJoin(areas, eq(rooms.areaId, areas.id))
    .where(eq(rooms.id, id))
    .limit(1);

  if (!result) return null;

  // Get purchases that have line items for this room
  const roomPurchaseIds = await db
    .selectDistinct({ purchaseId: purchaseLineItems.purchaseId })
    .from(purchaseLineItems)
    .where(eq(purchaseLineItems.roomId, id));

  const purchaseIds = roomPurchaseIds.map(p => p.purchaseId);

  let roomPurchases: {
    id: string;
    date: Date;
    totalAmount: string;
    purchaseType: string;
    paymentStatus: string;
    supplierName: string | null;
    supplierFirstName: string | null;
    supplierLastName: string | null;
    supplierType: string | null;
  }[] = [];

  if (purchaseIds.length > 0) {
    roomPurchases = await db
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
      .where(and(
        eq(purchases.isDeleted, false),
        // Only get purchases that have line items for this room
        // Using inArray would be cleaner but let's filter in JS for simplicity
      ))
      .orderBy(desc(purchases.date));

    // Filter to only purchases that have line items for this room
    roomPurchases = roomPurchases.filter(p => purchaseIds.includes(p.id));
  }

  // Get gallery
  const gallery = await db
    .select()
    .from(attachments)
    .where(eq(attachments.roomId, id))
    .orderBy(desc(attachments.createdAt));

  // Get total spending from line items for this room
  const [totalSpending] = await db
    .select({ total: sum(purchaseLineItems.totalPrice) })
    .from(purchaseLineItems)
    .innerJoin(purchases, eq(purchaseLineItems.purchaseId, purchases.id))
    .where(and(eq(purchaseLineItems.roomId, id), eq(purchases.isDeleted, false)));

  return {
    ...result.room,
    areaId: result.areaId,
    areaName: result.areaName,
    areaNameLt: result.areaNameLt,
    purchases: roomPurchases.map((p) => ({
      ...p,
      totalAmount: Number(p.totalAmount),
      supplierName:
        p.supplierType === "company"
          ? p.supplierName
          : `${p.supplierFirstName} ${p.supplierLastName}`,
    })),
    gallery,
    totalSpending: Number(totalSpending?.total || 0),
  };
}

export default async function RoomDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const room = await getRoom(id);

  if (!room) {
    notFound();
  }

  return <RoomDetailContent id={id} room={room} />;
}
