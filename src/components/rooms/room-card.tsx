"use client";

import Link from "next/link";
import { DoorOpen, Home } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { formatCurrency } from "@/lib/utils";
import { useTranslation } from "@/lib/i18n/client";

interface RoomCardProps {
  room: {
    id: string;
    name: string;
    nameLt?: string | null;
    description: string | null;
    descriptionLt?: string | null;
    budget: string | number | null;
    totalSpending: number;
    homeName?: string | null;
    homeNameLt?: string | null;
  };
}

export function RoomCard({ room }: RoomCardProps) {
  const { t, locale } = useTranslation();
  const budget = Number(room.budget || 0);
  const percentage = budget > 0 ? (room.totalSpending / budget) * 100 : 0;
  const isOverBudget = room.totalSpending > budget && budget > 0;

  const displayName = locale === 'lt' && room.nameLt ? room.nameLt : room.name;
  const displayDescription = locale === 'lt' && room.descriptionLt ? room.descriptionLt : room.description;
  const displayHomeName = locale === 'lt' && room.homeNameLt ? room.homeNameLt : room.homeName;

  return (
    <Link href={`/rooms/${room.id}`}>
      <Card className="hover:bg-muted/50 transition-colors cursor-pointer h-full">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <DoorOpen className="h-5 w-5 text-muted-foreground" />
            {displayName}
          </CardTitle>
          {displayDescription && (
            <p className="text-sm text-muted-foreground line-clamp-2">
              {displayDescription}
            </p>
          )}
        </CardHeader>
        <CardContent className="space-y-3">
          {displayHomeName && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Home className="h-3.5 w-3.5" />
              <span>{displayHomeName}</span>
            </div>
          )}
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
