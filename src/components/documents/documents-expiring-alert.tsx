"use client";

import { AlertTriangle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useTranslation } from "@/lib/i18n/client";

interface DocumentsExpiringAlertProps {
  count: number;
}

export function DocumentsExpiringAlert({ count }: DocumentsExpiringAlertProps) {
  const { t } = useTranslation();

  if (count === 0) return null;

  return (
    <Alert variant="destructive">
      <AlertTriangle className="h-4 w-4" />
      <AlertTitle>{t("documents.documentsExpiringSoon")}</AlertTitle>
      <AlertDescription>
        {t("documents.documentsExpiringWarning").replace("{count}", String(count))}
      </AlertDescription>
    </Alert>
  );
}
