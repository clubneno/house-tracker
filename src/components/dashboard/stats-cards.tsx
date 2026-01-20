import { DollarSign, Users, ShoppingCart, Layers, DoorOpen, AlertCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";

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
  const cards = [
    {
      title: "Total Spending",
      value: formatCurrency(stats.totalSpending),
      icon: DollarSign,
      description: "Total amount spent",
    },
    {
      title: "Pending Payments",
      value: formatCurrency(stats.pendingPayments),
      icon: AlertCircle,
      description: "Awaiting payment",
      alert: stats.pendingPayments > 0,
    },
    {
      title: "Purchases",
      value: stats.purchaseCount.toString(),
      icon: ShoppingCart,
      description: "Total purchases",
    },
    {
      title: "Suppliers",
      value: stats.supplierCount.toString(),
      icon: Users,
      description: "Active suppliers",
    },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {cards.map((card) => (
        <Card key={card.title}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{card.title}</CardTitle>
            <card.icon className={`h-4 w-4 ${card.alert ? "text-destructive" : "text-muted-foreground"}`} />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${card.alert ? "text-destructive" : ""}`}>
              {card.value}
            </div>
            <p className="text-xs text-muted-foreground">{card.description}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
