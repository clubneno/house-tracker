import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { expenseCategories } from "@/lib/db/schema";
import { neonAuth } from "@/lib/auth/server";
import { asc } from "drizzle-orm";
import { z } from "zod";

const categorySchema = z.object({
  name: z.string().min(1, "Name is required").max(100),
  label: z.string().min(1, "Label is required").max(255),
  iconName: z.string().min(1, "Icon name is required").max(100),
  color: z.string().min(1, "Color is required").max(50),
  bgColor: z.string().min(1, "Background color is required").max(50),
  sortOrder: z.number().int().optional(),
});

export async function GET() {
  const { session } = await neonAuth();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const categories = await db
    .select()
    .from(expenseCategories)
    .orderBy(asc(expenseCategories.sortOrder), asc(expenseCategories.name));

  return NextResponse.json(categories);
}

export async function POST(request: Request) {
  const { session } = await neonAuth();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const data = categorySchema.parse(body);

    // Get the max sort order to place new category at the end
    const maxSortOrder = await db
      .select({ sortOrder: expenseCategories.sortOrder })
      .from(expenseCategories)
      .orderBy(asc(expenseCategories.sortOrder))
      .limit(1);

    const newSortOrder = data.sortOrder ?? ((maxSortOrder[0]?.sortOrder ?? 0) + 1);

    const [category] = await db
      .insert(expenseCategories)
      .values({
        name: data.name.toLowerCase().replace(/\s+/g, "_"),
        label: data.label,
        iconName: data.iconName,
        color: data.color,
        bgColor: data.bgColor,
        sortOrder: newSortOrder,
      })
      .returning();

    return NextResponse.json(category);
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
        { error: "A category with this name already exists" },
        { status: 400 }
      );
    }
    console.error("Error creating category:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
