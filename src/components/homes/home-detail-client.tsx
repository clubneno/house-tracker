'use client';

import Link from 'next/link';
import { ArrowLeft, Edit, MapPin, Calendar, Layers } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatCurrency } from '@/lib/utils';
import { HomeGallery } from '@/components/homes/home-gallery';
import { useTranslation } from '@/lib/i18n/client';
import type { Home, HomeImage, Area } from '@/lib/db/schema';

interface HomeDetailClientProps {
  home: Home & {
    areaCount: number;
    totalSpending: number;
    images: HomeImage[];
    areas: Area[];
  };
}

export function HomeDetailClient({ home }: HomeDetailClientProps) {
  const { t, locale } = useTranslation();

  const displayName = locale === 'lt' && home.nameLt ? home.nameLt : home.name;
  const displayDescription = locale === 'lt' && home.descriptionLt ? home.descriptionLt : home.description;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/homes">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold tracking-tight">{displayName}</h1>
          {locale === 'lt' && home.nameLt && home.name !== home.nameLt && (
            <p className="text-muted-foreground">{home.name}</p>
          )}
          {locale !== 'lt' && home.nameLt && (
            <p className="text-muted-foreground">{home.nameLt}</p>
          )}
        </div>
        <Button variant="outline" asChild>
          <Link href={`/homes/${home.id}/edit`}>
            <Edit className="mr-2 h-4 w-4" />
            {t('common.edit')}
          </Link>
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          {/* Cover Image / Gallery */}
          <Card>
            <CardContent className="p-0">
              <HomeGallery
                homeId={home.id}
                coverImageUrl={home.coverImageUrl}
                images={home.images}
              />
            </CardContent>
          </Card>

          {/* Description */}
          {displayDescription && (
            <Card>
              <CardHeader>
                <CardTitle>{t('homes.description')}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="whitespace-pre-wrap">{displayDescription}</p>
              </CardContent>
            </Card>
          )}

          {/* Areas */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Layers className="h-5 w-5" />
                {t('homes.areas')} ({home.areaCount})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {home.areas.length === 0 ? (
                <p className="text-muted-foreground">{t('areas.noAreas')}</p>
              ) : (
                <div className="space-y-2">
                  {home.areas.map((area) => {
                    const areaDisplayName = locale === 'lt' && area.nameLt ? area.nameLt : area.name;
                    const areaSecondaryName = locale === 'lt' && area.nameLt ? area.name : area.nameLt;
                    return (
                      <Link
                        key={area.id}
                        href={`/areas?areaId=${area.id}`}
                        className="block p-3 rounded-lg border hover:bg-accent transition-colors"
                      >
                        <div className="font-medium">{areaDisplayName}</div>
                        {areaSecondaryName && (
                          <div className="text-sm text-muted-foreground">{areaSecondaryName}</div>
                        )}
                      </Link>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Quick Info */}
          <Card>
            <CardHeader>
              <CardTitle>{t('homes.basicInfo')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {home.address && (
                <div className="flex items-start gap-3">
                  <MapPin className="h-5 w-5 text-muted-foreground shrink-0 mt-0.5" />
                  <div>
                    <div className="text-sm font-medium">{t('homes.address')}</div>
                    <div className="text-sm text-muted-foreground">{home.address}</div>
                  </div>
                </div>
              )}
              {home.purchaseDate && (
                <div className="flex items-start gap-3">
                  <Calendar className="h-5 w-5 text-muted-foreground shrink-0 mt-0.5" />
                  <div>
                    <div className="text-sm font-medium">{t('homes.purchaseDate')}</div>
                    <div className="text-sm text-muted-foreground">
                      {new Date(home.purchaseDate).toLocaleDateString(locale === 'lt' ? 'lt-LT' : 'en-US')}
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Stats */}
          <Card>
            <CardHeader>
              <CardTitle>{t('reports.title')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="text-sm font-medium">{t('homes.totalSpending')}</div>
                <div className="text-2xl font-bold">
                  {formatCurrency(home.totalSpending)}
                </div>
              </div>
              <div>
                <div className="text-sm font-medium">{t('homes.areas')}</div>
                <div className="text-2xl font-bold">{home.areaCount}</div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
