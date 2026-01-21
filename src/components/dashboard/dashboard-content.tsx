'use client';

import { useMemo } from 'react';
import { useHome } from '@/lib/contexts/home-context';
import { StatsCards } from '@/components/dashboard/stats-cards';
import { SpendingByAreaChart } from '@/components/dashboard/spending-by-area-chart';
import { SpendingByTypeChart } from '@/components/dashboard/spending-by-type-chart';
import { SpendingByCategoryChart } from '@/components/dashboard/spending-by-category-chart';
import { SpendingByRoomChart } from '@/components/dashboard/spending-by-room-chart';
import { RecentPurchases } from '@/components/dashboard/recent-purchases';
import { BudgetProgress } from '@/components/dashboard/budget-progress';
import { UpcomingPayments } from '@/components/dashboard/upcoming-payments';
import { ExpiringWarranties } from '@/components/dashboard/expiring-warranties';
import { ExpiringDocuments } from '@/components/dashboard/expiring-documents';

interface Purchase {
  id: string;
  date: Date;
  totalAmount: number;
  purchaseType: string;
  paymentStatus: string;
  paymentDueDate: Date | null;
  expenseCategory: string | null;
  homeId: string | null;
  supplierId: string;
  supplierName: string | null;
}

interface Area {
  id: string;
  name: string;
  budget: number;
  homeId: string | null;
}

interface Room {
  id: string;
  name: string;
  budget: number;
  areaId: string;
  areaName: string;
  homeId: string | null;
}

interface LineItem {
  id: string;
  description: string;
  brand: string | null;
  totalPrice: number;
  warrantyExpiresAt: Date | null;
  areaId: string | null;
  roomId: string | null;
  purchaseId: string;
  homeId: string | null;
}

interface Document {
  id: string;
  documentTitle: string | null;
  fileName: string;
  houseDocumentType: string | null;
  expiresAt: Date | null;
  homeId: string | null;
}

interface CategoryLabel {
  name: string;
  label: string;
}

interface DashboardContentProps {
  purchases: Purchase[];
  areas: Area[];
  rooms: Room[];
  lineItems: LineItem[];
  documents: Document[];
  categoryLabels: CategoryLabel[];
}

