'use client';

import Link from 'next/link';
import { Building2, MapPin, Calendar, Layers, Trash2, Pencil, Check } from 'lucide-react';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useTranslation } from '@/lib/i18n/client';
import { formatCurrency, cn } from '@/lib/utils';
import type { Home } from '@/lib/db/schema';

interface HomeCardProps {
  home: Home & {
    areaCount: number;
    totalSpending: number;
  };
  onDelete?: (id: string) => void;
  isSelected?: boolean;
  onSelect?: () => void;
  compact?: boolean;
}

export function HomeCard({ home, onDelete, isSelected, onSelect, compact }: HomeCardProps) {
  const { t, locale } = useTranslation();

  const displayName = locale === 'lt' && home.nameLt ? home.nameLt : home.name;
  const displayDescription = locale === 'lt' && home.descriptionLt ? home.descriptionLt : home.description;

  const handleCardClick = (e: React.MouseEvent) => {
    if (onSelect) {
      e.preventDefault();
      onSelect();
    }
  };

  if (compact) {
    return (
      <Card
        className={cn(
          "overflow-hidden transition-all flex-shrink-0 w-[200px]",
          onSelect && "cursor-pointer hover:shadow-md",
          isSelected && "ring-2 ring-primary"
        )}
        onClick={handleCardClick}
      >
        {home.coverImageUrl ? (
          <div className="aspect-[4/3] relative">
            <img
              src={home.coverImageUrl}
              alt={displayName}
              className="absolute inset-0 w-full h-full object-cover"
            />
            {isSelected && (
              <div className="absolute top-2 right-2 h-6 w-6 rounded-full bg-primary flex items-center justify-center">
                <Check className="h-4 w-4 text-primary-foreground" />
              </div>
            )}
          </div>
        ) : (
          <div className="aspect-[4/3] bg-muted flex items-center justify-center relative">
            <Building2 className="h-8 w-8 text-muted-foreground" />
            {isSelected && (
              <div className="absolute top-2 right-2 h-6 w-6 rounded-full bg-primary flex items-center justify-center">
                <Check className="h-4 w-4 text-primary-foreground" />
              </div>
            )}
          </div>
        )}
        <CardContent className="p-3 space-y-1">
          <h3 className="font-semibold text-sm line-clamp-1">{displayName}</h3>
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <div className="flex items-center gap-1">
              <Layers className="h-3 w-3" />
              <span>{home.areaCount} {t('homes.areas')}</span>
            </div>
          </div>
          <div className="text-sm font-medium">
            {formatCurrency(home.totalSpending)}
          </div>
        </CardContent>
        <CardFooter className="p-3 pt-0">
          <div className="flex gap-1 w-full">
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              asChild
              onClick={(e) => e.stopPropagation()}
            >
              <Link href={`/homes/${home.id}/edit`}>
                <Pencil className="h-3.5 w-3.5" />
              </Link>
            </Button>
            {onDelete && (
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-destructive hover:text-destructive"
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(home.id);
                }}
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            )}
          </div>
        </CardFooter>
      </Card>
    );
  }

  return (
    <Card
      className={cn(
        "overflow-hidden transition-all",
        onSelect && "cursor-pointer hover:shadow-md",
        isSelected && "ring-2 ring-primary"
      )}
      onClick={handleCardClick}
    >
      {home.coverImageUrl ? (
        <div className="aspect-video relative">
          <img
            src={home.coverImageUrl}
            alt={displayName}
            className="absolute inset-0 w-full h-full object-cover"
          />
          {isSelected && (
            <div className="absolute top-2 right-2 h-6 w-6 rounded-full bg-primary flex items-center justify-center">
              <Check className="h-4 w-4 text-primary-foreground" />
            </div>
          )}
        </div>
      ) : (
        <div className="aspect-video bg-muted flex items-center justify-center relative">
          <Building2 className="h-12 w-12 text-muted-foreground" />
          {isSelected && (
            <div className="absolute top-2 right-2 h-6 w-6 rounded-full bg-primary flex items-center justify-center">
              <Check className="h-4 w-4 text-primary-foreground" />
            </div>
          )}
        </div>
      )}
      <CardHeader className="pb-2">
        <Link href={`/homes/${home.id}`} className="hover:underline" onClick={(e) => e.stopPropagation()}>
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
          <Button variant="outline" className="flex-1" asChild onClick={(e) => e.stopPropagation()}>
            <Link href={`/homes/${home.id}`}>{t('common.view')}</Link>
          </Button>
          {onDelete && (
            <Button
              variant="ghost"
              size="icon"
              onClick={(e) => {
                e.stopPropagation();
                onDelete(home.id);
              }}
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
