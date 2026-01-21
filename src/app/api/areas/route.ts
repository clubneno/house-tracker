import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { areas, rooms, purchases } from "@/lib/db/schema";
import { neonAuth } from "@/lib/auth/server";
import { desc, sum, count, eq, and } from "drizzle-orm";
import { z } from "zod";

const areaSchema = z.object({
  name: z.string().min(1, "Name is required"),
  nameLt: z.string().optional().nullable(),
  description: z.string().optional(),
  descriptionLt: z.string().optional().nullable(),
  budget: z.number().positive().optional().nullable(),
  homeId: z.string().uuid().optional().nullable(),
});

export async function GET(request: Request) {
  const { session } = await neonAuth();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const homeId = searchParams.get("homeId");

  let conditions = [];
  if (homeId) {
    conditions.push(eq(areas.homeId, homeId));
  }

  // Get areas
  const areasList = await db
    .select()
    .from(areas)
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(desc(areas.createdAt));

  // Get room counts per area (separate query to avoid cartesian product)
  const roomCounts = await db
    .select({
      areaId: rooms.areaId,
      count: count(rooms.id),
    })
    .from(rooms)
    .groupBy(rooms.areaId);

  const roomCountMap = new Map(
    roomCounts.map((r) => [r.areaId, Number(r.count || 0)])
  );

  // Get spending per area (separate query to avoid cartesian product)
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

  return NextResponse.json(
    areasList.map((area) => ({
      ...area,
      roomCount: roomCountMap.get(area.id) || 0,
      totalSpending: spendingMap.get(area.id) || 0,
    }))
  );
}

export async function POST(request: Request) {
  const { session } = await neonAuth();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const data = areaSchema.parse(body);

    const [area] = await db
      .insert(areas)
      .values({
        name: data.name,
        nameLt: data.nameLt,
        description: data.description,
        descriptionLt: data.descriptionLt,
        budget: data.budget?.toString(),
        homeId: data.homeId,
      })
      .returning();

    return NextResponse.json(area);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid input", details: error.errors },
        { status: 400 }
      );
    }
    console.error("Error creating area:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
