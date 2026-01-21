import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { rooms, areas, purchases } from "@/lib/db/schema";
import { neonAuth } from "@/lib/auth/server";
import { desc, sum, eq } from "drizzle-orm";
import { z } from "zod";

const roomSchema = z.object({
  areaId: z.string().uuid(),
  name: z.string().min(1, "Name is required"),
  nameLt: z.string().optional().nullable(),
  description: z.string().optional(),
  descriptionLt: z.string().optional().nullable(),
  budget: z.number().nonnegative().optional().nullable(),
});

export async function GET(request: Request) {
  const { session } = await neonAuth();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const areaId = searchParams.get("areaId");

  const baseQuery = db
    .select({
      room: rooms,
      areaName: areas.name,
      totalSpending: sum(purchases.totalAmount),
    })
    .from(rooms)
    .leftJoin(areas, eq(rooms.areaId, areas.id))
    .leftJoin(purchases, eq(purchases.roomId, rooms.id));

  const result = areaId
    ? await baseQuery
        .where(eq(rooms.areaId, areaId))
        .groupBy(rooms.id, areas.name)
        .orderBy(desc(rooms.createdAt))
    : await baseQuery
        .groupBy(rooms.id, areas.name)
        .orderBy(desc(rooms.createdAt));

  return NextResponse.json(
    result.map((r) => ({
      ...r.room,
      areaName: r.areaName,
      totalSpending: Number(r.totalSpending || 0),
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
    const data = roomSchema.parse(body);

    // Verify area exists
    const [area] = await db
      .select()
      .from(areas)
      .where(eq(areas.id, data.areaId))
      .limit(1);

    if (!area) {
      return NextResponse.json({ error: "Area not found" }, { status: 404 });
    }

    const [room] = await db
      .insert(rooms)
      .values({
        areaId: data.areaId,
        name: data.name,
        nameLt: data.nameLt,
        description: data.description,
        descriptionLt: data.descriptionLt,
        budget: data.budget?.toString(),
      })
      .returning();

    return NextResponse.json(room);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid input", details: error.errors },
        { status: 400 }
      );
    }
    console.error("Error creating room:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
