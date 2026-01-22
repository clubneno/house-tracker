'use client';

import { useState, useMemo } from 'react';
import { useTranslation } from '@/lib/i18n/client';
import { useHome } from '@/lib/contexts/home-context';
import { AddAreaDialog } from '@/components/areas/add-area-dialog';
import { NoAreas } from '@/components/areas/no-areas';
import { AreaCard } from '@/components/areas/area-card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { Area } from '@/lib/db/schema';

interface AreasPageClientProps {
  initialAreas: (Area & {
    roomCount: number;
    totalSpending: number;
    homeName?: string | null;
    homeNameLt?: string | null;
  })[];
}

export function AreasPageClient({ initialAreas }: AreasPageClientProps) {
  const { t, locale } = useTranslation();
  const { selectedHomeId, homes } = useHome();
  const [filterHomeId, setFilterHomeId] = useState<string>('all');

  // Filter areas based on selected home from context OR local filter
  const filteredAreas = useMemo(() => {
    // If a specific home is selected in the sidebar, filter by that
    if (selectedHomeId) {
      return initialAreas.filter(area => area.homeId === selectedHomeId);
    }
    // If in "All Homes" mode and user selected a filter
    if (filterHomeId && filterHomeId !== 'all') {
      return initialAreas.filter(area => area.homeId === filterHomeId);
    }
    // Show all areas
    return initialAreas;
  }, [initialAreas, selectedHomeId, filterHomeId]);

  // Show filter only when in "All Homes" mode and there are multiple homes
  const showHomeFilter = !selectedHomeId && homes.length > 1;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div className="flex-1">
          <h1 className="text-3xl font-bold tracking-tight">{t('areas.title')}</h1>
          <p className="text-muted-foreground">{t('areas.subtitle')}</p>
        </div>
        <div className="flex items-center gap-2">
          {showHomeFilter && (
            <Select value={filterHomeId} onValueChange={setFilterHomeId}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder={t('homes.selectHome')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('homes.allHomes')}</SelectItem>
                {homes.map((home) => (
                  <SelectItem key={home.id} value={home.id}>
                    {locale === 'lt' && home.nameLt ? home.nameLt : home.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          <AddAreaDialog />
        </div>
      </div>

      {filteredAreas.length === 0 ? (
        <NoAreas />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredAreas.map((area) => (
            <AreaCard
              key={area.id}
              area={area}
            />
          ))}
        </div>
      )}
    </div>
  );
}
