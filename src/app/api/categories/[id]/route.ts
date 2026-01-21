import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { expenseCategories, purchases } from "@/lib/db/schema";
import { neonAuth } from "@/lib/auth/server";
import { eq, count } from "drizzle-orm";
import { z } from "zod";

const categorySchema = z.object({
  name: z.string().min(1, "Name is required").max(100),
  label: z.string().min(1, "Label is required").max(255),
  iconName: z.string().min(1, "Icon name is required").max(100),
  color: z.string().min(1, "Color is required").max(50),
  bgColor: z.string().min(1, "Background color is required").max(50),
  sortOrder: z.number().int().optional(),
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

  const [category] = await db
    .select()
    .from(expenseCategories)
    .where(eq(expenseCategories.id, id))
    .limit(1);

  if (!category) {
    return NextResponse.json({ error: "Category not found" }, { status: 404 });
  }

  // Get usage count
  const [usageCount] = await db
    .select({ count: count() })
    .from(purchases)
    .where(eq(purchases.expenseCategory, category.name));

  return NextResponse.json({
    ...category,
    usageCount: Number(usageCount?.count || 0),
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
    const data = categorySchema.parse(body);

    // Get the current category to check if name is changing
    const [currentCategory] = await db
      .select()
      .from(expenseCategories)
      .where(eq(expenseCategories.id, id))
      .limit(1);

    if (!currentCategory) {
      return NextResponse.json({ error: "Category not found" }, { status: 404 });
    }

    const newName = data.name.toLowerCase().replace(/\s+/g, "_");
    const oldName = currentCategory.name;

    // Update the category
    const [category] = await db
      .update(expenseCategories)
      .set({
        name: newName,
        label: data.label,
        iconName: data.iconName,
        color: data.color,
        bgColor: data.bgColor,
        sortOrder: data.sortOrder,
      })
      .where(eq(expenseCategories.id, id))
      .returning();

    // If name changed, update all purchases using this category
    if (oldName !== newName) {
      await db
        .update(purchases)
        .set({ expenseCategory: newName })
        .where(eq(purchases.expenseCategory, oldName));
    }

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
    console.error("Error updating category:", error);
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

  // Get the category to check usage
  const [category] = await db
    .select()
    .from(expenseCategories)
    .where(eq(expenseCategories.id, id))
    .limit(1);

  if (!category) {
    return NextResponse.json({ error: "Category not found" }, { status: 404 });
  }

  // Check if category is in use
  const [usageCount] = await db
    .select({ count: count() })
    .from(purchases)
    .where(eq(purchases.expenseCategory, category.name));

  if (usageCount && usageCount.count > 0) {
    return NextResponse.json(
      {
        error: "Cannot delete category that is in use",
        usageCount: Number(usageCount.count),
        message: `This category is used by ${usageCount.count} purchase(s). Please reassign them first.`
      },
      { status: 400 }
    );
  }

  await db.delete(expenseCategories).where(eq(expenseCategories.id, id));

  return NextResponse.json({ success: true });
}
