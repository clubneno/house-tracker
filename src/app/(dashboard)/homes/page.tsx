export const dynamic = 'force-dynamic';

import { db } from '@/lib/db';
import { homes, areas, purchases } from '@/lib/db/schema';
import { desc, count, sum, eq } from 'drizzle-orm';
import { HomesPageClient } from '@/components/homes/homes-page-client';

async function getHomes() {
  // Get all non-deleted homes
  const homesList = await db
    .select()
    .from(homes)
    .where(eq(homes.isDeleted, false))
    .orderBy(desc(homes.createdAt));

  // Get area counts per home (separate query to avoid cartesian product)
  const areaCounts = await db
    .select({
      homeId: areas.homeId,
      count: count(areas.id),
    })
    .from(areas)
    .groupBy(areas.homeId);

  const areaCountMap = new Map(
    areaCounts.map((a) => [a.homeId, Number(a.count || 0)])
  );

  // Get spending per home (separate query to avoid cartesian product)
  const spending = await db
    .select({
      homeId: purchases.homeId,
      total: sum(purchases.totalAmount),
    })
    .from(purchases)
    .where(eq(purchases.isDeleted, false))
    .groupBy(purchases.homeId);

  const spendingMap = new Map(
    spending.map((s) => [s.homeId, Number(s.total || 0)])
  );

  return homesList.map((home) => ({
    ...home,
    areaCount: areaCountMap.get(home.id) || 0,
    totalSpending: spendingMap.get(home.id) || 0,
  }));
}

export default async function HomesPage() {
  const homeList = await getHomes();

  return <HomesPageClient initialHomes={homeList} />;
}
