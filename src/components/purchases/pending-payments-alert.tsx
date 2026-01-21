"use client";

import { Card, CardContent } from "@/components/ui/card";
import { useTranslation } from "@/lib/i18n/client";

interface PendingPaymentsAlertProps {
  pendingCount: number;
}

export function PendingPaymentsAlert({ pendingCount }: PendingPaymentsAlertProps) {
  const { t } = useTranslation();

  if (pendingCount === 0) {
    return null;
  }

  return (
    <Card className="bg-yellow-50 border-yellow-200 dark:bg-yellow-900/20">
      <CardContent className="py-3">
        <p className="text-sm text-yellow-800 dark:text-yellow-200">
          {t("purchases.youHave")} {pendingCount} {pendingCount !== 1 ? t("purchases.pendingPayments") : t("purchases.pendingPayment")}
        </p>
      </CardContent>
    </Card>
  );
}
