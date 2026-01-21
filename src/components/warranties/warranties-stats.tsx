"use client";

import { Shield, AlertTriangle, CheckCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useTranslation } from "@/lib/i18n/client";

interface WarrantiesStatsProps {
  expiringSoon: number;
  expiring90Days: number;
  active: number;
  expired: number;
}

export function WarrantiesStats({
  expiringSoon,
  expiring90Days,
  active,
  expired,
}: WarrantiesStatsProps) {
  const { t } = useTranslation();

  return (
    <div className="grid gap-4 md:grid-cols-4">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-red-500" />
            {t("warranties.expiringSoon")}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-red-500">
            {expiringSoon}
          </div>
          <p className="text-xs text-muted-foreground">{t("common.within30Days")}</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Shield className="h-4 w-4 text-yellow-500" />
            {t("warranties.expiringIn90Days")}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-yellow-500">
            {expiring90Days}
          </div>
          <p className="text-xs text-muted-foreground">{t("common.within90Days")}</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <CheckCircle className="h-4 w-4 text-green-500" />
            {t("warranties.active")}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-green-500">
            {active}
          </div>
          <p className="text-xs text-muted-foreground">{t("common.moreThan90Days")}</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">{t("warranties.expired")}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-muted-foreground">
            {expired}
          </div>
          <p className="text-xs text-muted-foreground">{t("common.pastExpiry")}</p>
        </CardContent>
      </Card>
    </div>
  );
}
