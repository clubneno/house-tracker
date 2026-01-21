"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { formatCurrency } from "@/lib/utils";
import { useTranslation } from "@/lib/i18n/client";

interface BudgetProgressProps {
  areas: {
    name: string;
    budget: number;
    spent: number;
  }[];
}

export function BudgetProgress({ areas }: BudgetProgressProps) {
  const { t } = useTranslation();
  const areasWithBudget = areas.filter((a) => a.budget > 0);

  if (areasWithBudget.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{t("dashboard.budgetProgress")}</CardTitle>
          <CardDescription>{t("dashboard.spendingByAreaDesc")}</CardDescription>
        </CardHeader>
        <CardContent className="flex h-[200px] items-center justify-center">
          <p className="text-muted-foreground">{t("common.noData")}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("dashboard.budgetProgress")}</CardTitle>
        <CardDescription>{t("dashboard.spendingByAreaDesc")}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {areasWithBudget.map((area) => {
            const percentage = Math.min((area.spent / area.budget) * 100, 100);
            const isOverBudget = area.spent > area.budget;
            const remaining = area.budget - area.spent;

            return (
              <div key={area.name} className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-medium">{area.name}</span>
                  <span className={`text-sm ${isOverBudget ? "text-destructive" : "text-muted-foreground"}`}>
                    {formatCurrency(area.spent)} / {formatCurrency(area.budget)}
                  </span>
                </div>
                <Progress
                  value={percentage}
                  className={isOverBudget ? "[&>div]:bg-destructive" : ""}
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>{percentage.toFixed(1)}% {t("dashboard.ofBudget")}</span>
                  <span className={isOverBudget ? "text-destructive" : ""}>
                    {isOverBudget
                      ? `${formatCurrency(Math.abs(remaining))} ${t("dashboard.overBudget")}`
                      : `${formatCurrency(remaining)} ${t("dashboard.remaining")}`}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
