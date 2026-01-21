"use client";

import Link from "next/link";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTranslation } from "@/lib/i18n/client";
import { formatCurrency } from "@/lib/utils";

interface PurchasesHeaderProps {
  purchaseCount: number;
  totalSpending: number;
}

export function PurchasesHeader({ purchaseCount, totalSpending }: PurchasesHeaderProps) {
  const { t } = useTranslation();

  return (
    <div className="flex items-center justify-between">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">{t("purchases.title")}</h1>
        <p className="text-muted-foreground">
          {purchaseCount} {t("purchases.subtitle")} {formatCurrency(totalSpending)}
        </p>
      </div>
      <Button asChild>
        <Link href="/purchases/new">
          <Plus className="mr-2 h-4 w-4" />
          {t("purchases.addPurchase")}
        </Link>
      </Button>
    </div>
  );
}
