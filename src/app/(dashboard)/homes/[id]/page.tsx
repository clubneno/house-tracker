export const dynamic = 'force-dynamic';

import { notFound } from 'next/navigation';
import { db } from '@/lib/db';
import { homes, homeImages, areas, purchases } from '@/lib/db/schema';
import { eq, count, sum, and, desc } from 'drizzle-orm';
import { HomeDetailClient } from '@/components/homes/home-detail-client';

async function getHome(id: string) {
  // Get home data
  const [home] = await db
    .select()
    .from(homes)
    .where(and(eq(homes.id, id), eq(homes.isDeleted, false)));

  if (!home) return null;

  // Get area count (separate query to avoid cartesian product)
  const [areaCountResult] = await db
    .select({ count: count(areas.id) })
    .from(areas)
    .where(eq(areas.homeId, id));

  // Get total spending (separate query to avoid cartesian product)
  const [spendingResult] = await db
    .select({ total: sum(purchases.totalAmount) })
    .from(purchases)
    .where(and(eq(purchases.homeId, id), eq(purchases.isDeleted, false)));

  // Get images
  const images = await db
    .select()
    .from(homeImages)
    .where(eq(homeImages.homeId, id))
    .orderBy(homeImages.sortOrder);

  // Get areas for this home
  const homeAreas = await db
    .select()
    .from(areas)
    .where(eq(areas.homeId, id))
    .orderBy(desc(areas.createdAt));

  return {
    ...home,
    areaCount: Number(areaCountResult?.count || 0),
    totalSpending: Number(spendingResult?.total || 0),
    images,
    areas: homeAreas,
  };
}

export default async function HomeDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const home = await getHome(id);

  if (!home) {
    notFound();
  }

  return <HomeDetailClient home={home} />;
}
