import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { homes, areas, purchases } from "@/lib/db/schema";
import { neonAuth } from "@/lib/auth/server";
import { desc, count, sum, eq, and } from "drizzle-orm";
import { z } from "zod";

const homeSchema = z.object({
  name: z.string().min(1, "Name is required"),
  nameLt: z.string().optional().nullable(),
  address: z.string().optional().nullable(),
  purchaseDate: z.string().optional().nullable(),
  coverImageUrl: z.string().optional().nullable(),
  description: z.string().optional().nullable(),
  descriptionLt: z.string().optional().nullable(),
});

export async function GET() {
  const { session } = await neonAuth();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const result = await db
    .select({
      home: homes,
      areaCount: count(areas.id),
      totalSpending: sum(purchases.totalAmount),
    })
    .from(homes)
    .leftJoin(areas, eq(areas.homeId, homes.id))
    .leftJoin(purchases, eq(purchases.homeId, homes.id))
    .where(eq(homes.isDeleted, false))
    .groupBy(homes.id)
    .orderBy(desc(homes.createdAt));

  return NextResponse.json(
    result.map((r) => ({
      ...r.home,
      areaCount: Number(r.areaCount || 0),
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
    const data = homeSchema.parse(body);

    const [home] = await db
      .insert(homes)
      .values({
        name: data.name,
        nameLt: data.nameLt || null,
        address: data.address || null,
        purchaseDate: data.purchaseDate || null,
        coverImageUrl: data.coverImageUrl || null,
        description: data.description || null,
        descriptionLt: data.descriptionLt || null,
      })
      .returning();

    return NextResponse.json(home);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid input", details: error.errors },
        { status: 400 }
      );
    }
    console.error("Error creating home:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
