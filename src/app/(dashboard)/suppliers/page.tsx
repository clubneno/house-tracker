export const dynamic = 'force-dynamic';

import { db } from "@/lib/db";
import { suppliers, purchases } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";
import { SuppliersPageClient } from "@/components/suppliers/suppliers-page-client";

interface PageProps {
  searchParams: Promise<{ search?: string; type?: string }>;
}

async function getSuppliers() {
  // Get all suppliers
  const supplierList = await db
    .select()
    .from(suppliers)
    .where(eq(suppliers.isDeleted, false))
    .orderBy(desc(suppliers.createdAt));

  // Get all purchases grouped by supplier with homeId
  const purchaseList = await db
    .select({
      supplierId: purchases.supplierId,
      homeId: purchases.homeId,
      totalAmount: purchases.totalAmount,
    })
    .from(purchases)
    .where(eq(purchases.isDeleted, false));

  // Group purchases by supplier
  const purchasesBySupplier = new Map<string, { homeId: string | null; totalAmount: number }[]>();
  for (const p of purchaseList) {
    if (!purchasesBySupplier.has(p.supplierId)) {
      purchasesBySupplier.set(p.supplierId, []);
    }
    purchasesBySupplier.get(p.supplierId)!.push({
      homeId: p.homeId,
      totalAmount: Number(p.totalAmount),
    });
  }

  // Combine suppliers with their purchases
  return supplierList.map((supplier) => ({
    ...supplier,
    purchases: purchasesBySupplier.get(supplier.id) || [],
  }));
}

export default async function SuppliersPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const supplierList = await getSuppliers();

  return (
    <SuppliersPageClient
      initialSuppliers={supplierList}
      searchQuery={params.search}
      typeFilter={params.type}
    />
  );
}
