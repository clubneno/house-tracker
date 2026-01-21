export const dynamic = 'force-dynamic';

import { db } from "@/lib/db";
import { purchases, areas, suppliers } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";
import { ReportsPageClient } from "@/components/reports/reports-page-client";

async function getReportData() {
  // Get all purchases with their details
  const purchaseList = await db
    .select({
      id: purchases.id,
      date: purchases.date,
      totalAmount: purchases.totalAmount,
      purchaseType: purchases.purchaseType,
      expenseCategory: purchases.expenseCategory,
      supplierId: purchases.supplierId,
      areaId: purchases.areaId,
      homeId: purchases.homeId,
    })
    .from(purchases)
    .where(eq(purchases.isDeleted, false))
    .orderBy(desc(purchases.date));

  // Get all areas
  const areaList = await db
    .select({
      id: areas.id,
      name: areas.name,
      budget: areas.budget,
      homeId: areas.homeId,
    })
    .from(areas);

  // Get all suppliers
  const supplierList = await db
    .select({
      id: suppliers.id,
      companyName: suppliers.companyName,
      firstName: suppliers.firstName,
      lastName: suppliers.lastName,
      type: suppliers.type,
    })
    .from(suppliers)
    .where(eq(suppliers.isDeleted, false));

  return {
    purchases: purchaseList.map((p) => ({
      ...p,
      totalAmount: Number(p.totalAmount),
    })),
    areas: areaList.map((a) => ({
      ...a,
      budget: Number(a.budget || 0),
    })),
    suppliers: supplierList.map((s) => ({
      id: s.id,
      name:
        s.type === "company"
          ? s.companyName || "Unknown Company"
          : `${s.firstName || ""} ${s.lastName || ""}`.trim() || "Unknown",
      type: s.type,
    })),
  };
}

export default async function ReportsPage() {
  const data = await getReportData();

  return (
    <ReportsPageClient
      purchases={data.purchases}
      areas={data.areas}
      suppliers={data.suppliers}
    />
  );
}
