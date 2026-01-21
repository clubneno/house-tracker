import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { homes, homeImages, areas, purchases } from "@/lib/db/schema";
import { neonAuth } from "@/lib/auth/server";
import { eq, count, sum, and } from "drizzle-orm";
import { z } from "zod";

const homeUpdateSchema = z.object({
  name: z.string().min(1, "Name is required").optional(),
  nameLt: z.string().optional().nullable(),
  address: z.string().optional().nullable(),
  purchaseDate: z.string().optional().nullable(),
  coverImageUrl: z.string().optional().nullable(),
  description: z.string().optional().nullable(),
  descriptionLt: z.string().optional().nullable(),
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

  // Get home data
  const [home] = await db
    .select()
    .from(homes)
    .where(and(eq(homes.id, id), eq(homes.isDeleted, false)));

  if (!home) {
    return NextResponse.json({ error: "Home not found" }, { status: 404 });
  }

  // Get area count (separate query to avoid cartesian product)
  const [areaCountResult] = await db
    .select({ count: count(areas.id) })
    .from(areas)
    .where(eq(areas.homeId, id));

  // Get total spending (separate query to avoid cartesian product)
  const [spendingResult] = await db
    .select({ total: sum(purchases.totalAmount) })
    .from(purchases)
    .where(and(eq(purchases.homeId, id), eq(purchases.isDeleted, false)));

  // Get images for this home
  const images = await db
    .select()
    .from(homeImages)
    .where(eq(homeImages.homeId, id))
    .orderBy(homeImages.sortOrder);

  return NextResponse.json({
    ...home,
    areaCount: Number(areaCountResult?.count || 0),
    totalSpending: Number(spendingResult?.total || 0),
    images,
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
    const data = homeUpdateSchema.parse(body);

    // Convert empty strings to null
    const updateData: Record<string, unknown> = {};
    if (data.name !== undefined) updateData.name = data.name;
    if (data.nameLt !== undefined) updateData.nameLt = data.nameLt || null;
    if (data.address !== undefined) updateData.address = data.address || null;
    if (data.purchaseDate !== undefined) updateData.purchaseDate = data.purchaseDate || null;
    if (data.coverImageUrl !== undefined) updateData.coverImageUrl = data.coverImageUrl || null;
    if (data.description !== undefined) updateData.description = data.description || null;
    if (data.descriptionLt !== undefined) updateData.descriptionLt = data.descriptionLt || null;
    updateData.updatedAt = new Date();

    const [home] = await db
      .update(homes)
      .set(updateData)
      .where(eq(homes.id, id))
      .returning();

    if (!home) {
      return NextResponse.json({ error: "Home not found" }, { status: 404 });
    }

    return NextResponse.json(home);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid input", details: error.errors },
        { status: 400 }
      );
    }
    console.error("Error updating home:", error);
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

  // Soft delete
  const [home] = await db
    .update(homes)
    .set({
      isDeleted: true,
      updatedAt: new Date(),
    })
    .where(eq(homes.id, id))
    .returning();

  if (!home) {
    return NextResponse.json({ error: "Home not found" }, { status: 404 });
  }

  return NextResponse.json({ success: true });
}
