'use client';

import { Home as HomeIcon, ChevronDown } from 'lucide-react';
import { useHome } from '@/lib/contexts/home-context';
import { useTranslation } from '@/lib/i18n/client';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';

export function HomeSelector() {
  const { homes, selectedHomeId, setSelectedHomeId, isLoading } = useHome();
  const { t, locale } = useTranslation();

  if (isLoading) {
    return (
      <div className="px-2 py-2">
        <Skeleton className="h-10 w-full" />
      </div>
    );
  }

  // Get localized name for a home
  const getHomeName = (home: { name: string; nameLt?: string | null }) => {
    if (locale === 'lt' && home.nameLt) {
      return home.nameLt;
    }
    return home.name;
  };

  return (
    <div className="px-2 py-2">
      <Select
        value={selectedHomeId || 'all'}
        onValueChange={(value) => setSelectedHomeId(value === 'all' ? null : value)}
      >
        <SelectTrigger className="w-full bg-primary/10 border-0 hover:bg-primary/20 text-primary">
          <div className="flex items-center gap-2">
            <HomeIcon className="h-4 w-4" />
            <SelectValue placeholder={t('homes.selectHome')} />
          </div>
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">
            <span className="font-medium">{t('homes.allHomes')}</span>
          </SelectItem>
          {homes.map((home) => (
            <SelectItem key={home.id} value={home.id}>
              {getHomeName(home)}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
