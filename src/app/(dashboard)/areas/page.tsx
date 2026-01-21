export const dynamic = 'force-dynamic';

import { db } from "@/lib/db";
import { areas, rooms, purchases, homes } from "@/lib/db/schema";
import { desc, sum, count, eq } from "drizzle-orm";
import { AreasPageClient } from "@/components/areas/areas-page-client";

async function getAreas() {
  const result = await db
    .select({
      area: areas,
      roomCount: count(rooms.id),
      homeName: homes.name,
      homeNameLt: homes.nameLt,
    })
    .from(areas)
    .leftJoin(rooms, eq(rooms.areaId, areas.id))
    .leftJoin(homes, eq(areas.homeId, homes.id))
    .groupBy(areas.id, homes.id)
    .orderBy(desc(areas.createdAt));

  // Get spending per area
  const spending = await db
    .select({
      areaId: purchases.areaId,
      total: sum(purchases.totalAmount),
    })
    .from(purchases)
    .where(eq(purchases.isDeleted, false))
    .groupBy(purchases.areaId);

  const spendingMap = new Map(
    spending.map((s) => [s.areaId, Number(s.total || 0)])
  );

  return result.map((r) => ({
    ...r.area,
    roomCount: Number(r.roomCount || 0),
    totalSpending: spendingMap.get(r.area.id) || 0,
    homeName: r.homeName,
    homeNameLt: r.homeNameLt,
  }));
}

export default async function AreasPage() {
  const areaList = await getAreas();

  return <AreasPageClient initialAreas={areaList} />;
}
