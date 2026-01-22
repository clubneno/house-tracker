export const dynamic = 'force-dynamic';

import { db } from "@/lib/db";
import { rooms, areas, purchases, purchaseLineItems, homes } from "@/lib/db/schema";
import { sum, eq } from "drizzle-orm";
import { RoomsPageClient } from "@/components/rooms/rooms-page-client";

async function getRooms() {
  const result = await db
    .select({
      room: rooms,
      areaName: areas.name,
      areaNameLt: areas.nameLt,
      homeId: areas.homeId,
      homeName: homes.name,
      homeNameLt: homes.nameLt,
    })
    .from(rooms)
    .leftJoin(areas, eq(rooms.areaId, areas.id))
    .leftJoin(homes, eq(areas.homeId, homes.id))
    .orderBy(areas.name, rooms.name);

  // Get spending per room from line items (where area/room assignments are stored)
  const spending = await db
    .select({
      roomId: purchaseLineItems.roomId,
      total: sum(purchaseLineItems.totalPrice),
    })
    .from(purchaseLineItems)
    .innerJoin(purchases, eq(purchaseLineItems.purchaseId, purchases.id))
    .where(eq(purchases.isDeleted, false))
    .groupBy(purchaseLineItems.roomId);

  const spendingMap = new Map(
    spending.map((s) => [s.roomId, Number(s.total || 0)])
  );

  return result.map((r) => ({
    ...r.room,
    areaName: r.areaName,
    areaNameLt: r.areaNameLt,
    homeId: r.homeId,
    homeName: r.homeName,
    homeNameLt: r.homeNameLt,
    totalSpending: spendingMap.get(r.room.id) || 0,
  }));
}

export default async function RoomsPage() {
  const roomList = await getRooms();

  return <RoomsPageClient initialRooms={roomList} />;
}
