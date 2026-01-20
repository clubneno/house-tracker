export const dynamic = 'force-dynamic';

import { notFound } from "next/navigation";
import Link from "next/link";
import { db } from "@/lib/db";
import { suppliers, purchases } from "@/lib/db/schema";
import { eq, and, desc, sum } from "drizzle-orm";
import { ArrowLeft, Building2, User, Star, Mail, Phone, Edit, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { formatCurrency, formatDate } from "@/lib/utils";
import { DeleteSupplierButton } from "@/components/suppliers/delete-supplier-button";

async function getSupplier(id: string) {
  const [supplier] = await db
    .select()
    .from(suppliers)
    .where(and(eq(suppliers.id, id), eq(suppliers.isDeleted, false)))
    .limit(1);

  if (!supplier) return null;

  const purchaseHistory = await db
    .select({
      id: purchases.id,
      date: purchases.date,
      totalAmount: purchases.totalAmount,
      purchaseType: purchases.purchaseType,
      paymentStatus: purchases.paymentStatus,
    })
    .from(purchases)
    .where(and(eq(purchases.supplierId, id), eq(purchases.isDeleted, false)))
    .orderBy(desc(purchases.date));

  const [totalSpending] = await db
    .select({ total: sum(purchases.totalAmount) })
    .from(purchases)
    .where(and(eq(purchases.supplierId, id), eq(purchases.isDeleted, false)));

  return {
    ...supplier,
    purchases: purchaseHistory,
    totalSpending: Number(totalSpending?.total || 0),
  };
}

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

export default async function SupplierDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supplier = await getSupplier(id);

  if (!supplier) {
    notFound();
  }

  const displayName =
    supplier.type === "company"
      ? supplier.companyName
      : `${supplier.firstName} ${supplier.lastName}`;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/suppliers">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            {supplier.type === "company" ? (
              <Building2 className="h-6 w-6 text-muted-foreground" />
            ) : (
              <User className="h-6 w-6 text-muted-foreground" />
            )}
            <h1 className="text-3xl font-bold tracking-tight">{displayName}</h1>
          </div>
          <p className="text-muted-foreground">
            {supplier.type === "company" ? "Company" : "Individual"}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" asChild>
            <Link href={`/suppliers/${id}/edit`}>
              <Edit className="mr-2 h-4 w-4" />
              Edit
            </Link>
          </Button>
          <DeleteSupplierButton id={id} name={displayName || ""} />
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <div className="md:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Contact Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {supplier.email && (
                <div className="flex items-center gap-3">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <a
                    href={`mailto:${supplier.email}`}
                    className="text-primary hover:underline"
                  >
                    {supplier.email}
                  </a>
                </div>
              )}

              {supplier.phone && (
                <div className="flex items-center gap-3">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <a
                    href={`tel:${supplier.phone}`}
                    className="text-primary hover:underline"
                  >
                    {supplier.phone}
                  </a>
                </div>
              )}

              {supplier.type === "company" && supplier.companyAddress && (
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Address</p>
                  <p className="whitespace-pre-line">{supplier.companyAddress}</p>
                </div>
              )}

              {supplier.rating && (
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Rating</p>
                  <div className="flex items-center gap-0.5">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        className={`h-5 w-5 ${
                          star <= supplier.rating!
                            ? "fill-yellow-400 text-yellow-400"
                            : "text-muted-foreground"
                        }`}
                      />
                    ))}
                  </div>
                </div>
              )}

              {supplier.notes && (
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Notes</p>
                  <p className="whitespace-pre-line">{supplier.notes}</p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Purchase History</CardTitle>
              <CardDescription>
                {supplier.purchases.length} purchase
                {supplier.purchases.length !== 1 ? "s" : ""}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {supplier.purchases.length === 0 ? (
                <p className="text-muted-foreground">No purchases yet</p>
              ) : (
                <div className="space-y-4">
                  {supplier.purchases.map((purchase) => (
                    <Link
                      key={purchase.id}
                      href={`/purchases/${purchase.id}`}
                      className="flex items-center justify-between p-3 rounded-lg hover:bg-muted/50 transition-colors"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">
                            {formatDate(purchase.date)}
                          </span>
                          <Badge variant="outline">
                            {typeLabels[purchase.purchaseType]}
                          </Badge>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-medium">
                          {formatCurrency(Number(purchase.totalAmount))}
                        </div>
                        <Badge variant={statusVariants[purchase.paymentStatus]}>
                          {purchase.paymentStatus}
                        </Badge>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Statistics</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground">Total Spending</p>
                <p className="text-2xl font-bold">
                  {formatCurrency(supplier.totalSpending)}
                </p>
              </div>
              <Separator />
              <div>
                <p className="text-sm text-muted-foreground">Total Purchases</p>
                <p className="text-2xl font-bold">{supplier.purchases.length}</p>
              </div>
              <Separator />
              <div>
                <p className="text-sm text-muted-foreground">Member Since</p>
                <p className="text-lg font-medium">
                  {formatDate(supplier.createdAt)}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button className="w-full" asChild>
                <Link href={`/purchases/new?supplier=${id}`}>
                  Add Purchase
                </Link>
              </Button>
              {supplier.email && (
                <Button variant="outline" className="w-full" asChild>
                  <a href={`mailto:${supplier.email}`}>Send Email</a>
                </Button>
              )}
              {supplier.phone && (
                <Button variant="outline" className="w-full" asChild>
                  <a href={`tel:${supplier.phone}`}>Call</a>
                </Button>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
