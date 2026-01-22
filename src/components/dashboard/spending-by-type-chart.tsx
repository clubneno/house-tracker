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

// Apple liquid glass tooltip style
const glassTooltipStyle = {
  background: 'linear-gradient(180deg, rgba(255,255,255,0.85) 0%, rgba(255,255,255,0.75) 100%)',
  backdropFilter: 'blur(24px) saturate(150%)',
  WebkitBackdropFilter: 'blur(24px) saturate(150%)',
  border: '1px solid rgba(255, 255, 255, 0.6)',
  borderRadius: '1rem',
  boxShadow: '0 8px 32px rgba(0,0,0,0.12), inset 0 1px 0 rgba(255,255,255,0.9)',
  padding: '12px 16px',
};

// Golden Glow, Lilac Ash, Dark Cyan, Light Blue palette
const COLORS = [
  "#E0CA3C", // Golden Glow
  "#A799B7", // Lilac Ash
  "#048A81", // Dark Cyan
  "#93B7BE", // Light Blue
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
            <defs>
              {COLORS.map((color, index) => (
                <linearGradient key={`type-gradient-${index}`} id={`typeGradient-${index}`} x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stopColor={color} stopOpacity={1} />
                  <stop offset="100%" stopColor={color} stopOpacity={0.8} />
                </linearGradient>
              ))}
            </defs>
            <Pie
              data={formattedData}
              cx="50%"
              cy="50%"
              labelLine={false}
              outerRadius={100}
              innerRadius={50}
              fill="#8884d8"
              dataKey="value"
              strokeWidth={2}
              stroke="rgba(255,255,255,0.8)"
              label={({ name, percent }) =>
                `${name} ${(percent * 100).toFixed(0)}%`
              }
            >
              {formattedData.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={`url(#typeGradient-${index % COLORS.length})`}
                />
              ))}
            </Pie>
            <Tooltip
              formatter={(value: number) => [`€${value.toLocaleString()}`, ""]}
              contentStyle={glassTooltipStyle}
              labelStyle={{ color: "#2D3047", fontWeight: 600 }}
              itemStyle={{ color: "#2D3047" }}
            />
          </PieChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
