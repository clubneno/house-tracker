'use client';

import Link from 'next/link';
import { Building2, MapPin, Calendar, Layers, Trash2 } from 'lucide-react';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useTranslation } from '@/lib/i18n/client';
import { formatCurrency } from '@/lib/utils';
import type { Home } from '@/lib/db/schema';

interface HomeCardProps {
  home: Home & {
    areaCount: number;
    totalSpending: number;
  };
  onDelete?: (id: string) => void;
}

export function HomeCard({ home, onDelete }: HomeCardProps) {
  const { t, locale } = useTranslation();

  const displayName = locale === 'lt' && home.nameLt ? home.nameLt : home.name;
  const displayDescription = locale === 'lt' && home.descriptionLt ? home.descriptionLt : home.description;

  return (
    <Card className="overflow-hidden">
      {home.coverImageUrl ? (
        <div className="aspect-video relative">
          <img
            src={home.coverImageUrl}
            alt={displayName}
            className="absolute inset-0 w-full h-full object-cover"
          />
        </div>
      ) : (
        <div className="aspect-video bg-muted flex items-center justify-center">
          <Building2 className="h-12 w-12 text-muted-foreground" />
        </div>
      )}
      <CardHeader className="pb-2">
        <Link href={`/homes/${home.id}`} className="hover:underline">
          <h3 className="text-lg font-semibold">{displayName}</h3>
        </Link>
        {displayDescription && (
          <p className="text-sm text-muted-foreground line-clamp-2">
            {displayDescription}
          </p>
        )}
      </CardHeader>
      <CardContent className="space-y-2">
        {home.address && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <MapPin className="h-4 w-4" />
            <span className="line-clamp-1">{home.address}</span>
          </div>
        )}
        {home.purchaseDate && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Calendar className="h-4 w-4" />
            <span>{new Date(home.purchaseDate).toLocaleDateString()}</span>
          </div>
        )}
        <div className="flex items-center justify-between pt-2">
          <div className="flex items-center gap-2 text-sm">
            <Layers className="h-4 w-4 text-muted-foreground" />
            <span>{home.areaCount} {t('homes.areas')}</span>
          </div>
          <div className="text-sm font-medium">
            {formatCurrency(home.totalSpending)}
          </div>
        </div>
      </CardContent>
      <CardFooter className="pt-0">
        <div className="flex gap-2 w-full">
          <Button variant="outline" className="flex-1" asChild>
            <Link href={`/homes/${home.id}`}>{t('common.view')}</Link>
          </Button>
          {onDelete && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onDelete(home.id)}
              className="text-destructive hover:text-destructive"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
        </div>
      </CardFooter>
    </Card>
  );
}
