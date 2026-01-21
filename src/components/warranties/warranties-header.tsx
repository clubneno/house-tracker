"use client";

import { useTranslation } from "@/lib/i18n/client";

export function WarrantiesHeader() {
  const { t } = useTranslation();

  return (
    <div>
      <h1 className="text-3xl font-bold tracking-tight">{t("warranties.title")}</h1>
      <p className="text-muted-foreground">
        {t("warranties.subtitle")}
      </p>
    </div>
  );
}
