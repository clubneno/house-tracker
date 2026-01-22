export const dynamic = 'force-dynamic';

import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { suppliers, purchases } from "@/lib/db/schema";
import { eq, and, desc, sum } from "drizzle-orm";
import { SupplierDetailContent } from "@/components/suppliers/supplier-detail-content";

async function getSupplier(id: string) {
  const [supplier] = await db
    .select()
    .from(suppliers)
    .where(and(eq(suppliers.id, id), eq(suppliers.isDeleted, false)))
    .limit(1);

  if (!supplier) return null;

  const purchaseHistory = await db
    .select({
      id: purchases.id,
      date: purchases.date,
      totalAmount: purchases.totalAmount,
      purchaseType: purchases.purchaseType,
      paymentStatus: purchases.paymentStatus,
    })
    .from(purchases)
    .where(and(eq(purchases.supplierId, id), eq(purchases.isDeleted, false)))
    .orderBy(desc(purchases.date));

  const [totalSpending] = await db
    .select({ total: sum(purchases.totalAmount) })
    .from(purchases)
    .where(and(eq(purchases.supplierId, id), eq(purchases.isDeleted, false)));

  return {
    ...supplier,
    purchases: purchaseHistory,
    totalSpending: Number(totalSpending?.total || 0),
  };
}

export default async function SupplierDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supplier = await getSupplier(id);

  if (!supplier) {
    notFound();
  }

  return (
    <SupplierDetailContent
      id={id}
      supplier={{
        id: supplier.id,
        type: supplier.type as "company" | "individual",
        companyName: supplier.companyName,
        firstName: supplier.firstName,
        lastName: supplier.lastName,
        email: supplier.email,
        phone: supplier.phone,
        companyAddress: supplier.companyAddress,
        rating: supplier.rating,
        notes: supplier.notes,
        createdAt: supplier.createdAt,
        purchases: supplier.purchases,
        totalSpending: supplier.totalSpending,
      }}
    />
  );
}
