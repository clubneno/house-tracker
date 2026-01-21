"use client";

import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip, Legend } from "recharts";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useTranslation } from "@/lib/i18n/client";

interface SpendingByAreaChartProps {
  data: {
    name: string;
    budget: number;
    spent: number;
  }[];
}

export function SpendingByAreaChart({ data }: SpendingByAreaChartProps) {
  const { t } = useTranslation();

  if (data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{t("dashboard.spendingByArea")}</CardTitle>
          <CardDescription>{t("dashboard.spendingByAreaDesc")}</CardDescription>
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
        <CardTitle>{t("dashboard.spendingByArea")}</CardTitle>
        <CardDescription>{t("dashboard.spendingByAreaDesc")}</CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={data}>
            <XAxis
              dataKey="name"
              stroke="#888888"
              fontSize={12}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              stroke="#888888"
              fontSize={12}
              tickLine={false}
              axisLine={false}
              tickFormatter={(value) => `€${value.toLocaleString()}`}
            />
            <Tooltip
              formatter={(value: number) => [`€${value.toLocaleString()}`, ""]}
              labelStyle={{ color: "#000" }}
            />
            <Legend />
            <Bar dataKey="budget" name={t("dashboard.budget")} fill="hsl(var(--muted))" radius={[4, 4, 0, 0]} />
            <Bar dataKey="spent" name={t("dashboard.spent")} fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
