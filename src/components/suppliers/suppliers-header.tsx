"use client";

import { useTranslation } from "@/lib/i18n/client";

export function SuppliersHeader() {
  const { t } = useTranslation();

  return (
    <div>
      <h1 className="text-3xl font-bold tracking-tight">{t("suppliers.title")}</h1>
      <p className="text-muted-foreground">{t("suppliers.subtitle")}</p>
    </div>
  );
}
