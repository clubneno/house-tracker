"use client";

import { DoorOpen } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { useTranslation } from "@/lib/i18n/client";
import { AddRoomWithAreaDialog } from "./add-room-with-area-dialog";

export function NoRooms() {
  const { t } = useTranslation();

  return (
    <Card>
      <CardContent className="flex flex-col items-center justify-center py-12">
        <DoorOpen className="h-12 w-12 text-muted-foreground mb-4" />
        <p className="text-muted-foreground mb-4">{t("rooms.noRooms")}</p>
        <AddRoomWithAreaDialog />
      </CardContent>
    </Card>
  );
}
