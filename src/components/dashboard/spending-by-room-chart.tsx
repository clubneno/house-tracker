"use client";

import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip, Legend } from "recharts";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useTranslation } from "@/lib/i18n/client";

interface SpendingByRoomChartProps {
  data: {
    name: string;
    areaName: string;
    budget: number;
    spent: number;
  }[];
}

export function SpendingByRoomChart({ data }: SpendingByRoomChartProps) {
  const { t } = useTranslation();

  if (data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{t("dashboard.spendingByRoom")}</CardTitle>
          <CardDescription>{t("dashboard.spendingByRoomDesc")}</CardDescription>
        </CardHeader>
        <CardContent className="flex h-[300px] items-center justify-center">
          <p className="text-muted-foreground">{t("common.noData")}</p>
        </CardContent>
      </Card>
    );
  }

  // Sort by spent amount descending and take top 10 for readability
  const sortedData = [...data]
    .sort((a, b) => b.spent - a.spent)
    .slice(0, 10);

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("dashboard.spendingByRoom")}</CardTitle>
        <CardDescription>{t("dashboard.spendingByRoomDesc")}</CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={sortedData}>
            <XAxis
              dataKey="name"
              stroke="#888888"
              fontSize={12}
              tickLine={false}
              axisLine={false}
              angle={-45}
              textAnchor="end"
              height={80}
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
              labelFormatter={(label) => {
                const room = sortedData.find((d) => d.name === label);
                return room ? `${room.name} (${room.areaName})` : label;
              }}
              labelStyle={{ color: "#000" }}
            />
            <Legend />
            <Bar dataKey="budget" name={t("dashboard.budget")} fill="hsl(var(--muted))" radius={[4, 4, 0, 0]} />
            <Bar dataKey="spent" name={t("dashboard.spent")} fill="hsl(var(--chart-2))" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
