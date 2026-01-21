export const dynamic = 'force-dynamic';

import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { db } from '@/lib/db';
import { homes } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { Button } from '@/components/ui/button';
import { HomeForm } from '@/components/homes/home-form';

async function getHome(id: string) {
  const [home] = await db
    .select()
    .from(homes)
    .where(and(eq(homes.id, id), eq(homes.isDeleted, false)));

  return home || null;
}

export default async function EditHomePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const home = await getHome(id);

  if (!home) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href={`/homes/${id}`}>
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Edit Home</h1>
          <p className="text-muted-foreground">
            Update information for {home.name}
          </p>
        </div>
      </div>
      <HomeForm home={home} />
    </div>
  );
}
