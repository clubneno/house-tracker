import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { homeImages, homes } from "@/lib/db/schema";
import { neonAuth } from "@/lib/auth/server";
import { eq, and, desc } from "drizzle-orm";
import { z } from "zod";

const imageSchema = z.object({
  url: z.string().url("Valid URL is required"),
  caption: z.string().optional().nullable(),
  sortOrder: z.number().optional(),
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

  const images = await db
    .select()
    .from(homeImages)
    .where(eq(homeImages.homeId, id))
    .orderBy(homeImages.sortOrder);

  return NextResponse.json(images);
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { session } = await neonAuth();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  try {
    // Verify home exists
    const [home] = await db
      .select()
      .from(homes)
      .where(and(eq(homes.id, id), eq(homes.isDeleted, false)));

    if (!home) {
      return NextResponse.json({ error: "Home not found" }, { status: 404 });
    }

    const body = await request.json();
    const data = imageSchema.parse(body);

    const [image] = await db
      .insert(homeImages)
      .values({
        homeId: id,
        url: data.url,
        caption: data.caption,
        sortOrder: data.sortOrder ?? 0,
      })
      .returning();

    return NextResponse.json(image);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid input", details: error.errors },
        { status: 400 }
      );
    }
    console.error("Error adding home image:", error);
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

  try {
    const { searchParams } = new URL(request.url);
    const imageId = searchParams.get("imageId");

    if (!imageId) {
      return NextResponse.json(
        { error: "Image ID is required" },
        { status: 400 }
      );
    }

    await db
      .delete(homeImages)
      .where(and(eq(homeImages.id, imageId), eq(homeImages.homeId, id)));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting home image:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
