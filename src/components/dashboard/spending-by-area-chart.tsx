"use client";

import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip, Legend } from "recharts";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useTranslation } from "@/lib/i18n/client";

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

// Chart colors: Golden Glow, Lilac Ash, Dark Cyan, Light Blue
const CHART_COLORS = {
  goldenGlow: '#E0CA3C',
  lilacAsh: '#A799B7',
  darkCyan: '#048A81',
  lightBlue: '#93B7BE',
};

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
            <defs>
              <linearGradient id="budgetGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={CHART_COLORS.lilacAsh} stopOpacity={1} />
                <stop offset="100%" stopColor={CHART_COLORS.lilacAsh} stopOpacity={0.7} />
              </linearGradient>
              <linearGradient id="spentGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={CHART_COLORS.goldenGlow} stopOpacity={1} />
                <stop offset="100%" stopColor={CHART_COLORS.goldenGlow} stopOpacity={0.8} />
              </linearGradient>
            </defs>
            <XAxis
              dataKey="name"
              stroke={CHART_COLORS.darkCyan}
              fontSize={12}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              stroke={CHART_COLORS.darkCyan}
              fontSize={12}
              tickLine={false}
              axisLine={false}
              tickFormatter={(value) => `€${value.toLocaleString()}`}
            />
            <Tooltip
              formatter={(value: number) => [`€${value.toLocaleString()}`, ""]}
              contentStyle={glassTooltipStyle}
              labelStyle={{ color: "#2D3047", fontWeight: 600 }}
              itemStyle={{ color: "#2D3047" }}
              cursor={{ fill: 'rgba(224, 202, 60, 0.15)' }}
            />
            <Legend />
            <Bar dataKey="budget" name={t("dashboard.budget")} fill="url(#budgetGradient)" radius={[6, 6, 0, 0]} />
            <Bar dataKey="spent" name={t("dashboard.spent")} fill="url(#spentGradient)" radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
