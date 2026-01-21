"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";
import { useTranslation } from "@/lib/i18n/client";

interface ReportsStatsProps {
  totalSpending: number;
  purchaseCount: number;
}

export function ReportsStats({ totalSpending, purchaseCount }: ReportsStatsProps) {
  const { t } = useTranslation();

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">{t("reports.totalSpending")}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {formatCurrency(totalSpending)}
          </div>
          <p className="text-xs text-muted-foreground">
            {t("common.across")} {purchaseCount} {t("common.purchases")}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">
            {t("reports.averagePerPurchase")}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {formatCurrency(purchaseCount > 0 ? totalSpending / purchaseCount : 0)}
          </div>
          <p className="text-xs text-muted-foreground">{t("common.perTransaction")}</p>
        </CardContent>
      </Card>
    </div>
  );
}
