"use client";

import { Layers } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { useTranslation } from "@/lib/i18n/client";
import { AddAreaDialog } from "./add-area-dialog";

export function NoAreas() {
  const { t } = useTranslation();

  return (
    <Card>
      <CardContent className="flex flex-col items-center justify-center py-12">
        <Layers className="h-12 w-12 text-muted-foreground mb-4" />
        <p className="text-muted-foreground mb-4">{t("areas.noAreas")}</p>
        <AddAreaDialog />
      </CardContent>
    </Card>
  );
}
