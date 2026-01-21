"use client";

import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatCurrency, formatDate } from "@/lib/utils";
import { useTranslation } from "@/lib/i18n/client";

interface RecentPurchasesProps {
  purchases: {
    id: string;
    date: Date;
    totalAmount: number;
    purchaseType: string;
    paymentStatus: string;
    supplierName: string | null;
  }[];
}

const statusVariants: Record<string, "default" | "secondary" | "success" | "warning"> = {
  pending: "warning",
  partial: "secondary",
  paid: "success",
};

export function RecentPurchases({ purchases }: RecentPurchasesProps) {
  const { t } = useTranslation();

  const typeLabels: Record<string, string> = {
    service: t("purchaseTypes.service"),
    materials: t("purchaseTypes.materials"),
    products: t("purchaseTypes.products"),
    indirect: t("purchaseTypes.indirect"),
  };

  const statusLabels: Record<string, string> = {
    pending: t("purchases.pending"),
    partial: t("purchases.partial"),
    paid: t("purchases.paid"),
  };

  if (purchases.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{t("dashboard.recentPurchases")}</CardTitle>
        </CardHeader>
        <CardContent className="flex h-[200px] items-center justify-center">
          <div className="text-center">
            <p className="text-muted-foreground">{t("common.noPurchases")}</p>
            <Button asChild className="mt-4">
              <Link href="/purchases/new">{t("purchases.addPurchase")}</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>{t("dashboard.recentPurchases")}</CardTitle>
        </div>
        <Button asChild variant="outline" size="sm">
          <Link href="/purchases">{t("common.viewAll")}</Link>
        </Button>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {purchases.map((purchase) => (
            <div
              key={purchase.id}
              className="flex items-center justify-between border-b pb-4 last:border-0 last:pb-0"
            >
              <div className="space-y-1">
                <Link
                  href={`/purchases/${purchase.id}`}
                  className="font-medium hover:underline"
                >
                  {purchase.supplierName || "Unknown Supplier"}
                </Link>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <span>{formatDate(purchase.date)}</span>
                  <Badge variant="outline">{typeLabels[purchase.purchaseType]}</Badge>
                </div>
              </div>
              <div className="text-right">
                <div className="font-medium">{formatCurrency(purchase.totalAmount)}</div>
                <Badge variant={statusVariants[purchase.paymentStatus]}>
                  {statusLabels[purchase.paymentStatus]}
                </Badge>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
