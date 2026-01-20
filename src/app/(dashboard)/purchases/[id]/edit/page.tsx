import { notFound } from "next/navigation";
import Link from "next/link";
import { db } from "@/lib/db";
import { purchases, purchaseLineItems, suppliers, areas, rooms } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PurchaseForm } from "@/components/forms/purchase-form";

async function getPurchase(id: string) {
  const [result] = await db
    .select({
      purchase: purchases,
      supplierName: suppliers.companyName,
      supplierFirstName: suppliers.firstName,
      supplierLastName: suppliers.lastName,
      supplierType: suppliers.type,
    })
    .from(purchases)
    .leftJoin(suppliers, eq(purchases.supplierId, suppliers.id))
    .where(and(eq(purchases.id, id), eq(purchases.isDeleted, false)))
    .limit(1);

  if (!result) return null;

  const lineItems = await db
    .select()
    .from(purchaseLineItems)
    .where(eq(purchaseLineItems.purchaseId, id));

  return {
    ...result.purchase,
    totalAmount: Number(result.purchase.totalAmount),
    supplierName:
      result.supplierType === "company"
        ? result.supplierName
        : `${result.supplierFirstName} ${result.supplierLastName}`,
    lineItems: lineItems.map((item) => ({
      ...item,
      quantity: Number(item.quantity),
      unitPrice: Number(item.unitPrice),
      totalPrice: Number(item.totalPrice),
    })),
  };
}

async function getFormData() {
  const [supplierList, areaList, roomList] = await Promise.all([
    db
      .select()
      .from(suppliers)
      .where(eq(suppliers.isDeleted, false))
      .orderBy(suppliers.companyName, suppliers.firstName),
    db.select().from(areas).orderBy(areas.name),
    db.select().from(rooms).orderBy(rooms.name),
  ]);

  return {
    suppliers: supplierList.map((s) => ({
      id: s.id,
      name: s.type === "company" ? s.companyName! : `${s.firstName} ${s.lastName}`,
      type: s.type,
    })),
    areas: areaList.map((a) => ({
      id: a.id,
      name: a.name,
    })),
    rooms: roomList.map((r) => ({
      id: r.id,
      name: r.name,
      areaId: r.areaId,
    })),
  };
}

export default async function EditPurchasePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [purchase, formData] = await Promise.all([
    getPurchase(id),
    getFormData(),
  ]);

  if (!purchase) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href={`/purchases/${id}`}>
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Edit Purchase</h1>
          <p className="text-muted-foreground">{purchase.supplierName}</p>
        </div>
      </div>

      <PurchaseForm
        suppliers={formData.suppliers}
        areas={formData.areas}
        rooms={formData.rooms}
        purchase={purchase}
      />
    </div>
  );
}
