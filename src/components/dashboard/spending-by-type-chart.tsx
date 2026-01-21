"use client";

import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useTranslation } from "@/lib/i18n/client";

interface SpendingByTypeChartProps {
  data: {
    name: string;
    value: number;
  }[];
}

const COLORS = [
  "hsl(var(--chart-1))",
  "hsl(var(--chart-2))",
  "hsl(var(--chart-3))",
  "hsl(var(--chart-4))",
];

export function SpendingByTypeChart({ data }: SpendingByTypeChartProps) {
  const { t } = useTranslation();

  const typeLabels: Record<string, string> = {
    service: t("purchaseTypes.service"),
    materials: t("purchaseTypes.materials"),
    products: t("purchaseTypes.products"),
    indirect: t("purchaseTypes.indirect"),
  };

  const formattedData = data.map((d) => ({
    ...d,
    name: typeLabels[d.name] || d.name,
  }));

  if (data.length === 0 || data.every((d) => d.value === 0)) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{t("dashboard.spendingByType")}</CardTitle>
          <CardDescription>{t("dashboard.spendingByTypeDesc")}</CardDescription>
        </CardHeader>
        <CardContent className="flex h-[300px] items-center justify-center">
          <p className="text-muted-foreground">{t("common.noData")}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("dashboard.spendingByType")}</CardTitle>
        <CardDescription>{t("dashboard.spendingByTypeDesc")}</CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={formattedData}
              cx="50%"
              cy="50%"
              labelLine={false}
              outerRadius={100}
              fill="#8884d8"
              dataKey="value"
              label={({ name, percent }) =>
                `${name} ${(percent * 100).toFixed(0)}%`
              }
            >
              {formattedData.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={COLORS[index % COLORS.length]}
                />
              ))}
            </Pie>
            <Tooltip
              formatter={(value: number) => [`€${value.toLocaleString()}`, ""]}
            />
          </PieChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
