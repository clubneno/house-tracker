import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { areas, rooms, purchases } from "@/lib/db/schema";
import { neonAuth } from "@/lib/auth/server";
import { eq, sum, count } from "drizzle-orm";
import { z } from "zod";

const areaSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
  budget: z.number().positive().optional().nullable(),
});

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { session } = await neonAuth();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const [area] = await db
    .select()
    .from(areas)
    .where(eq(areas.id, id))
    .limit(1);

  if (!area) {
    return NextResponse.json({ error: "Area not found" }, { status: 404 });
  }

  // Get rooms
  const areaRooms = await db
    .select({
      room: rooms,
      totalSpending: sum(purchases.totalAmount),
    })
    .from(rooms)
    .leftJoin(purchases, eq(purchases.roomId, rooms.id))
    .where(eq(rooms.areaId, id))
    .groupBy(rooms.id);

  // Get total spending
  const [totalSpending] = await db
    .select({ total: sum(purchases.totalAmount) })
    .from(purchases)
    .where(eq(purchases.areaId, id));

  return NextResponse.json({
    ...area,
    rooms: areaRooms.map((r) => ({
      ...r.room,
      totalSpending: Number(r.totalSpending || 0),
    })),
    totalSpending: Number(totalSpending?.total || 0),
  });
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { session } = await neonAuth();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  try {
    const body = await request.json();
    const data = areaSchema.parse(body);

    const [area] = await db
      .update(areas)
      .set({
        name: data.name,
        description: data.description,
        budget: data.budget?.toString(),
        updatedAt: new Date(),
      })
      .where(eq(areas.id, id))
      .returning();

    if (!area) {
      return NextResponse.json({ error: "Area not found" }, { status: 404 });
    }

    return NextResponse.json(area);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid input", details: error.errors },
        { status: 400 }
      );
    }
    console.error("Error updating area:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { session } = await neonAuth();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  // Check if area has rooms
  const [roomCount] = await db
    .select({ count: count() })
    .from(rooms)
    .where(eq(rooms.areaId, id));

  if (roomCount && roomCount.count > 0) {
    return NextResponse.json(
      { error: "Cannot delete area with rooms. Delete rooms first." },
      { status: 400 }
    );
  }

  await db.delete(areas).where(eq(areas.id, id));

  return NextResponse.json({ success: true });
}
