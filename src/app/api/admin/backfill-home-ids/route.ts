import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { purchases, purchaseLineItems, areas } from "@/lib/db/schema";
import { neonAuth } from "@/lib/auth/server";
import { eq, isNull, sql } from "drizzle-orm";

export async function POST() {
  const { session } = await neonAuth();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // Find all purchases without homeId
    const purchasesWithoutHome = await db
      .select({ id: purchases.id })
      .from(purchases)
      .where(isNull(purchases.homeId));

    let updated = 0;
    let skipped = 0;

    for (const purchase of purchasesWithoutHome) {
      // Get all line items with areaIds for this purchase
      const lineItems = await db
        .select({ areaId: purchaseLineItems.areaId })
        .from(purchaseLineItems)
        .where(eq(purchaseLineItems.purchaseId, purchase.id));

      // Get unique areaIds from line items
      const areaIds = [...new Set(lineItems.map(li => li.areaId).filter(Boolean))];

      if (areaIds.length === 0) {
        skipped++;
        continue;
      }

      // Get homeIds for all areas
      const areasWithHomes = await db
        .select({ id: areas.id, homeId: areas.homeId })
        .from(areas)
        .where(sql`${areas.id} IN ${areaIds}`);

      // Get unique homeIds
      const homeIds = [...new Set(areasWithHomes.map(a => a.homeId).filter(Boolean))];

      if (homeIds.length === 0) {
        skipped++;
        continue;
      }

      if (homeIds.length > 1) {
        // Multiple homes in one purchase - skip and log warning
        console.warn(`Purchase ${purchase.id} has line items from multiple homes: ${homeIds.join(', ')}`);
        skipped++;
        continue;
      }

      // All line items belong to the same home
      await db
        .update(purchases)
        .set({ homeId: homeIds[0] })
        .where(eq(purchases.id, purchase.id));
      updated++;
    }

    return NextResponse.json({
      success: true,
      updated,
      skipped,
      total: purchasesWithoutHome.length,
    });
  } catch (error) {
    console.error("Error backfilling home IDs:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
