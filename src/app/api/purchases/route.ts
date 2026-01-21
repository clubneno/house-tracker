import { NextResponse } from "next/server";
import { db, dbPool } from "@/lib/db";
import { purchases, purchaseLineItems, purchaseLineItemTags, suppliers, areas, rooms } from "@/lib/db/schema";
import { neonAuth } from "@/lib/auth/server";
import { eq, desc, and } from "drizzle-orm";
import { z } from "zod";

const lineItemSchema = z.object({
  description: z.string().min(1),
  brand: z.string().optional().nullable(),
  quantity: z.number().positive(),
  unitPrice: z.number().min(0),
  areaId: z.string().uuid().optional().nullable(),
  roomId: z.string().uuid().optional().nullable(),
  warrantyMonths: z.number().optional().nullable(),
  notes: z.string().optional().nullable(),
  tagIds: z.array(z.string().uuid()).optional(),
});

const purchaseSchema = z.object({
  date: z.string(),
  supplierId: z.string().uuid(),
  homeId: z.string().uuid().optional().nullable(),
  purchaseType: z.enum(["service", "materials", "products", "indirect"]),
  // Changed from enum to string to support user-defined categories
  expenseCategory: z.string().max(100).optional().nullable(),
  currency: z.string().default("EUR"),
  paymentStatus: z.enum(["pending", "partial", "paid"]).default("pending"),
  paymentDueDate: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
  lineItems: z.array(lineItemSchema).min(1),
});

export async function GET(request: Request) {
  const { session } = await neonAuth();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const supplierId = searchParams.get("supplierId");
  const roomId = searchParams.get("roomId");
  const areaId = searchParams.get("areaId");
  const homeId = searchParams.get("homeId");
  const status = searchParams.get("status");
  const category = searchParams.get("category");

  let conditions = [eq(purchases.isDeleted, false)];

  if (supplierId) {
    conditions.push(eq(purchases.supplierId, supplierId));
  }
  if (roomId) {
    conditions.push(eq(purchases.roomId, roomId));
  }
  if (areaId) {
    conditions.push(eq(purchases.areaId, areaId));
  }
  if (homeId) {
    conditions.push(eq(purchases.homeId, homeId));
  }
  if (status) {
    conditions.push(eq(purchases.paymentStatus, status as "pending" | "partial" | "paid"));
  }
  if (category) {
    conditions.push(eq(purchases.expenseCategory, category));
  }

  const result = await db
    .select({
      purchase: purchases,
      supplierName: suppliers.companyName,
      supplierFirstName: suppliers.firstName,
      supplierLastName: suppliers.lastName,
      supplierType: suppliers.type,
      areaName: areas.name,
      roomName: rooms.name,
    })
    .from(purchases)
    .leftJoin(suppliers, eq(purchases.supplierId, suppliers.id))
    .leftJoin(areas, eq(purchases.areaId, areas.id))
    .leftJoin(rooms, eq(purchases.roomId, rooms.id))
    .where(and(...conditions))
    .orderBy(desc(purchases.date));

  return NextResponse.json(
    result.map((r) => ({
      ...r.purchase,
      totalAmount: Number(r.purchase.totalAmount),
      supplierName:
        r.supplierType === "company"
          ? r.supplierName
          : `${r.supplierFirstName} ${r.supplierLastName}`,
      areaName: r.areaName,
      roomName: r.roomName,
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
    const data = purchaseSchema.parse(body);

    // Calculate total from line items
    const totalAmount = data.lineItems.reduce(
      (sum, item) => sum + item.quantity * item.unitPrice,
      0
    );

    // Determine homeId - either from explicit data or from the first area in line items
    let homeId = data.homeId;
    if (!homeId) {
      // Try to get homeId from area
      const areaId = data.lineItems.find(item => item.areaId)?.areaId;
      if (areaId) {
        const [areaData] = await db.select({ homeId: areas.homeId }).from(areas).where(eq(areas.id, areaId));
        if (areaData?.homeId) {
          homeId = areaData.homeId;
        }
      }
    }

    // Use transaction to ensure atomicity
    const result = await dbPool.transaction(async (tx) => {
      // Create purchase
      const [purchase] = await tx
        .insert(purchases)
        .values({
          date: new Date(data.date),
          supplierId: data.supplierId,
          homeId: homeId,
          purchaseType: data.purchaseType,
          expenseCategory: data.expenseCategory,
          totalAmount: totalAmount.toString(),
          currency: data.currency,
          paymentStatus: data.paymentStatus,
          paymentDueDate: data.paymentDueDate ? new Date(data.paymentDueDate) : null,
          notes: data.notes,
        })
        .returning();

      // Create line items
      const lineItems = await tx
        .insert(purchaseLineItems)
        .values(
          data.lineItems.map((item) => ({
            purchaseId: purchase.id,
            description: item.description,
            brand: item.brand,
            quantity: item.quantity.toString(),
            unitPrice: item.unitPrice.toString(),
            totalPrice: (item.quantity * item.unitPrice).toString(),
            areaId: item.areaId,
            roomId: item.roomId,
            warrantyMonths: item.warrantyMonths,
            warrantyExpiresAt: item.warrantyMonths
              ? new Date(
                  new Date(data.date).getTime() +
                    item.warrantyMonths * 30 * 24 * 60 * 60 * 1000
                )
              : null,
            notes: item.notes,
          }))
        )
        .returning();

      // Create tag associations for each line item
      for (let i = 0; i < lineItems.length; i++) {
        const lineItem = lineItems[i];
        const tagIds = data.lineItems[i].tagIds || [];
        if (tagIds.length > 0) {
          await tx.insert(purchaseLineItemTags).values(
            tagIds.map((tagId) => ({
              lineItemId: lineItem.id,
              tagId,
            }))
          );
        }
      }

      return { purchase, lineItems };
    });

    return NextResponse.json({
      ...result.purchase,
      lineItems: result.lineItems,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid input", details: error.errors },
        { status: 400 }
      );
    }
    console.error("Error creating purchase:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
