export const dynamic = 'force-dynamic';

import { db } from "@/lib/db";
import { purchaseLineItems, purchases, suppliers } from "@/lib/db/schema";
import { eq, and, isNotNull } from "drizzle-orm";
import { WarrantiesPageClient } from "@/components/warranties/warranties-page-client";

function getDaysUntilExpiry(date: Date): number {
  const today = new Date();
  const diffTime = date.getTime() - today.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

async function getWarranties() {
  const results = await db
    .select({
      lineItem: purchaseLineItems,
      purchaseId: purchases.id,
      purchaseDate: purchases.date,
      homeId: purchases.homeId,
      supplierName: suppliers.companyName,
      supplierFirstName: suppliers.firstName,
      supplierLastName: suppliers.lastName,
      supplierType: suppliers.type,
    })
    .from(purchaseLineItems)
    .innerJoin(purchases, eq(purchaseLineItems.purchaseId, purchases.id))
    .leftJoin(suppliers, eq(purchases.supplierId, suppliers.id))
    .where(
      and(
        eq(purchases.isDeleted, false),
        isNotNull(purchaseLineItems.warrantyExpiresAt)
      )
    )
    .orderBy(purchaseLineItems.warrantyExpiresAt);

  return results.map((r) => ({
    ...r.lineItem,
    purchaseId: r.purchaseId,
    purchaseDate: r.purchaseDate,
    homeId: r.homeId,
    supplierName:
      r.supplierType === "company"
        ? r.supplierName
        : `${r.supplierFirstName} ${r.supplierLastName}`,
    daysUntilExpiry: r.lineItem.warrantyExpiresAt
      ? getDaysUntilExpiry(r.lineItem.warrantyExpiresAt)
      : 0,
  }));
}

export default async function WarrantiesPage() {
  const warranties = await getWarranties();

  return <WarrantiesPageClient warranties={warranties} />;
}
