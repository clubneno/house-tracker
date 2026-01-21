"use client";

import { useTranslation } from "@/lib/i18n/client";
import { DocumentCard } from "./document-card";

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

interface DocumentsGroupedListProps {
  documentsByType: Record<string, Document[]>;
}

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

export function DocumentsGroupedList({ documentsByType }: DocumentsGroupedListProps) {
  const { t } = useTranslation();

  const getDocumentTypeLabel = (type: string) => {
    const labelKey = documentTypeLabelKeys[type];
    return labelKey ? t(`documents.${labelKey}`) : type;
  };

  return (
    <div className="space-y-8">
      {Object.entries(documentsByType).map(([type, docs]) => (
        <div key={type}>
          <h2 className="text-lg font-semibold mb-4">
            {getDocumentTypeLabel(type)}
            <span className="text-sm font-normal text-muted-foreground ml-2">
              ({docs.length})
            </span>
          </h2>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {docs.map((doc) => (
              <DocumentCard key={doc.id} document={doc as any} />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
