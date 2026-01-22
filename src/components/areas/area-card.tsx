"use client";

import Link from "next/link";
import { Layers, DoorOpen, Home } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { formatCurrency } from "@/lib/utils";
import { useTranslation } from "@/lib/i18n/client";

interface AreaCardProps {
  area: {
    id: string;
    name: string;
    nameLt?: string | null;
    description: string | null;
    descriptionLt?: string | null;
    budget: string | number | null;
    roomCount: number;
    totalSpending: number;
    homeName?: string | null;
    homeNameLt?: string | null;
  };
}

export function AreaCard({ area }: AreaCardProps) {
  const { t, locale } = useTranslation();
  const budget = Number(area.budget || 0);
  const percentage = budget > 0 ? (area.totalSpending / budget) * 100 : 0;
  const isOverBudget = area.totalSpending > budget && budget > 0;

  const displayName = locale === 'lt' && area.nameLt ? area.nameLt : area.name;
  const displayDescription = locale === 'lt' && area.descriptionLt ? area.descriptionLt : area.description;
  const displayHomeName = locale === 'lt' && area.homeNameLt ? area.homeNameLt : area.homeName;

  return (
    <Link href={`/areas/${area.id}`}>
      <Card className="hover:bg-muted/50 transition-colors cursor-pointer h-full">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              <Layers className="h-5 w-5 text-primary" />
              {displayName}
            </CardTitle>
          </div>
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
