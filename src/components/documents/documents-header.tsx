"use client";

import { useTranslation } from "@/lib/i18n/client";

export function DocumentsHeader() {
  const { t } = useTranslation();

  return (
    <div>
      <h1 className="text-3xl font-bold tracking-tight">{t("documents.title")}</h1>
      <p className="text-muted-foreground">
        {t("documents.subtitle")}
      </p>
    </div>
  );
}
