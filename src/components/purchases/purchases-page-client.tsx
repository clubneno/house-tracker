'use client';

import { useMemo } from 'react';
import { useHome } from '@/lib/contexts/home-context';
import { PurchaseFilters } from '@/components/purchases/purchase-filters';
import { PurchasesHeader } from '@/components/purchases/purchases-header';
import { PendingPaymentsAlert } from '@/components/purchases/pending-payments-alert';
import { NoPurchases } from '@/components/purchases/no-purchases';
import { PurchasesTable } from '@/components/purchases/purchases-table';

interface Purchase {
  id: string;
  date: Date;
  totalAmount: number;
  purchaseType: string;
  paymentStatus: string;
  expenseCategory: string | null;
  supplierId: string;
  supplierName: string | null;
  areaId: string | null;
  areaName: string | null;
  roomId: string | null;
  roomName: string | null;
  homeId: string | null;
  homeName: string | null;
  homeNameLt: string | null;
}

interface PurchasesPageClientProps {
  purchases: Purchase[];
  statusFilter?: string;
  categoryFilter?: string;
}

export function PurchasesPageClient({
  purchases,
  statusFilter = 'all',
  categoryFilter = 'all',
}: PurchasesPageClientProps) {
  const { selectedHomeId } = useHome();

  const filteredPurchases = useMemo(() => {
    let result = purchases;

    // Filter by selected home
    if (selectedHomeId) {
      result = result.filter((p) => p.homeId === selectedHomeId);
    }

    // Apply status filter
    if (statusFilter !== 'all') {
      result = result.filter((p) => p.paymentStatus === statusFilter);
    }

    // Apply category filter
    if (categoryFilter !== 'all') {
      result = result.filter((p) => p.expenseCategory === categoryFilter);
    }

    return result;
  }, [purchases, selectedHomeId, statusFilter, categoryFilter]);

  const totalSpending = filteredPurchases.reduce((sum, p) => sum + p.totalAmount, 0);
  const pendingCount = filteredPurchases.filter((p) => p.paymentStatus === 'pending').length;

  return (
    <div className="space-y-6">
      <PurchasesHeader purchaseCount={filteredPurchases.length} totalSpending={totalSpending} />

      <PendingPaymentsAlert pendingCount={pendingCount} />

      <PurchaseFilters />

      {filteredPurchases.length === 0 ? (
        <NoPurchases />
      ) : (
        <PurchasesTable purchases={filteredPurchases} />
      )}
    </div>
  );
}
