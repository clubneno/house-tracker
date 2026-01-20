import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { purchases, purchaseLineItems, suppliers, areas, rooms } from "@/lib/db/schema";
import { neonAuth } from "@/lib/auth/server";
import { eq, desc, and } from "drizzle-orm";
import { z } from "zod";

const lineItemSchema = z.object({
  description: z.string().min(1),
  brand: z.string().optional().nullable(),
  quantity: z.number().positive(),
  unitPrice: z.number().min(0),
  warrantyMonths: z.number().optional().nullable(),
  notes: z.string().optional().nullable(),
});

const purchaseSchema = z.object({
  date: z.string(),
  supplierId: z.string().uuid(),
  purchaseType: z.enum(["service", "materials", "products", "indirect"]),
  roomId: z.string().uuid().optional().nullable(),
  areaId: z.string().uuid().optional().nullable(),
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
  const status = searchParams.get("status");

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
  if (status) {
    conditions.push(eq(purchases.paymentStatus, status as "pending" | "partial" | "paid"));
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

    // Create purchase
    const [purchase] = await db
      .insert(purchases)
      .values({
        date: new Date(data.date),
        supplierId: data.supplierId,
        purchaseType: data.purchaseType,
        roomId: data.roomId,
        areaId: data.areaId,
        totalAmount: totalAmount.toString(),
        currency: data.currency,
        paymentStatus: data.paymentStatus,
        paymentDueDate: data.paymentDueDate ? new Date(data.paymentDueDate) : null,
        notes: data.notes,
      })
      .returning();

    // Create line items
    const lineItems = await db
      .insert(purchaseLineItems)
      .values(
        data.lineItems.map((item) => ({
          purchaseId: purchase.id,
          description: item.description,
          brand: item.brand,
          quantity: item.quantity.toString(),
          unitPrice: item.unitPrice.toString(),
          totalPrice: (item.quantity * item.unitPrice).toString(),
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

    return NextResponse.json({
      ...purchase,
      lineItems,
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
