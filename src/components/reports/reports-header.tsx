"use client";

import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTranslation } from "@/lib/i18n/client";

export function ReportsHeader() {
  const { t } = useTranslation();

  return (
    <div className="flex items-center justify-between">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">{t("reports.title")}</h1>
        <p className="text-muted-foreground">
          {t("reports.subtitle")}
        </p>
      </div>
      <Button variant="outline">
        <Download className="mr-2 h-4 w-4" />
        {t("reports.exportCsv")}
      </Button>
    </div>
  );
}
