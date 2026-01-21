'use client';

import { useState, useMemo } from 'react';
import { useTranslation } from '@/lib/i18n/client';
import { useHome } from '@/lib/contexts/home-context';
import { SuppliersHeader } from '@/components/suppliers/suppliers-header';
import { SupplierSearch } from '@/components/suppliers/supplier-search';
import { SupplierCard } from '@/components/suppliers/supplier-card';
import { NoSuppliers } from '@/components/suppliers/no-suppliers';
import { AddSupplierButton } from '@/components/suppliers/add-supplier-button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { Supplier } from '@/lib/db/schema';

interface SupplierWithPurchases extends Supplier {
  purchases: {
    homeId: string | null;
    totalAmount: number;
  }[];
}

interface SuppliersPageClientProps {
  initialSuppliers: SupplierWithPurchases[];
  searchQuery?: string;
  typeFilter?: string;
}

export function SuppliersPageClient({
  initialSuppliers,
  searchQuery = '',
  typeFilter = 'all'
}: SuppliersPageClientProps) {
  const { t, locale } = useTranslation();
  const { selectedHomeId, homes } = useHome();
  const [filterHomeId, setFilterHomeId] = useState<string>('all');

  // Filter and aggregate suppliers based on selected home
  const filteredSuppliers = useMemo(() => {
    const activeHomeId = selectedHomeId || (filterHomeId !== 'all' ? filterHomeId : null);

    return initialSuppliers
      .map((supplier) => {
        // Filter purchases by home if a home is selected
        const relevantPurchases = activeHomeId
          ? supplier.purchases.filter((p) => p.homeId === activeHomeId)
          : supplier.purchases;

        // Calculate totals for relevant purchases
        const totalSpending = relevantPurchases.reduce((sum, p) => sum + p.totalAmount, 0);
        const purchaseCount = relevantPurchases.length;

        return {
          ...supplier,
          totalSpending,
          purchaseCount,
          // Keep track if supplier has any purchases for this home
          hasRelevantPurchases: activeHomeId ? purchaseCount > 0 : true,
        };
      })
      // When filtering by home, only show suppliers with purchases for that home
      .filter((s) => s.hasRelevantPurchases)
      // Apply type filter
      .filter((s) => typeFilter === 'all' || s.type === typeFilter)
      // Apply search filter
      .filter((s) => {
        if (!searchQuery) return true;
        const searchLower = searchQuery.toLowerCase();
        const name =
          s.type === 'company'
            ? s.companyName?.toLowerCase() || ''
            : `${s.firstName} ${s.lastName}`.toLowerCase();
        return (
          name.includes(searchLower) ||
          s.email?.toLowerCase().includes(searchLower) ||
          s.phone?.toLowerCase().includes(searchLower)
        );
      });
  }, [initialSuppliers, selectedHomeId, filterHomeId, typeFilter, searchQuery]);

  // Show filter only when in "All Homes" mode and there are multiple homes
  const showHomeFilter = !selectedHomeId && homes.length > 1;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <SuppliersHeader />
        <div className="flex items-center gap-2">
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
          <AddSupplierButton />
        </div>
      </div>

      <SupplierSearch />

      {filteredSuppliers.length === 0 ? (
        <NoSuppliers />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredSuppliers.map((supplier) => (
            <SupplierCard
              key={supplier.id}
              supplier={{
                ...supplier,
                totalSpending: supplier.totalSpending,
                purchaseCount: supplier.purchaseCount,
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}
