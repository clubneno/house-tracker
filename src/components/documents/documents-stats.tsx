"use client";

import { Card, CardContent } from "@/components/ui/card";
import { useTranslation } from "@/lib/i18n/client";

interface DocumentsStatsProps {
  totalDocuments: number;
  documentTypes: number;
  expiringSoon: number;
  withExpiryDates: number;
}

export function DocumentsStats({
  totalDocuments,
  documentTypes,
  expiringSoon,
  withExpiryDates,
}: DocumentsStatsProps) {
  const { t } = useTranslation();

  return (
    <div className="grid gap-4 md:grid-cols-4">
      <Card>
        <CardContent className="pt-6">
          <div className="text-2xl font-bold">{totalDocuments}</div>
          <p className="text-xs text-muted-foreground">{t("documents.totalDocuments")}</p>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="pt-6">
          <div className="text-2xl font-bold">{documentTypes}</div>
          <p className="text-xs text-muted-foreground">{t("documents.documentTypes")}</p>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="pt-6">
          <div className="text-2xl font-bold text-warning">{expiringSoon}</div>
          <p className="text-xs text-muted-foreground">{t("documents.expiringSoon")}</p>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="pt-6">
          <div className="text-2xl font-bold">{withExpiryDates}</div>
          <p className="text-xs text-muted-foreground">{t("documents.withExpiryDates")}</p>
        </CardContent>
      </Card>
    </div>
  );
}
