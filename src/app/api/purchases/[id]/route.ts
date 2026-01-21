import { NextResponse } from "next/server";
import { db, dbPool } from "@/lib/db";
import { purchases, purchaseLineItems, suppliers, areas, rooms, attachments } from "@/lib/db/schema";
import { neonAuth } from "@/lib/auth/server";
import { eq, and } from "drizzle-orm";
import { z } from "zod";

const lineItemSchema = z.object({
  id: z.string().uuid().optional(),
  description: z.string().min(1),
  brand: z.string().optional().nullable(),
  quantity: z.number().positive(),
  unitPrice: z.number().min(0),
  areaId: z.string().uuid().optional().nullable(),
  roomId: z.string().uuid().optional().nullable(),
  warrantyMonths: z.number().optional().nullable(),
  notes: z.string().optional().nullable(),
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

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { session } = await neonAuth();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const [result] = await db
    .select({
      purchase: purchases,
      supplierName: suppliers.companyName,
      supplierFirstName: suppliers.firstName,
      supplierLastName: suppliers.lastName,
      supplierType: suppliers.type,
      supplierEmail: suppliers.email,
      supplierPhone: suppliers.phone,
      areaName: areas.name,
      roomName: rooms.name,
    })
    .from(purchases)
    .leftJoin(suppliers, eq(purchases.supplierId, suppliers.id))
    .leftJoin(areas, eq(purchases.areaId, areas.id))
    .leftJoin(rooms, eq(purchases.roomId, rooms.id))
    .where(and(eq(purchases.id, id), eq(purchases.isDeleted, false)))
    .limit(1);

  if (!result) {
    return NextResponse.json({ error: "Purchase not found" }, { status: 404 });
  }

  // Get line items with area/room names
  const lineItemsWithAreas = await db
    .select({
      lineItem: purchaseLineItems,
      areaName: areas.name,
      roomName: rooms.name,
    })
    .from(purchaseLineItems)
    .leftJoin(areas, eq(purchaseLineItems.areaId, areas.id))
    .leftJoin(rooms, eq(purchaseLineItems.roomId, rooms.id))
    .where(eq(purchaseLineItems.purchaseId, id));

  // Get attachments
  const purchaseAttachments = await db
    .select()
    .from(attachments)
    .where(eq(attachments.purchaseId, id));

  return NextResponse.json({
    ...result.purchase,
    totalAmount: Number(result.purchase.totalAmount),
    supplierName:
      result.supplierType === "company"
        ? result.supplierName
        : `${result.supplierFirstName} ${result.supplierLastName}`,
    supplierEmail: result.supplierEmail,
    supplierPhone: result.supplierPhone,
    areaName: result.areaName,
    roomName: result.roomName,
    lineItems: lineItemsWithAreas.map((row) => ({
      ...row.lineItem,
      quantity: Number(row.lineItem.quantity),
      unitPrice: Number(row.lineItem.unitPrice),
      totalPrice: Number(row.lineItem.totalPrice),
      areaName: row.areaName,
      roomName: row.roomName,
    })),
    attachments: purchaseAttachments,
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
        const [areaData] = await db
          .select({ homeId: areas.homeId })
          .from(areas)
          .where(eq(areas.id, areaId));
        if (areaData?.homeId) {
          homeId = areaData.homeId;
        }
      }
    }

    // Use transaction to ensure atomicity
    const result = await dbPool.transaction(async (tx) => {
      // Update purchase
      const [purchase] = await tx
        .update(purchases)
        .set({
          date: new Date(data.date),
          supplierId: data.supplierId,
          purchaseType: data.purchaseType,
          expenseCategory: data.expenseCategory,
          totalAmount: totalAmount.toString(),
          currency: data.currency,
          paymentStatus: data.paymentStatus,
          paymentDueDate: data.paymentDueDate ? new Date(data.paymentDueDate) : null,
          notes: data.notes,
          homeId: homeId,
          updatedAt: new Date(),
        })
        .where(eq(purchases.id, id))
        .returning();

      if (!purchase) {
        throw new Error("Purchase not found");
      }

      // Delete existing line items and recreate
      await tx.delete(purchaseLineItems).where(eq(purchaseLineItems.purchaseId, id));

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

      return { purchase, lineItems };
    });

    return NextResponse.json({
      ...result.purchase,
      lineItems: result.lineItems,
    });
  } catch (error) {
    if (error instanceof Error && error.message === "Purchase not found") {
      return NextResponse.json({ error: "Purchase not found" }, { status: 404 });
    }
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid input", details: error.errors },
        { status: 400 }
      );
    }
    console.error("Error updating purchase:", error);
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
  const [purchase] = await db
    .update(purchases)
    .set({ isDeleted: true, updatedAt: new Date() })
    .where(eq(purchases.id, id))
    .returning();

  if (!purchase) {
    return NextResponse.json({ error: "Purchase not found" }, { status: 404 });
  }

  return NextResponse.json({ success: true });
}
