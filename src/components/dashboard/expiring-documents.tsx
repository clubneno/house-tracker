"use client";

import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useTranslation } from "@/lib/i18n/client";

interface ExpiringDocumentsProps {
  documents: {
    id: string;
    documentTitle: string | null;
    fileName: string;
    houseDocumentType: string | null;
    expiresAt: Date | null;
  }[];
}

function getDaysUntilExpiry(date: Date): number {
  const today = new Date();
  const diffTime = date.getTime() - today.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

export function ExpiringDocuments({ documents }: ExpiringDocumentsProps) {
  const { t } = useTranslation();

  const documentTypeLabels: Record<string, string> = {
    purchase_agreement: t("documents.purchaseAgreement"),
    utility_contract: t("documents.utilityContract"),
    insurance: t("documents.insurance"),
    building_permit: t("documents.buildingPermit"),
    tax_document: t("documents.taxDocument"),
    warranty: t("documents.warranty"),
    manual: t("documents.manual"),
    other: t("documents.other"),
  };

  if (documents.length === 0) {
    return (
      <Card>
        <CardHeader className="flex flex-row items-center gap-2">
          <FileText className="h-5 w-5 text-muted-foreground" />
          <CardTitle className="text-base">{t("dashboard.expiringDocuments")}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">{t("common.noDocuments")}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div className="flex items-center gap-2">
          <FileText className="h-5 w-5 text-muted-foreground" />
          <CardTitle className="text-base">{t("dashboard.expiringDocuments")}</CardTitle>
        </div>
        <Link href="/documents" className="text-sm text-primary hover:underline">
          {t("common.viewAll")}
        </Link>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {documents.map((doc) => {
            const daysLeft = doc.expiresAt
              ? getDaysUntilExpiry(doc.expiresAt)
              : 0;
            const isUrgent = daysLeft <= 30;
            const isExpired = daysLeft < 0;

            return (
              <div
                key={doc.id}
                className="flex items-center justify-between text-sm"
              >
                <div>
                  <div className="font-medium">
                    {doc.documentTitle || doc.fileName}
                  </div>
                  {doc.houseDocumentType && (
                    <div className="text-muted-foreground text-xs">
                      {documentTypeLabels[doc.houseDocumentType] || doc.houseDocumentType}
                    </div>
                  )}
                </div>
                <Badge variant={isExpired ? "destructive" : isUrgent ? "warning" : "secondary"}>
                  {isExpired ? t("common.overdue") : `${daysLeft} ${t("common.days")}`}
                </Badge>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
