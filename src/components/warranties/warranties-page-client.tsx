'use client';

import { useState, useMemo } from 'react';
import { useTranslation } from '@/lib/i18n/client';
import { useHome } from '@/lib/contexts/home-context';
import { WarrantiesHeader } from '@/components/warranties/warranties-header';
import { WarrantiesStats } from '@/components/warranties/warranties-stats';
import { WarrantiesTabs } from '@/components/warranties/warranties-tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface WarrantyItem {
  id: string;
  description: string;
  brand?: string | null;
  warrantyMonths?: number | null;
  warrantyExpiresAt?: Date | null;
  purchaseId: string;
  purchaseDate: Date;
  supplierName: string | null;
  daysUntilExpiry: number;
  homeId?: string | null;
}

interface WarrantiesPageClientProps {
  warranties: WarrantyItem[];
}

export function WarrantiesPageClient({ warranties }: WarrantiesPageClientProps) {
  const { t, locale } = useTranslation();
  const { selectedHomeId, homes } = useHome();
  const [filterHomeId, setFilterHomeId] = useState<string>('all');

  // Filter warranties based on selected home
  const filteredWarranties = useMemo(() => {
    if (selectedHomeId) {
      return warranties.filter(w => w.homeId === selectedHomeId);
    }
    if (filterHomeId && filterHomeId !== 'all') {
      return warranties.filter(w => w.homeId === filterHomeId);
    }
    return warranties;
  }, [warranties, selectedHomeId, filterHomeId]);

  // Categorize warranties
  const expiringSoon = filteredWarranties.filter(
    (w) => w.daysUntilExpiry > 0 && w.daysUntilExpiry <= 30
  );
  const expiring90Days = filteredWarranties.filter(
    (w) => w.daysUntilExpiry > 30 && w.daysUntilExpiry <= 90
  );
  const active = filteredWarranties.filter((w) => w.daysUntilExpiry > 90);
  const expired = filteredWarranties.filter((w) => w.daysUntilExpiry <= 0);

  const showHomeFilter = !selectedHomeId && homes.length > 1;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <WarrantiesHeader />
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
      </div>

      <WarrantiesStats
        expiringSoon={expiringSoon.length}
        expiring90Days={expiring90Days.length}
        active={active.length}
        expired={expired.length}
      />

      <WarrantiesTabs
        expiringSoon={expiringSoon as any}
        expiring90Days={expiring90Days as any}
        active={active as any}
        expired={expired as any}
      />
    </div>
  );
}
