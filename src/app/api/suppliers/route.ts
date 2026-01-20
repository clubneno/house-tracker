import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { suppliers } from "@/lib/db/schema";
import { neonAuth } from "@/lib/auth/server";
import { eq, desc, and, or, ilike } from "drizzle-orm";
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

export async function GET(request: Request) {
  const { session } = await neonAuth();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const search = searchParams.get("search");

  let query = db
    .select()
    .from(suppliers)
    .where(eq(suppliers.isDeleted, false))
    .orderBy(desc(suppliers.createdAt));

  if (search) {
    query = db
      .select()
      .from(suppliers)
      .where(
        and(
          eq(suppliers.isDeleted, false),
          or(
            ilike(suppliers.companyName, `%${search}%`),
            ilike(suppliers.firstName, `%${search}%`),
            ilike(suppliers.lastName, `%${search}%`),
            ilike(suppliers.email, `%${search}%`)
          )
        )
      )
      .orderBy(desc(suppliers.createdAt));
  }

  const result = await query;
  return NextResponse.json(result);
}

export async function POST(request: Request) {
  const { session } = await neonAuth();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

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
      .insert(suppliers)
      .values({
        type: data.type,
        companyName: data.companyName,
        companyAddress: data.companyAddress,
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        phone: data.phone,
        notes: data.notes,
        rating: data.rating,
      })
      .returning();

    return NextResponse.json(supplier);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid input", details: error.errors },
        { status: 400 }
      );
    }
    console.error("Error creating supplier:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
