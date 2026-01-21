"use client";

import { useTranslation } from "@/lib/i18n/client";

export function DashboardHeader() {
  const { t } = useTranslation();

  return (
    <div>
      <h1 className="text-3xl font-bold tracking-tight">{t("dashboard.title")}</h1>
      <p className="text-muted-foreground">{t("dashboard.subtitle")}</p>
    </div>
  );
}
