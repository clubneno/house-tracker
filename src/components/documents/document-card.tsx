"use client";

import { FileText, Calendar, ExternalLink, Clock } from "lucide-react";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatDate, formatFileSize } from "@/lib/utils";
import { EditDocumentDialog } from "./edit-document-dialog";
import { DeleteDocumentButton } from "./delete-document-button";
import { useTranslation } from "@/lib/i18n/client";

const documentTypeLabelKeys: Record<string, string> = {
  purchase_agreement: "purchaseAgreement",
  utility_contract: "utilityContract",
  insurance: "insurance",
  building_permit: "buildingPermit",
  tax_document: "taxDocument",
  warranty: "warranty",
  manual: "manual",
  other: "other",
};

const documentTypeColors: Record<string, "default" | "secondary" | "outline"> = {
  purchase_agreement: "default",
  utility_contract: "secondary",
  insurance: "default",
  building_permit: "outline",
  tax_document: "secondary",
  warranty: "outline",
  manual: "secondary",
  other: "outline",
};

interface Document {
  id: string;
  fileUrl: string;
  fileName: string;
  fileSizeBytes: number;
  houseDocumentType: string;
  documentTitle: string | null;
  documentDescription: string | null;
  expiresAt: string | null;
  createdAt: string;
}

interface DocumentCardProps {
  document: Document;
}

export function DocumentCard({ document }: DocumentCardProps) {
  const { t, locale } = useTranslation();
  const isExpiringSoon = document.expiresAt
    ? new Date(document.expiresAt) <= new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
    : false;

  const isExpired = document.expiresAt
    ? new Date(document.expiresAt) < new Date()
    : false;

  const getDocumentTypeLabel = (type: string) => {
    const labelKey = documentTypeLabelKeys[type];
    return labelKey ? t(`documents.${labelKey}`) : type;
  };

  return (
    <Card className="flex flex-col">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-muted-foreground flex-shrink-0" />
            <CardTitle className="text-base line-clamp-1">
              {document.documentTitle || document.fileName}
            </CardTitle>
          </div>
          <Badge variant={documentTypeColors[document.houseDocumentType] || "outline"}>
            {getDocumentTypeLabel(document.houseDocumentType)}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="flex-1 space-y-2">
        {document.documentDescription && (
          <p className="text-sm text-muted-foreground line-clamp-2">
            {document.documentDescription}
          </p>
        )}
        <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <Calendar className="h-3 w-3" />
            {t("documents.added")} {formatDate(document.createdAt, locale)}
          </span>
          <span>{formatFileSize(document.fileSizeBytes)}</span>
        </div>
        {document.expiresAt && (
          <div
            className={`flex items-center gap-1 text-xs ${
              isExpired
                ? "text-destructive"
                : isExpiringSoon
                ? "text-warning"
                : "text-muted-foreground"
            }`}
          >
            <Clock className="h-3 w-3" />
            {isExpired ? t("common.expired") : t("common.expires")} {formatDate(document.expiresAt, locale)}
          </div>
        )}
      </CardContent>
      <CardFooter className="pt-3 flex justify-between gap-2">
        <div className="flex gap-2">
          <EditDocumentDialog document={document} />
          <DeleteDocumentButton id={document.id} title={document.documentTitle || document.fileName} />
        </div>
        <Button variant="outline" size="sm" asChild>
          <a href={document.fileUrl} target="_blank" rel="noopener noreferrer">
            <ExternalLink className="mr-1 h-3 w-3" />
            {t("documents.view")}
          </a>
        </Button>
      </CardFooter>
    </Card>
  );
}
