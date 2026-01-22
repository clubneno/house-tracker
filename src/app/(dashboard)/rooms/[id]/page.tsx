export const dynamic = 'force-dynamic';

import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { rooms, areas, purchases, attachments, suppliers } from "@/lib/db/schema";
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

  // Get purchases
  const roomPurchases = await db
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
    .where(and(eq(purchases.roomId, id), eq(purchases.isDeleted, false)))
    .orderBy(desc(purchases.date));

  // Get gallery
  const gallery = await db
    .select()
    .from(attachments)
    .where(eq(attachments.roomId, id))
    .orderBy(desc(attachments.createdAt));

  // Get total spending
  const [totalSpending] = await db
    .select({ total: sum(purchases.totalAmount) })
    .from(purchases)
    .where(and(eq(purchases.roomId, id), eq(purchases.isDeleted, false)));

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
