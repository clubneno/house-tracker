export const dynamic = 'force-dynamic';

import Link from "next/link";
import { db } from "@/lib/db";
import { suppliers, purchases } from "@/lib/db/schema";
import { eq, desc, sum, count } from "drizzle-orm";
import { Plus, Star, Building2, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/utils";
import { SupplierSearch } from "@/components/suppliers/supplier-search";

async function getSuppliers() {
  const result = await db
    .select({
      supplier: suppliers,
      totalSpending: sum(purchases.totalAmount),
      purchaseCount: count(purchases.id),
    })
    .from(suppliers)
    .leftJoin(
      purchases,
      eq(purchases.supplierId, suppliers.id)
    )
    .where(eq(suppliers.isDeleted, false))
    .groupBy(suppliers.id)
    .orderBy(desc(suppliers.createdAt));

  return result.map((r) => ({
    ...r.supplier,
    totalSpending: Number(r.totalSpending || 0),
    purchaseCount: Number(r.purchaseCount || 0),
  }));
}

function RatingStars({ rating }: { rating: number | null }) {
  if (!rating) return <span className="text-muted-foreground text-sm">No rating</span>;
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          className={`h-4 w-4 ${
            star <= rating ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground"
          }`}
        />
      ))}
    </div>
  );
}

export default async function SuppliersPage() {
  const supplierList = await getSuppliers();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Suppliers</h1>
          <p className="text-muted-foreground">
            Manage your suppliers and contractors
          </p>
        </div>
        <Button asChild>
          <Link href="/suppliers/new">
            <Plus className="mr-2 h-4 w-4" />
            Add Supplier
          </Link>
        </Button>
      </div>

      <SupplierSearch />

      {supplierList.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <p className="text-muted-foreground mb-4">No suppliers yet</p>
            <Button asChild>
              <Link href="/suppliers/new">Add your first supplier</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {supplierList.map((supplier) => (
            <Link key={supplier.id} href={`/suppliers/${supplier.id}`}>
              <Card className="hover:bg-muted/50 transition-colors cursor-pointer h-full">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      {supplier.type === "company" ? (
                        <Building2 className="h-5 w-5 text-muted-foreground" />
                      ) : (
                        <User className="h-5 w-5 text-muted-foreground" />
                      )}
                      <CardTitle className="text-lg">
                        {supplier.type === "company"
                          ? supplier.companyName
                          : `${supplier.firstName} ${supplier.lastName}`}
                      </CardTitle>
                    </div>
                    <Badge variant="outline">
                      {supplier.type === "company" ? "Company" : "Individual"}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <RatingStars rating={supplier.rating} />

                  {supplier.email && (
                    <p className="text-sm text-muted-foreground truncate">
                      {supplier.email}
                    </p>
                  )}

                  {supplier.phone && (
                    <p className="text-sm text-muted-foreground">
                      {supplier.phone}
                    </p>
                  )}

                  <div className="pt-3 border-t flex justify-between text-sm">
                    <span className="text-muted-foreground">
                      {supplier.purchaseCount} purchase{supplier.purchaseCount !== 1 ? "s" : ""}
                    </span>
                    <span className="font-medium">
                      {formatCurrency(supplier.totalSpending)}
                    </span>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
