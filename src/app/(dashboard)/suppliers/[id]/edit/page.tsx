export const dynamic = 'force-dynamic';

import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { suppliers } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { SupplierForm } from "@/components/forms/supplier-form";
import { EditSupplierHeader } from "@/components/suppliers/edit-supplier-header";

async function getSupplier(id: string) {
  const [supplier] = await db
    .select()
    .from(suppliers)
    .where(and(eq(suppliers.id, id), eq(suppliers.isDeleted, false)))
    .limit(1);

  return supplier;
}

export default async function EditSupplierPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supplier = await getSupplier(id);

  if (!supplier) {
    notFound();
  }

  const displayName =
    supplier.type === "company"
      ? supplier.companyName
      : `${supplier.firstName} ${supplier.lastName}`;

  return (
    <div className="space-y-6">
      <EditSupplierHeader supplierId={id} displayName={displayName || ""} />
      <SupplierForm supplier={supplier} />
    </div>
  );
}
