export const dynamic = 'force-dynamic';

import { db } from "@/lib/db";
import { purchases, areas, rooms, suppliers } from "@/lib/db/schema";
import { eq, sum, count, desc, and, gte, lte } from "drizzle-orm";
import { FileText, Download, TrendingUp, Calendar } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { formatCurrency, formatDate } from "@/lib/utils";
import { ReportFilters } from "@/components/reports/report-filters";
import { SpendingTrendChart } from "@/components/reports/spending-trend-chart";

async function getReportData() {
  // Get spending by area
  const spendingByArea = await db
    .select({
      areaId: areas.id,
      areaName: areas.name,
      budget: areas.budget,
      total: sum(purchases.totalAmount),
      count: count(purchases.id),
    })
    .from(areas)
    .leftJoin(
      purchases,
      and(eq(purchases.areaId, areas.id), eq(purchases.isDeleted, false))
    )
    .groupBy(areas.id, areas.name, areas.budget)
    .orderBy(desc(sum(purchases.totalAmount)));

  // Get spending by supplier
  const spendingBySupplier = await db
    .select({
      supplierId: suppliers.id,
      supplierName: suppliers.companyName,
      supplierFirstName: suppliers.firstName,
      supplierLastName: suppliers.lastName,
      supplierType: suppliers.type,
      total: sum(purchases.totalAmount),
      count: count(purchases.id),
    })
    .from(suppliers)
    .leftJoin(
      purchases,
      and(eq(purchases.supplierId, suppliers.id), eq(purchases.isDeleted, false))
    )
    .where(eq(suppliers.isDeleted, false))
    .groupBy(
      suppliers.id,
      suppliers.companyName,
      suppliers.firstName,
      suppliers.lastName,
      suppliers.type
    )
    .orderBy(desc(sum(purchases.totalAmount)))
    .limit(10);

  // Get spending by type
  const spendingByType = await db
    .select({
      type: purchases.purchaseType,
      total: sum(purchases.totalAmount),
      count: count(purchases.id),
    })
    .from(purchases)
    .where(eq(purchases.isDeleted, false))
    .groupBy(purchases.purchaseType);

  // Get monthly spending trend
  const allPurchases = await db
    .select({
      date: purchases.date,
      total: purchases.totalAmount,
    })
    .from(purchases)
    .where(eq(purchases.isDeleted, false))
    .orderBy(purchases.date);

  // Group by month
  const monthlySpending = allPurchases.reduce((acc, p) => {
    const month = new Date(p.date).toISOString().slice(0, 7);
    if (!acc[month]) {
      acc[month] = 0;
    }
    acc[month] += Number(p.total);
    return acc;
  }, {} as Record<string, number>);

  // Get total stats
  const [totalStats] = await db
    .select({
      totalSpending: sum(purchases.totalAmount),
      purchaseCount: count(purchases.id),
    })
    .from(purchases)
    .where(eq(purchases.isDeleted, false));

  return {
    spendingByArea: spendingByArea.map((r) => ({
      name: r.areaName,
      budget: Number(r.budget || 0),
      spent: Number(r.total || 0),
      count: Number(r.count || 0),
    })),
    spendingBySupplier: spendingBySupplier.map((r) => ({
      name:
        r.supplierType === "company"
          ? r.supplierName
          : `${r.supplierFirstName} ${r.supplierLastName}`,
      spent: Number(r.total || 0),
      count: Number(r.count || 0),
    })),
    spendingByType: spendingByType.map((r) => ({
      type: r.type,
      spent: Number(r.total || 0),
      count: Number(r.count || 0),
    })),
    monthlySpending: Object.entries(monthlySpending).map(([month, total]) => ({
      month,
      total,
    })),
    totalSpending: Number(totalStats?.totalSpending || 0),
    purchaseCount: Number(totalStats?.purchaseCount || 0),
  };
}

const typeLabels: Record<string, string> = {
  service: "Services",
  materials: "Materials",
  products: "Products",
  indirect: "Indirect Costs",
};

export default async function ReportsPage() {
  const data = await getReportData();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Reports</h1>
          <p className="text-muted-foreground">
            Analyze your construction spending
          </p>
        </div>
        <Button variant="outline">
          <Download className="mr-2 h-4 w-4" />
          Export CSV
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Spending</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(data.totalSpending)}
            </div>
            <p className="text-xs text-muted-foreground">
              Across {data.purchaseCount} purchases
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">
              Average per Purchase
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(
                data.purchaseCount > 0
                  ? data.totalSpending / data.purchaseCount
                  : 0
              )}
            </div>
            <p className="text-xs text-muted-foreground">Per transaction</p>
          </CardContent>
        </Card>
      </div>

      {data.monthlySpending.length > 0 && (
        <SpendingTrendChart data={data.monthlySpending} />
      )}

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Spending by Area</CardTitle>
            <CardDescription>Budget vs actual spending</CardDescription>
          </CardHeader>
          <CardContent>
            {data.spendingByArea.length === 0 ? (
              <p className="text-muted-foreground">No data available</p>
            ) : (
              <div className="space-y-4">
                {data.spendingByArea.map((area) => (
                  <div
                    key={area.name}
                    className="flex items-center justify-between"
                  >
                    <div>
                      <p className="font-medium">{area.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {area.count} purchase{area.count !== 1 ? "s" : ""}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">
                        {formatCurrency(area.spent)}
                      </p>
                      {area.budget > 0 && (
                        <p className="text-sm text-muted-foreground">
                          of {formatCurrency(area.budget)}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Top Suppliers</CardTitle>
            <CardDescription>By total spending</CardDescription>
          </CardHeader>
          <CardContent>
            {data.spendingBySupplier.length === 0 ? (
              <p className="text-muted-foreground">No data available</p>
            ) : (
              <div className="space-y-4">
                {data.spendingBySupplier.map((supplier, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between"
                  >
                    <div>
                      <p className="font-medium">{supplier.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {supplier.count} purchase{supplier.count !== 1 ? "s" : ""}
                      </p>
                    </div>
                    <p className="font-medium">
                      {formatCurrency(supplier.spent)}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Spending by Type</CardTitle>
            <CardDescription>Purchase category breakdown</CardDescription>
          </CardHeader>
          <CardContent>
            {data.spendingByType.length === 0 ? (
              <p className="text-muted-foreground">No data available</p>
            ) : (
              <div className="grid gap-4 md:grid-cols-4">
                {data.spendingByType.map((type) => (
                  <div key={type.type} className="p-4 border rounded-lg">
                    <p className="text-sm text-muted-foreground">
                      {typeLabels[type.type] || type.type}
                    </p>
                    <p className="text-2xl font-bold">
                      {formatCurrency(type.spent)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {type.count} purchase{type.count !== 1 ? "s" : ""}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
