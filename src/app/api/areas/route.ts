import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { areas, rooms, purchases } from "@/lib/db/schema";
import { auth } from "@/lib/auth";
import { desc, sum, count, eq } from "drizzle-orm";
import { z } from "zod";

const areaSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
  budget: z.number().positive().optional().nullable(),
});

export async function GET() {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const result = await db
    .select({
      area: areas,
      roomCount: count(rooms.id),
      totalSpending: sum(purchases.totalAmount),
    })
    .from(areas)
    .leftJoin(rooms, eq(rooms.areaId, areas.id))
    .leftJoin(purchases, eq(purchases.areaId, areas.id))
    .groupBy(areas.id)
    .orderBy(desc(areas.createdAt));

  return NextResponse.json(
    result.map((r) => ({
      ...r.area,
      roomCount: Number(r.roomCount || 0),
      totalSpending: Number(r.totalSpending || 0),
    }))
  );
}

export async function POST(request: Request) {
  const session = await auth();
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
        description: data.description,
        budget: data.budget?.toString(),
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
