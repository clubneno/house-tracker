export const dynamic = 'force-dynamic';

import { db } from "@/lib/db";
import { suppliers, areas, rooms } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";
import { PurchaseForm } from "@/components/forms/purchase-form";

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

export default async function NewPurchasePage({
  searchParams,
}: {
  searchParams: Promise<{ supplier?: string; room?: string }>;
}) {
  const { suppliers, areas, rooms } = await getFormData();
  const params = await searchParams;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Add Purchase</h1>
        <p className="text-muted-foreground">
          Record a new purchase with line items
        </p>
      </div>

      <PurchaseForm
        suppliers={suppliers}
        areas={areas}
        rooms={rooms}
        defaultSupplierId={params.supplier}
        defaultRoomId={params.room}
      />
    </div>
  );
}
