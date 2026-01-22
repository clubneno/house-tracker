export const dynamic = 'force-dynamic';

import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { areas, rooms, purchases } from "@/lib/db/schema";
import { eq, sum, and, count } from "drizzle-orm";
import { AreaDetailContent } from "@/components/areas/area-detail-content";
import { ExpenseCategory } from "@/lib/categories";

async function getArea(id: string) {
  const [area] = await db
    .select()
    .from(areas)
    .where(eq(areas.id, id))
    .limit(1);

  if (!area) return null;

  // Get rooms with spending
  const areaRooms = await db
    .select({
      room: rooms,
    })
    .from(rooms)
    .where(eq(rooms.areaId, id))
    .orderBy(rooms.name);

  // Get spending per room
  const roomSpending = await db
    .select({
      roomId: purchases.roomId,
      total: sum(purchases.totalAmount),
    })
    .from(purchases)
    .where(and(eq(purchases.areaId, id), eq(purchases.isDeleted, false)))
    .groupBy(purchases.roomId);

  const spendingMap = new Map(
    roomSpending.map((s) => [s.roomId, Number(s.total || 0)])
  );

  // Get total spending
  const [totalSpending] = await db
    .select({ total: sum(purchases.totalAmount) })
    .from(purchases)
    .where(and(eq(purchases.areaId, id), eq(purchases.isDeleted, false)));

  // Get spending by category
  const categorySpending = await db
    .select({
      category: purchases.expenseCategory,
      total: sum(purchases.totalAmount),
      count: count(),
    })
    .from(purchases)
    .where(and(eq(purchases.areaId, id), eq(purchases.isDeleted, false)))
    .groupBy(purchases.expenseCategory);

  return {
    ...area,
    rooms: areaRooms.map((r) => ({
      ...r.room,
      totalSpending: spendingMap.get(r.room.id) || 0,
    })),
    totalSpending: Number(totalSpending?.total || 0),
    categoryExpenses: categorySpending.map((c) => ({
      category: c.category as ExpenseCategory | null,
      total: Number(c.total || 0),
      count: Number(c.count || 0),
    })),
  };
}

export default async function AreaDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const area = await getArea(id);

  if (!area) {
    notFound();
  }

  return <AreaDetailContent id={id} area={area} />;
}
