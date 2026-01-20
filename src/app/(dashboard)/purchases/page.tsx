import Link from "next/link";
import { db } from "@/lib/db";
import { purchases, suppliers, areas, rooms } from "@/lib/db/schema";
import { eq, desc, and } from "drizzle-orm";
import { Plus, ShoppingCart, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatCurrency, formatDate } from "@/lib/utils";
import { PurchaseFilters } from "@/components/purchases/purchase-filters";

const typeLabels: Record<string, string> = {
  service: "Service",
  materials: "Materials",
  products: "Products",
  indirect: "Indirect",
};

const statusVariants: Record<string, "default" | "secondary" | "success" | "warning"> = {
  pending: "warning",
  partial: "secondary",
  paid: "success",
};

async function getPurchases() {
  const result = await db
    .select({
      purchase: purchases,
      supplierName: suppliers.companyName,
      supplierFirstName: suppliers.firstName,
      supplierLastName: suppliers.lastName,
      supplierType: suppliers.type,
      areaName: areas.name,
      roomName: rooms.name,
    })
    .from(purchases)
    .leftJoin(suppliers, eq(purchases.supplierId, suppliers.id))
    .leftJoin(areas, eq(purchases.areaId, areas.id))
    .leftJoin(rooms, eq(purchases.roomId, rooms.id))
    .where(eq(purchases.isDeleted, false))
    .orderBy(desc(purchases.date));

  return result.map((r) => ({
    ...r.purchase,
    totalAmount: Number(r.purchase.totalAmount),
    supplierName:
      r.supplierType === "company"
        ? r.supplierName
        : `${r.supplierFirstName} ${r.supplierLastName}`,
    areaName: r.areaName,
    roomName: r.roomName,
  }));
}

export default async function PurchasesPage() {
  const purchaseList = await getPurchases();

  const totalSpending = purchaseList.reduce((sum, p) => sum + p.totalAmount, 0);
  const pendingCount = purchaseList.filter((p) => p.paymentStatus === "pending").length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Purchases</h1>
          <p className="text-muted-foreground">
            {purchaseList.length} purchases totaling {formatCurrency(totalSpending)}
          </p>
        </div>
        <Button asChild>
          <Link href="/purchases/new">
            <Plus className="mr-2 h-4 w-4" />
            Add Purchase
          </Link>
        </Button>
      </div>

      {pendingCount > 0 && (
        <Card className="bg-yellow-50 border-yellow-200 dark:bg-yellow-900/20">
          <CardContent className="py-3">
            <p className="text-sm text-yellow-800 dark:text-yellow-200">
              You have {pendingCount} pending payment{pendingCount !== 1 ? "s" : ""}
            </p>
          </CardContent>
        </Card>
      )}

      {purchaseList.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <ShoppingCart className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground mb-4">No purchases yet</p>
            <Button asChild>
              <Link href="/purchases/new">Add your first purchase</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Supplier</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {purchaseList.map((purchase) => (
                  <TableRow key={purchase.id}>
                    <TableCell>
                      <Link
                        href={`/purchases/${purchase.id}`}
                        className="font-medium hover:underline"
                      >
                        {formatDate(purchase.date)}
                      </Link>
                    </TableCell>
                    <TableCell>{purchase.supplierName}</TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {typeLabels[purchase.purchaseType]}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {purchase.roomName ? (
                        <span>
                          {purchase.roomName}
                          {purchase.areaName && (
                            <span className="text-muted-foreground">
                              {" "}({purchase.areaName})
                            </span>
                          )}
                        </span>
                      ) : purchase.areaName ? (
                        <span>{purchase.areaName}</span>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {formatCurrency(purchase.totalAmount)}
                    </TableCell>
                    <TableCell>
                      <Badge variant={statusVariants[purchase.paymentStatus]}>
                        {purchase.paymentStatus}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </Card>
      )}
    </div>
  );
}
