'use client';

import Link from 'next/link';
import { Plus, Building2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { HomesList } from './homes-list';
import { useTranslation } from '@/lib/i18n/client';
import type { Home } from '@/lib/db/schema';

interface HomesPageClientProps {
  initialHomes: (Home & {
    areaCount: number;
    totalSpending: number;
  })[];
}

export function HomesPageClient({ initialHomes }: HomesPageClientProps) {
  const { t } = useTranslation();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{t('homes.title')}</h1>
          <p className="text-muted-foreground">
            {t('homes.subtitle')}
          </p>
        </div>
        <Button asChild>
          <Link href="/homes/new">
            <Plus className="mr-2 h-4 w-4" />
            {t('homes.addHome')}
          </Link>
        </Button>
      </div>

      {initialHomes.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-12">
          <Building2 className="h-12 w-12 text-muted-foreground mb-4" />
          <h2 className="text-lg font-semibold">{t('homes.noHomes')}</h2>
          <p className="text-muted-foreground text-center mt-1 mb-4">
            {t('homes.noHomesDescription')}
          </p>
          <Button asChild>
            <Link href="/homes/new">
              <Plus className="mr-2 h-4 w-4" />
              {t('homes.addFirstHome')}
            </Link>
          </Button>
        </div>
      ) : (
        <HomesList initialHomes={initialHomes} />
      )}
    </div>
  );
}
