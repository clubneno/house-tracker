export const dynamic = 'force-dynamic';

import { db } from "@/lib/db";
import { suppliers, areas, rooms, homes } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { PurchaseForm } from "@/components/forms/purchase-form";
import { NewPurchaseHeader } from "@/components/purchases/new-purchase-header";

async function getFormData() {
  const [supplierList, areaList, roomList, homeList] = await Promise.all([
    db
      .select()
      .from(suppliers)
      .where(eq(suppliers.isDeleted, false))
      .orderBy(suppliers.companyName, suppliers.firstName),
    db.select().from(areas).orderBy(areas.name),
    db.select().from(rooms).orderBy(rooms.name),
    db.select().from(homes).where(eq(homes.isDeleted, false)).orderBy(homes.name),
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
      nameLt: a.nameLt,
    })),
    rooms: roomList.map((r) => ({
      id: r.id,
      name: r.name,
      nameLt: r.nameLt,
      areaId: r.areaId,
    })),
    homes: homeList.map((h) => ({
      id: h.id,
      name: h.name,
      nameLt: h.nameLt,
    })),
  };
}

export default async function NewPurchasePage({
  searchParams,
}: {
  searchParams: Promise<{ supplier?: string; room?: string }>;
}) {
  const { suppliers, areas, rooms, homes } = await getFormData();
  const params = await searchParams;

  return (
    <div className="space-y-6">
      <NewPurchaseHeader />

      <PurchaseForm
        suppliers={suppliers}
        areas={areas}
        rooms={rooms}
        homes={homes}
        defaultSupplierId={params.supplier}
        defaultRoomId={params.room}
      />
    </div>
  );
}
