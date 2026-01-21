import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { tags } from "@/lib/db/schema";
import { neonAuth } from "@/lib/auth/server";
import { asc } from "drizzle-orm";
import { z } from "zod";

const tagSchema = z.object({
  name: z.string().min(1, "Name is required").max(100),
  color: z.string().optional(),
});

export async function GET() {
  const { session } = await neonAuth();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const allTags = await db
    .select()
    .from(tags)
    .orderBy(asc(tags.name));

  return NextResponse.json(allTags);
}

export async function POST(request: Request) {
  const { session } = await neonAuth();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const data = tagSchema.parse(body);

    const [tag] = await db
      .insert(tags)
      .values({
        name: data.name,
        color: data.color || "bg-gray-100 text-gray-800",
      })
      .returning();

    return NextResponse.json(tag);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid input", details: error.errors },
        { status: 400 }
      );
    }
    // Check for unique constraint violation
    if (error instanceof Error && error.message.includes("unique")) {
      return NextResponse.json(
        { error: "Tag with this name already exists" },
        { status: 409 }
      );
    }
    console.error("Error creating tag:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
