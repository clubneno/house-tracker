"use client";

import { useTranslation } from "@/lib/i18n/client";

export function RoomsHeader() {
  const { t } = useTranslation();

  return (
    <div>
      <h1 className="text-3xl font-bold tracking-tight">{t("rooms.title")}</h1>
      <p className="text-muted-foreground">
        {t("rooms.subtitle")}
      </p>
    </div>
  );
}
