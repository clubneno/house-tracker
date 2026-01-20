import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { rooms, areas, purchases, purchaseLineItems, attachments, suppliers } from "@/lib/db/schema";
import { auth } from "@/lib/auth";
import { eq, sum, desc, and } from "drizzle-orm";
import { z } from "zod";

const roomSchema = z.object({
  areaId: z.string().uuid(),
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
  budget: z.number().positive().optional().nullable(),
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

  const [room] = await db
    .select({
      room: rooms,
      areaName: areas.name,
    })
    .from(rooms)
    .leftJoin(areas, eq(rooms.areaId, areas.id))
    .where(eq(rooms.id, id))
    .limit(1);

  if (!room) {
    return NextResponse.json({ error: "Room not found" }, { status: 404 });
  }

  // Get purchases for this room
  const roomPurchases = await db
    .select({
      id: purchases.id,
      date: purchases.date,
      totalAmount: purchases.totalAmount,
      purchaseType: purchases.purchaseType,
      paymentStatus: purchases.paymentStatus,
      supplierName: suppliers.companyName,
      supplierFirstName: suppliers.firstName,
      supplierLastName: suppliers.lastName,
      supplierType: suppliers.type,
    })
    .from(purchases)
    .leftJoin(suppliers, eq(purchases.supplierId, suppliers.id))
    .where(and(eq(purchases.roomId, id), eq(purchases.isDeleted, false)))
    .orderBy(desc(purchases.date));

  // Get gallery images
  const gallery = await db
    .select()
    .from(attachments)
    .where(eq(attachments.roomId, id))
    .orderBy(desc(attachments.createdAt));

  // Get total spending
  const [totalSpending] = await db
    .select({ total: sum(purchases.totalAmount) })
    .from(purchases)
    .where(and(eq(purchases.roomId, id), eq(purchases.isDeleted, false)));

  return NextResponse.json({
    ...room.room,
    areaName: room.areaName,
    purchases: roomPurchases.map((p) => ({
      ...p,
      totalAmount: Number(p.totalAmount),
      supplierName:
        p.supplierType === "company"
          ? p.supplierName
          : `${p.supplierFirstName} ${p.supplierLastName}`,
    })),
    gallery,
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
    const data = roomSchema.parse(body);

    // Verify area exists
    const [area] = await db
      .select()
      .from(areas)
      .where(eq(areas.id, data.areaId))
      .limit(1);

    if (!area) {
      return NextResponse.json({ error: "Area not found" }, { status: 404 });
    }

    const [room] = await db
      .update(rooms)
      .set({
        areaId: data.areaId,
        name: data.name,
        description: data.description,
        budget: data.budget?.toString(),
        updatedAt: new Date(),
      })
      .where(eq(rooms.id, id))
      .returning();

    if (!room) {
      return NextResponse.json({ error: "Room not found" }, { status: 404 });
    }

    return NextResponse.json(room);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid input", details: error.errors },
        { status: 400 }
      );
    }
    console.error("Error updating room:", error);
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

  await db.delete(rooms).where(eq(rooms.id, id));

  return NextResponse.json({ success: true });
}
