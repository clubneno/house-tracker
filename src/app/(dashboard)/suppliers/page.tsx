export const dynamic = 'force-dynamic';

import { db } from "@/lib/db";
import { suppliers, purchases } from "@/lib/db/schema";
import { eq, desc, sum, count, and } from "drizzle-orm";
import { SuppliersHeader } from "@/components/suppliers/suppliers-header";
import { SupplierSearch } from "@/components/suppliers/supplier-search";
import { SupplierCard } from "@/components/suppliers/supplier-card";
import { NoSuppliers } from "@/components/suppliers/no-suppliers";
import { AddSupplierButton } from "@/components/suppliers/add-supplier-button";

interface PageProps {
  searchParams: Promise<{ search?: string; type?: string }>;
}

async function getSuppliers(search?: string, type?: string) {
  const result = await db
    .select({
      supplier: suppliers,
      totalSpending: sum(purchases.totalAmount),
      purchaseCount: count(purchases.id),
    })
    .from(suppliers)
    .leftJoin(
      purchases,
      eq(purchases.supplierId, suppliers.id)
    )
    .where(eq(suppliers.isDeleted, false))
    .groupBy(suppliers.id)
    .orderBy(desc(suppliers.createdAt));

  let filtered = result.map((r) => ({
    ...r.supplier,
    totalSpending: Number(r.totalSpending || 0),
    purchaseCount: Number(r.purchaseCount || 0),
  }));

  // Filter by type
  if (type && type !== "all") {
    filtered = filtered.filter((s) => s.type === type);
  }

  // Filter by search
  if (search) {
    const searchLower = search.toLowerCase();
    filtered = filtered.filter((s) => {
      const name =
        s.type === "company"
          ? s.companyName?.toLowerCase() || ""
          : `${s.firstName} ${s.lastName}`.toLowerCase();
      return (
        name.includes(searchLower) ||
        s.email?.toLowerCase().includes(searchLower) ||
        s.phone?.toLowerCase().includes(searchLower)
      );
    });
  }

  return filtered;
}

export default async function SuppliersPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const supplierList = await getSuppliers(params.search, params.type);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <SuppliersHeader />
        <AddSupplierButton />
      </div>

      <SupplierSearch />

      {supplierList.length === 0 ? (
        <NoSuppliers />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {supplierList.map((supplier) => (
            <SupplierCard key={supplier.id} supplier={supplier} />
          ))}
        </div>
      )}
    </div>
  );
}
