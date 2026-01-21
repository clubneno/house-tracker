"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";
import { useTranslation } from "@/lib/i18n/client";
import { getCategoryLabelStatic, getCategoryColorStatic, categoryConfig, ExpenseCategory } from "@/lib/categories";

interface AreaSpending {
  name: string;
  budget: number;
  spent: number;
  count: number;
}

interface SupplierSpending {
  name: string;
  spent: number;
  count: number;
}

interface TypeSpending {
  type: string;
  spent: number;
  count: number;
}

interface CategorySpending {
  category: ExpenseCategory | null;
  spent: number;
  count: number;
}

interface ReportsCardsProps {
  spendingByArea: AreaSpending[];
  spendingBySupplier: SupplierSpending[];
  spendingByType: TypeSpending[];
  spendingByCategory: CategorySpending[];
}

export function ReportsCards({
  spendingByArea,
  spendingBySupplier,
  spendingByType,
  spendingByCategory,
}: ReportsCardsProps) {
  const { t } = useTranslation();

  const typeLabels: Record<string, string> = {
    service: t("purchaseTypes.service"),
    materials: t("purchaseTypes.materials"),
    products: t("purchaseTypes.products"),
    indirect: t("purchaseTypes.indirect"),
  };

  return (
    <div className="grid gap-6 md:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>{t("reports.spendingByArea")}</CardTitle>
          <CardDescription>{t("reports.budgetVsActual")}</CardDescription>
        </CardHeader>
        <CardContent>
          {spendingByArea.length === 0 ? (
            <p className="text-muted-foreground">{t("common.noData")}</p>
          ) : (
            <div className="space-y-4">
              {spendingByArea.map((area) => (
                <div
                  key={area.name}
                  className="flex items-center justify-between"
                >
                  <div>
                    <p className="font-medium">{area.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {area.count} {area.count !== 1 ? t("common.purchases") : t("common.purchase")}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">
                      {formatCurrency(area.spent)}
                    </p>
                    {area.budget > 0 && (
                      <p className="text-sm text-muted-foreground">
                        {t("common.of")} {formatCurrency(area.budget)}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t("reports.topSuppliers")}</CardTitle>
          <CardDescription>{t("reports.byTotalSpending")}</CardDescription>
        </CardHeader>
        <CardContent>
          {spendingBySupplier.length === 0 ? (
            <p className="text-muted-foreground">{t("common.noData")}</p>
          ) : (
            <div className="space-y-4">
              {spendingBySupplier.map((supplier, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between"
                >
                  <div>
                    <p className="font-medium">{supplier.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {supplier.count} {supplier.count !== 1 ? t("common.purchases") : t("common.purchase")}
                    </p>
                  </div>
                  <p className="font-medium">
                    {formatCurrency(supplier.spent)}
                  </p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="md:col-span-2">
        <CardHeader>
          <CardTitle>{t("reports.spendingByType")}</CardTitle>
          <CardDescription>{t("reports.purchaseTypeBreakdown")}</CardDescription>
        </CardHeader>
        <CardContent>
          {spendingByType.length === 0 ? (
            <p className="text-muted-foreground">{t("common.noData")}</p>
          ) : (
            <div className="grid gap-4 md:grid-cols-4">
              {spendingByType.map((type) => (
                <div key={type.type} className="p-4 border rounded-lg">
                  <p className="text-sm text-muted-foreground">
                    {typeLabels[type.type] || type.type}
                  </p>
                  <p className="text-2xl font-bold">
                    {formatCurrency(type.spent)}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {type.count} {type.count !== 1 ? t("common.purchases") : t("common.purchase")}
                  </p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="md:col-span-2">
        <CardHeader>
          <CardTitle>{t("reports.spendingByCategory")}</CardTitle>
          <CardDescription>{t("reports.workTypeBreakdown")}</CardDescription>
        </CardHeader>
        <CardContent>
          {spendingByCategory.length === 0 ? (
            <p className="text-muted-foreground">{t("common.noData")}</p>
          ) : (
            <div className="grid gap-4 md:grid-cols-4">
              {spendingByCategory.map((item) => {
                const config = item.category ? categoryConfig[item.category] : null;
                const Icon = config?.icon;
                return (
                  <div key={item.category || "uncategorized"} className="p-4 border rounded-lg">
                    <div className="flex items-center gap-2 mb-1">
                      {Icon && (
                        <Icon className={`h-4 w-4 ${getCategoryColorStatic(item.category)}`} />
                      )}
                      <p className="text-sm text-muted-foreground">
                        {getCategoryLabelStatic(item.category)}
                      </p>
                    </div>
                    <p className="text-2xl font-bold">
                      {formatCurrency(item.spent)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {item.count} {item.count !== 1 ? t("common.purchases") : t("common.purchase")}
                    </p>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
