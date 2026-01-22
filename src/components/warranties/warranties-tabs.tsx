"use client";

import Link from "next/link";
import { Shield } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formatDate } from "@/lib/utils";
import { useTranslation } from "@/lib/i18n/client";

interface Warranty {
  id: string;
  description: string;
  brand: string | null;
  supplierName: string;
  purchaseId: string;
  purchaseDate: Date;
  warrantyExpiresAt: Date;
  daysUntilExpiry: number;
}

interface WarrantiesTabsProps {
  expiringSoon: Warranty[];
  expiring90Days: Warranty[];
  active: Warranty[];
  expired: Warranty[];
}

export function WarrantiesTabs({
  expiringSoon,
  expiring90Days,
  active,
  expired,
}: WarrantiesTabsProps) {
  const { t } = useTranslation();

  return (
    <Tabs defaultValue="expiring">
      <TabsList>
        <TabsTrigger value="expiring">
          {t("warranties.expiringSoon")} ({expiringSoon.length})
        </TabsTrigger>
        <TabsTrigger value="active">
          {t("warranties.active")} ({active.length + expiring90Days.length})
        </TabsTrigger>
        <TabsTrigger value="expired">{t("warranties.expired")} ({expired.length})</TabsTrigger>
      </TabsList>

      <TabsContent value="expiring" className="mt-6">
        <WarrantyList warranties={expiringSoon} showUrgent />
      </TabsContent>

      <TabsContent value="active" className="mt-6">
        <WarrantyList warranties={[...expiring90Days, ...active]} />
      </TabsContent>

      <TabsContent value="expired" className="mt-6">
        <WarrantyList warranties={expired} expired />
      </TabsContent>
    </Tabs>
  );
}

function WarrantyList({
  warranties,
  showUrgent,
  expired,
}: {
  warranties: Warranty[];
  showUrgent?: boolean;
  expired?: boolean;
}) {
  const { t, locale } = useTranslation();

  if (warranties.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <Shield className="h-12 w-12 text-muted-foreground mb-4" />
          <p className="text-muted-foreground">
            {expired ? t("warranties.noExpiredWarranties") : t("warranties.noWarrantiesInCategory")}
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="space-y-4">
          {warranties.map((warranty) => (
            <Link
              key={warranty.id}
              href={`/purchases/${warranty.purchaseId}`}
              className="flex items-center justify-between p-4 rounded-lg border hover:bg-muted/50 transition-colors"
            >
              <div className="space-y-1">
                <div className="font-medium">{warranty.description}</div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  {warranty.brand && <span>{warranty.brand}</span>}
                  <span>{t("common.from")} {warranty.supplierName}</span>
                </div>
                <div className="text-xs text-muted-foreground">
                  {t("common.purchased")}: {formatDate(warranty.purchaseDate, locale)}
                </div>
              </div>
              <div className="text-right">
                <Badge
                  variant={
                    expired
                      ? "secondary"
                      : showUrgent
                      ? "destructive"
                      : warranty.daysUntilExpiry <= 90
                      ? "warning"
                      : "success"
                  }
                >
                  {expired
                    ? t("common.expiredDaysAgo").replace("{days}", String(Math.abs(warranty.daysUntilExpiry)))
                    : `${warranty.daysUntilExpiry} ${t("common.daysLeft")}`}
                </Badge>
                <p className="text-xs text-muted-foreground mt-1">
                  {t("common.expires")}: {formatDate(warranty.warrantyExpiresAt, locale)}
                </p>
              </div>
            </Link>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
