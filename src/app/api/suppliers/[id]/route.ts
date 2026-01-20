import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { suppliers, purchases } from "@/lib/db/schema";
import { auth } from "@/lib/auth";
import { eq, and, desc, sum } from "drizzle-orm";
import { z } from "zod";

const supplierSchema = z.object({
  type: z.enum(["company", "individual"]),
  companyName: z.string().nullable().optional(),
  companyAddress: z.string().nullable().optional(),
  firstName: z.string().nullable().optional(),
  lastName: z.string().nullable().optional(),
  email: z.string().email().nullable().optional(),
  phone: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
  rating: z.number().min(1).max(5).nullable().optional(),
});

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const [supplier] = await db
    .select()
    .from(suppliers)
    .where(and(eq(suppliers.id, id), eq(suppliers.isDeleted, false)))
    .limit(1);

  if (!supplier) {
    return NextResponse.json({ error: "Supplier not found" }, { status: 404 });
  }

  // Get purchase history
  const purchaseHistory = await db
    .select({
      id: purchases.id,
      date: purchases.date,
      totalAmount: purchases.totalAmount,
      purchaseType: purchases.purchaseType,
      paymentStatus: purchases.paymentStatus,
    })
    .from(purchases)
    .where(and(eq(purchases.supplierId, id), eq(purchases.isDeleted, false)))
    .orderBy(desc(purchases.date));

  // Get total spending
  const [totalSpending] = await db
    .select({ total: sum(purchases.totalAmount) })
    .from(purchases)
    .where(and(eq(purchases.supplierId, id), eq(purchases.isDeleted, false)));

  return NextResponse.json({
    ...supplier,
    purchases: purchaseHistory,
    totalSpending: Number(totalSpending?.total || 0),
  });
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  try {
    const body = await request.json();
    const data = supplierSchema.parse(body);

    // Validate required fields based on type
    if (data.type === "company" && !data.companyName) {
      return NextResponse.json(
        { error: "Company name is required for company type" },
        { status: 400 }
      );
    }

    if (data.type === "individual" && (!data.firstName || !data.lastName)) {
      return NextResponse.json(
        { error: "First name and last name are required for individual type" },
        { status: 400 }
      );
    }

    const [supplier] = await db
      .update(suppliers)
      .set({
        type: data.type,
        companyName: data.companyName,
        companyAddress: data.companyAddress,
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        phone: data.phone,
        notes: data.notes,
        rating: data.rating,
        updatedAt: new Date(),
      })
      .where(eq(suppliers.id, id))
      .returning();

    if (!supplier) {
      return NextResponse.json({ error: "Supplier not found" }, { status: 404 });
    }

    return NextResponse.json(supplier);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid input", details: error.errors },
        { status: 400 }
      );
    }
    console.error("Error updating supplier:", error);
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
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  // Soft delete
  const [supplier] = await db
    .update(suppliers)
    .set({ isDeleted: true, updatedAt: new Date() })
    .where(eq(suppliers.id, id))
    .returning();

  if (!supplier) {
    return NextResponse.json({ error: "Supplier not found" }, { status: 404 });
  }

  return NextResponse.json({ success: true });
}
