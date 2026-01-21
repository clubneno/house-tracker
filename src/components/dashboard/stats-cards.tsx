"use client";

import { DollarSign, Users, ShoppingCart, AlertCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";
import { useTranslation } from "@/lib/i18n/client";

interface StatsCardsProps {
  stats: {
    totalSpending: number;
    supplierCount: number;
    purchaseCount: number;
    areaCount: number;
    roomCount: number;
    pendingPayments: number;
  };
}

export function StatsCards({ stats }: StatsCardsProps) {
  const { t } = useTranslation();

  const cards = [
    {
      titleKey: "dashboard.totalSpending",
      value: formatCurrency(stats.totalSpending),
      icon: DollarSign,
      descriptionKey: "dashboard.totalAmountSpent",
    },
    {
      titleKey: "dashboard.pendingPayments",
      value: formatCurrency(stats.pendingPayments),
      icon: AlertCircle,
      descriptionKey: "dashboard.awaitingPayment",
      alert: stats.pendingPayments > 0,
    },
    {
      titleKey: "dashboard.purchases",
      value: stats.purchaseCount.toString(),
      icon: ShoppingCart,
      descriptionKey: "dashboard.totalPurchases",
    },
    {
      titleKey: "dashboard.suppliers",
      value: stats.supplierCount.toString(),
      icon: Users,
      descriptionKey: "dashboard.activeSuppliers",
    },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {cards.map((card) => (
        <Card key={card.titleKey}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t(card.titleKey)}</CardTitle>
            <card.icon className={`h-4 w-4 ${card.alert ? "text-destructive" : "text-muted-foreground"}`} />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${card.alert ? "text-destructive" : ""}`}>
              {card.value}
            </div>
            <p className="text-xs text-muted-foreground">{t(card.descriptionKey)}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
