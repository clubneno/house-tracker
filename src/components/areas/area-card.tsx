"use client";

import Link from "next/link";
import { Layers, DoorOpen } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { formatCurrency } from "@/lib/utils";
import { useTranslation } from "@/lib/i18n/client";

interface AreaCardProps {
  area: {
    id: string;
    name: string;
    description: string | null;
    budget: string | number | null;
    roomCount: number;
    totalSpending: number;
  };
}

export function AreaCard({ area }: AreaCardProps) {
  const { t } = useTranslation();
  const budget = Number(area.budget || 0);
  const percentage = budget > 0 ? (area.totalSpending / budget) * 100 : 0;
  const isOverBudget = area.totalSpending > budget && budget > 0;

  return (
    <Link href={`/areas/${area.id}`}>
      <Card className="hover:bg-muted/50 transition-colors cursor-pointer h-full">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              <Layers className="h-5 w-5 text-primary" />
              {area.name}
            </CardTitle>
          </div>
          {area.description && (
            <p className="text-sm text-muted-foreground line-clamp-2">
              {area.description}
            </p>
          )}
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <DoorOpen className="h-4 w-4" />
            <span>
              {area.roomCount} {area.roomCount !== 1 ? t("common.rooms") : t("common.room")}
            </span>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>{t("areas.spending")}</span>
              <span className={isOverBudget ? "text-destructive" : ""}>
                {formatCurrency(area.totalSpending)}
                {budget > 0 && ` / ${formatCurrency(budget)}`}
              </span>
            </div>
            {budget > 0 && (
              <Progress
                value={Math.min(percentage, 100)}
                className={isOverBudget ? "[&>div]:bg-destructive" : ""}
              />
            )}
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
