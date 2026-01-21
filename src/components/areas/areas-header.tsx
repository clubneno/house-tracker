"use client";

import { useTranslation } from "@/lib/i18n/client";

export function AreasHeader() {
  const { t } = useTranslation();

  return (
    <div>
      <h1 className="text-3xl font-bold tracking-tight">{t("areas.title")}</h1>
      <p className="text-muted-foreground">
        {t("areas.subtitle")}
      </p>
    </div>
  );
}
