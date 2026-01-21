"use client";

import { FileText } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { useTranslation } from "@/lib/i18n/client";
import { AddDocumentDialog } from "./add-document-dialog";

export function NoDocuments() {
  const { t } = useTranslation();

  return (
    <Card>
      <CardContent className="flex flex-col items-center justify-center py-12">
        <FileText className="h-12 w-12 text-muted-foreground mb-4" />
        <p className="text-muted-foreground mb-4">{t("documents.noDocuments")}</p>
        <AddDocumentDialog />
      </CardContent>
    </Card>
  );
}
