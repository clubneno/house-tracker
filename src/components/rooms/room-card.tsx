"use client";

import Link from "next/link";
import { DoorOpen } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { formatCurrency } from "@/lib/utils";
import { useTranslation } from "@/lib/i18n/client";

interface RoomCardProps {
  room: {
    id: string;
    name: string;
    description: string | null;
    budget: string | number | null;
    totalSpending: number;
  };
}

export function RoomCard({ room }: RoomCardProps) {
  const { t } = useTranslation();
  const budget = Number(room.budget || 0);
  const percentage = budget > 0 ? (room.totalSpending / budget) * 100 : 0;
  const isOverBudget = room.totalSpending > budget && budget > 0;

  return (
    <Link href={`/rooms/${room.id}`}>
      <Card className="hover:bg-muted/50 transition-colors cursor-pointer h-full">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <DoorOpen className="h-5 w-5 text-muted-foreground" />
            {room.name}
          </CardTitle>
          {room.description && (
            <p className="text-sm text-muted-foreground line-clamp-2">
              {room.description}
            </p>
          )}
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>{t("rooms.spending")}</span>
            <span className={isOverBudget ? "text-destructive" : ""}>
              {formatCurrency(room.totalSpending)}
              {budget > 0 && ` / ${formatCurrency(budget)}`}
            </span>
          </div>
          {budget > 0 && (
            <Progress
              value={Math.min(percentage, 100)}
              className={isOverBudget ? "[&>div]:bg-destructive" : ""}
            />
          )}
        </CardContent>
      </Card>
    </Link>
  );
}
