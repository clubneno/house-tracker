export const dynamic = 'force-dynamic';

import { db } from "@/lib/db";
import { purchases, suppliers, areas, rooms, homes } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";
import { PurchasesPageClient } from "@/components/purchases/purchases-page-client";

interface PageProps {
  searchParams: Promise<{ status?: string; category?: string }>;
}

async function getPurchases() {
  const result = await db
    .select({
      purchase: purchases,
      supplierName: suppliers.companyName,
      supplierFirstName: suppliers.firstName,
      supplierLastName: suppliers.lastName,
      supplierType: suppliers.type,
      areaName: areas.name,
      roomName: rooms.name,
      homeName: homes.name,
      homeNameLt: homes.nameLt,
    })
    .from(purchases)
    .leftJoin(suppliers, eq(purchases.supplierId, suppliers.id))
    .leftJoin(areas, eq(purchases.areaId, areas.id))
    .leftJoin(rooms, eq(purchases.roomId, rooms.id))
    .leftJoin(homes, eq(purchases.homeId, homes.id))
    .where(eq(purchases.isDeleted, false))
    .orderBy(desc(purchases.date));

  return result.map((r) => ({
    ...r.purchase,
    totalAmount: Number(r.purchase.totalAmount),
    supplierName:
      r.supplierType === "company"
        ? r.supplierName
        : `${r.supplierFirstName} ${r.supplierLastName}`,
    areaName: r.areaName,
    roomName: r.roomName,
    homeName: r.homeName,
    homeNameLt: r.homeNameLt,
  }));
}

export default async function PurchasesPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const purchaseList = await getPurchases();

  return (
    <PurchasesPageClient
      purchases={purchaseList}
      statusFilter={params.status}
      categoryFilter={params.category}
    />
  );
}
