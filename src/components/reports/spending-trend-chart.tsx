"use client";

import { Line, LineChart, ResponsiveContainer, XAxis, YAxis, Tooltip, Area, ComposedChart } from "recharts";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

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

interface SpendingTrendChartProps {
  data: {
    month: string;
    total: number;
  }[];
}

export function SpendingTrendChart({ data }: SpendingTrendChartProps) {
  const formattedData = data.map((d) => ({
    ...d,
    monthLabel: new Date(d.month + "-01").toLocaleDateString("en-US", {
      month: "short",
      year: "2-digit",
    }),
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle>Spending Trend</CardTitle>
        <CardDescription>Monthly spending over time</CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <ComposedChart data={formattedData}>
            <defs>
              <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={CHART_COLORS.lilacAsh} stopOpacity={0.7} />
                <stop offset="50%" stopColor={CHART_COLORS.goldenGlow} stopOpacity={0.3} />
                <stop offset="100%" stopColor={CHART_COLORS.lilacAsh} stopOpacity={0.1} />
              </linearGradient>
            </defs>
            <XAxis
              dataKey="monthLabel"
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
              tickFormatter={(value) => `€${(value / 1000).toFixed(0)}k`}
            />
            <Tooltip
              formatter={(value: number) => [`€${value.toLocaleString()}`, "Spending"]}
              contentStyle={glassTooltipStyle}
              labelStyle={{ color: "#2D3047", fontWeight: 600 }}
              itemStyle={{ color: "#2D3047" }}
            />
            <Area
              type="monotone"
              dataKey="total"
              fill="url(#areaGradient)"
              stroke="none"
            />
            <Line
              type="monotone"
              dataKey="total"
              stroke={CHART_COLORS.goldenGlow}
              strokeWidth={3}
              dot={{ fill: CHART_COLORS.goldenGlow, strokeWidth: 2, r: 5, stroke: "#fff" }}
              activeDot={{ fill: CHART_COLORS.goldenGlow, strokeWidth: 3, r: 7, stroke: "#fff" }}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
