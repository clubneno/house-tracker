'use client';

import { useMemo, useState } from 'react';
import { useTranslation } from '@/lib/i18n/client';
import { useHome } from '@/lib/contexts/home-context';
import { SpendingTrendChart } from '@/components/reports/spending-trend-chart';
import { ReportsHeader } from '@/components/reports/reports-header';
import { ReportsStats } from '@/components/reports/reports-stats';
import { ReportsCards } from '@/components/reports/reports-cards';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { ExpenseCategory } from '@/lib/categories';

interface Purchase {
  id: string;
  date: Date;
  totalAmount: number;
  purchaseType: string;
  expenseCategory: string | null;
  supplierId: string;
  areaId: string | null;
  homeId: string | null;
}

interface Area {
  id: string;
  name: string;
  budget: number;
  homeId: string | null;
}

interface Supplier {
  id: string;
  name: string;
  type: string;
}

interface ReportsPageClientProps {
  purchases: Purchase[];
  areas: Area[];
  suppliers: Supplier[];
}

export function ReportsPageClient({ purchases, areas, suppliers }: ReportsPageClientProps) {
  const { t, locale } = useTranslation();
  const { selectedHomeId, homes } = useHome();
  const [filterHomeId, setFilterHomeId] = useState<string>('all');

  // Compute all report data filtered by home
  const reportData = useMemo(() => {
    const activeHomeId = selectedHomeId || (filterHomeId !== 'all' ? filterHomeId : null);

    // Filter purchases by home
    const filteredPurchases = activeHomeId
      ? purchases.filter((p) => p.homeId === activeHomeId)
      : purchases;

    // Filter areas by home
    const filteredAreas = activeHomeId
      ? areas.filter((a) => a.homeId === activeHomeId)
      : areas;

    // Total stats
    const totalSpending = filteredPurchases.reduce((sum, p) => sum + p.totalAmount, 0);
    const purchaseCount = filteredPurchases.length;

    // Spending by area
    const areaSpendingMap = new Map<string, { spent: number; count: number }>();
    filteredPurchases.forEach((p) => {
      if (p.areaId) {
        const current = areaSpendingMap.get(p.areaId) || { spent: 0, count: 0 };
        areaSpendingMap.set(p.areaId, {
          spent: current.spent + p.totalAmount,
          count: current.count + 1,
        });
      }
    });

    const spendingByArea = filteredAreas
      .map((area) => ({
        name: area.name,
        budget: area.budget,
        spent: areaSpendingMap.get(area.id)?.spent || 0,
        count: areaSpendingMap.get(area.id)?.count || 0,
      }))
      .sort((a, b) => b.spent - a.spent);

    // Spending by supplier
    const supplierSpendingMap = new Map<string, { spent: number; count: number }>();
    filteredPurchases.forEach((p) => {
      const current = supplierSpendingMap.get(p.supplierId) || { spent: 0, count: 0 };
      supplierSpendingMap.set(p.supplierId, {
        spent: current.spent + p.totalAmount,
        count: current.count + 1,
      });
    });

    const spendingBySupplier = suppliers
      .map((supplier) => ({
        name: supplier.name,
        spent: supplierSpendingMap.get(supplier.id)?.spent || 0,
        count: supplierSpendingMap.get(supplier.id)?.count || 0,
      }))
      .filter((s) => s.spent > 0)
      .sort((a, b) => b.spent - a.spent)
      .slice(0, 10);

    // Spending by type
    const typeSpendingMap = new Map<string, { spent: number; count: number }>();
    filteredPurchases.forEach((p) => {
      const current = typeSpendingMap.get(p.purchaseType) || { spent: 0, count: 0 };
      typeSpendingMap.set(p.purchaseType, {
        spent: current.spent + p.totalAmount,
        count: current.count + 1,
      });
    });

    const spendingByType = Array.from(typeSpendingMap.entries()).map(([type, data]) => ({
      type,
      spent: data.spent,
      count: data.count,
    }));

    // Spending by category
    const categorySpendingMap = new Map<string | null, { spent: number; count: number }>();
    filteredPurchases.forEach((p) => {
      const current = categorySpendingMap.get(p.expenseCategory) || { spent: 0, count: 0 };
      categorySpendingMap.set(p.expenseCategory, {
        spent: current.spent + p.totalAmount,
        count: current.count + 1,
      });
    });

    const spendingByCategory = Array.from(categorySpendingMap.entries())
      .map(([category, data]) => ({
        category: category as ExpenseCategory | null,
        spent: data.spent,
        count: data.count,
      }))
      .sort((a, b) => b.spent - a.spent);

    // Monthly spending trend
    const monthlyMap = new Map<string, number>();
    filteredPurchases.forEach((p) => {
      const month = new Date(p.date).toISOString().slice(0, 7);
      monthlyMap.set(month, (monthlyMap.get(month) || 0) + p.totalAmount);
    });

    const monthlySpending = Array.from(monthlyMap.entries())
      .map(([month, total]) => ({ month, total }))
      .sort((a, b) => a.month.localeCompare(b.month));

    return {
      totalSpending,
      purchaseCount,
      spendingByArea,
      spendingBySupplier,
      spendingByType,
      spendingByCategory,
      monthlySpending,
    };
  }, [purchases, areas, suppliers, selectedHomeId, filterHomeId]);

  // Show filter only when in "All Homes" mode and there are multiple homes
  const showHomeFilter = !selectedHomeId && homes.length > 1;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <ReportsHeader />
        {showHomeFilter && (
          <Select value={filterHomeId} onValueChange={setFilterHomeId}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder={t('homes.selectHome')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t('homes.allHomes')}</SelectItem>
              {homes.map((home) => (
                <SelectItem key={home.id} value={home.id}>
                  {locale === 'lt' && home.nameLt ? home.nameLt : home.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>

      <ReportsStats
        totalSpending={reportData.totalSpending}
        purchaseCount={reportData.purchaseCount}
      />

      {reportData.monthlySpending.length > 0 && (
        <SpendingTrendChart data={reportData.monthlySpending} />
      )}

      <ReportsCards
        spendingByArea={reportData.spendingByArea}
        spendingBySupplier={reportData.spendingBySupplier}
        spendingByType={reportData.spendingByType}
        spendingByCategory={reportData.spendingByCategory}
      />
    </div>
  );
}
