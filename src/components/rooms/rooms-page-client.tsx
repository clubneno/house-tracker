'use client';

import { useState, useMemo } from 'react';
import { useTranslation } from '@/lib/i18n/client';
import { useHome } from '@/lib/contexts/home-context';
import { AddRoomWithAreaDialog } from '@/components/rooms/add-room-with-area-dialog';
import { NoRooms } from '@/components/rooms/no-rooms';
import { RoomsAreaGroup } from '@/components/rooms/rooms-area-group';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { Room } from '@/lib/db/schema';

interface RoomsPageClientProps {
  initialRooms: (Room & {
    areaName: string | null;
    areaNameLt?: string | null;
    homeId?: string | null;
    homeName?: string | null;
    homeNameLt?: string | null;
    totalSpending: number;
  })[];
}

export function RoomsPageClient({ initialRooms }: RoomsPageClientProps) {
  const { t, locale } = useTranslation();
  const { selectedHomeId, homes, isLoading: homesLoading } = useHome();
  const [filterHomeId, setFilterHomeId] = useState<string>('all');

  // Filter rooms based on selected home from context OR local filter
  const filteredRooms = useMemo(() => {
    // If a specific home is selected in the sidebar, filter by that
    if (selectedHomeId) {
      return initialRooms.filter(room => room.homeId === selectedHomeId);
    }
    // If in "All Homes" mode and user selected a filter
    if (filterHomeId && filterHomeId !== 'all') {
      return initialRooms.filter(room => room.homeId === filterHomeId);
    }
    // Show all rooms
    return initialRooms;
  }, [initialRooms, selectedHomeId, filterHomeId]);

  // Group rooms by area
  const groupedRooms = useMemo(() => {
    return filteredRooms.reduce(
      (acc, room) => {
        const areaName = (locale === 'lt' && room.areaNameLt) ? room.areaNameLt : (room.areaName || t('common.uncategorized'));
        if (!acc[areaName]) {
          acc[areaName] = [];
        }
        acc[areaName].push(room);
        return acc;
      },
      {} as Record<string, typeof filteredRooms>
    );
  }, [filteredRooms, locale, t]);

  // Show filter only when in "All Homes" mode and there are multiple homes
  const showHomeFilter = !selectedHomeId && homes.length > 1;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div className="flex-1">
          <h1 className="text-3xl font-bold tracking-tight">{t('rooms.title')}</h1>
          <p className="text-muted-foreground">{t('rooms.subtitle')}</p>
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
          <AddRoomWithAreaDialog />
        </div>
      </div>

      {filteredRooms.length === 0 ? (
        <NoRooms />
      ) : (
        <div className="space-y-8">
          {Object.entries(groupedRooms).map(([areaName, areaRooms]) => (
            <RoomsAreaGroup key={areaName} areaName={areaName} rooms={areaRooms} />
          ))}
        </div>
      )}
    </div>
  );
}