export function DashboardContent({
  purchases,
  areas,
  rooms,
  lineItems,
  documents,
  categoryLabels,
}: DashboardContentProps) {
  const { selectedHomeId } = useHome();

  const dashboardData = useMemo(() => {
    // Filter data by selected home
    const filteredPurchases = selectedHomeId
      ? purchases.filter((p) => p.homeId === selectedHomeId)
      : purchases;

    const filteredAreas = selectedHomeId
      ? areas.filter((a) => a.homeId === selectedHomeId)
      : areas;

    const filteredRooms = selectedHomeId
      ? rooms.filter((r) => r.homeId === selectedHomeId)
      : rooms;

    const filteredLineItems = selectedHomeId
      ? lineItems.filter((li) => li.homeId === selectedHomeId)
      : lineItems;

    const filteredDocuments = selectedHomeId
      ? documents.filter((d) => d.homeId === selectedHomeId)
      : documents;

    // Create area IDs set for filtering
    const areaIds = new Set(filteredAreas.map((a) => a.id));
    const roomIds = new Set(filteredRooms.map((r) => r.id));

    // Stats calculations
    const totalSpending = filteredPurchases.reduce((sum, p) => sum + p.totalAmount, 0);
    const purchaseCount = filteredPurchases.length;

    // Count unique suppliers from filtered purchases
    const uniqueSuppliers = new Set(filteredPurchases.map((p) => p.supplierId));
    const supplierCount = uniqueSuppliers.size;

    const areaCount = filteredAreas.length;
    const roomCount = filteredRooms.length;

    const pendingPayments = filteredPurchases
      .filter((p) => p.paymentStatus === 'pending' || p.paymentStatus === 'partial')
      .reduce((sum, p) => sum + p.totalAmount, 0);

    const stats = {
      totalSpending,
      supplierCount,
      purchaseCount,
      areaCount,
      roomCount,
      pendingPayments,
    };

    // Spending by area (from line items)
    const areaSpendingMap = new Map<string, number>();
    filteredLineItems.forEach((li) => {
      if (li.areaId && areaIds.has(li.areaId)) {
        areaSpendingMap.set(li.areaId, (areaSpendingMap.get(li.areaId) || 0) + li.totalPrice);
      }
    });

    const spendingByArea = filteredAreas.map((area) => ({
      name: area.name,
      budget: area.budget,
      spent: areaSpendingMap.get(area.id) || 0,
    }));

    // Spending by type
    const typeSpendingMap = new Map<string, number>();
    filteredPurchases.forEach((p) => {
      typeSpendingMap.set(p.purchaseType, (typeSpendingMap.get(p.purchaseType) || 0) + p.totalAmount);
    });

    const spendingByType = Array.from(typeSpendingMap.entries()).map(([name, value]) => ({
      name,
      value,
    }));

    // Spending by category
    const categoryLabelMap = new Map(categoryLabels.map((c) => [c.name, c.label]));
    const categorySpendingMap = new Map<string, number>();
    filteredPurchases.forEach((p) => {
      if (p.expenseCategory) {
        categorySpendingMap.set(
          p.expenseCategory,
          (categorySpendingMap.get(p.expenseCategory) || 0) + p.totalAmount
        );
      }
    });

    const spendingByCategory = Array.from(categorySpendingMap.entries()).map(([category, value]) => ({
      name: categoryLabelMap.get(category) || category || 'Other',
      value,
    }));

    // Spending by room (from line items)
    const roomSpendingMap = new Map<string, number>();
    filteredLineItems.forEach((li) => {
      if (li.roomId && roomIds.has(li.roomId)) {
        roomSpendingMap.set(li.roomId, (roomSpendingMap.get(li.roomId) || 0) + li.totalPrice);
      }
    });

    const spendingByRoom = filteredRooms.map((room) => ({
      name: room.name,
      areaName: room.areaName,
      budget: room.budget,
      spent: roomSpendingMap.get(room.id) || 0,
    }));

    // Recent purchases (top 5 by date)
    const recentPurchases = [...filteredPurchases]
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 5)
      .map((p) => ({
        id: p.id,
        date: p.date,
        totalAmount: p.totalAmount,
        purchaseType: p.purchaseType,
        paymentStatus: p.paymentStatus,
        supplierName: p.supplierName,
      }));

    // Upcoming payments (pending/partial with due date in future)
    const today = new Date();
    const upcomingPayments = filteredPurchases
      .filter(
        (p) =>
          (p.paymentStatus === 'pending' || p.paymentStatus === 'partial') &&
          p.paymentDueDate &&
          new Date(p.paymentDueDate) >= today
      )
      .sort((a, b) => new Date(a.paymentDueDate!).getTime() - new Date(b.paymentDueDate!).getTime())
      .slice(0, 5)
      .map((p) => ({
        id: p.id,
        totalAmount: p.totalAmount,
        paymentDueDate: p.paymentDueDate,
        supplierName: p.supplierName,
      }));

    // Expiring warranties (from line items with warranty date in future)
    const expiringWarranties = filteredLineItems
      .filter((li) => li.warrantyExpiresAt && new Date(li.warrantyExpiresAt) >= today)
      .sort((a, b) => new Date(a.warrantyExpiresAt!).getTime() - new Date(b.warrantyExpiresAt!).getTime())
      .slice(0, 5)
      .map((li) => ({
        id: li.id,
        description: li.description,
        brand: li.brand,
        warrantyExpiresAt: li.warrantyExpiresAt,
      }));

    // Expiring documents
    const ninetyDaysFromNow = new Date(today.getTime() + 90 * 24 * 60 * 60 * 1000);
    const expiringDocuments = filteredDocuments
      .filter(
        (d) =>
          d.houseDocumentType &&
          d.expiresAt &&
          new Date(d.expiresAt) <= ninetyDaysFromNow
      )
      .sort((a, b) => new Date(a.expiresAt!).getTime() - new Date(b.expiresAt!).getTime())
      .slice(0, 5)
      .map((d) => ({
        id: d.id,
        documentTitle: d.documentTitle,
        fileName: d.fileName,
        houseDocumentType: d.houseDocumentType,
        expiresAt: d.expiresAt,
      }));

    return {
      stats,
      spendingByArea,
      spendingByType,
      spendingByCategory,
      spendingByRoom,
      recentPurchases,
      upcomingPayments,
      expiringWarranties,
      expiringDocuments,
    };
  }, [purchases, areas, rooms, lineItems, documents, categoryLabels, selectedHomeId]);

  return (
    <>
      <StatsCards stats={dashboardData.stats} />

      <div className="grid gap-4 md:grid-cols-2">
        <SpendingByAreaChart data={dashboardData.spendingByArea} />
        <SpendingByTypeChart data={dashboardData.spendingByType} />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <SpendingByCategoryChart data={dashboardData.spendingByCategory} />
        <SpendingByRoomChart data={dashboardData.spendingByRoom} />
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <RecentPurchases purchases={dashboardData.recentPurchases} />
        </div>
        <div className="space-y-4">
          <UpcomingPayments payments={dashboardData.upcomingPayments} />
          <ExpiringWarranties warranties={dashboardData.expiringWarranties} />
          <ExpiringDocuments documents={dashboardData.expiringDocuments} />
        </div>
      </div>

      <BudgetProgress areas={dashboardData.spendingByArea} />
    </>
  );
}
