import Link from "next/link";
import { db } from "@/lib/db";
import { purchaseLineItems, purchases, suppliers } from "@/lib/db/schema";
import { eq, and, gte, lte, desc, isNotNull } from "drizzle-orm";
import { Shield, AlertTriangle, CheckCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formatDate } from "@/lib/utils";

function getDaysUntilExpiry(date: Date): number {
  const today = new Date();
  const diffTime = date.getTime() - today.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

async function getWarranties() {
  const today = new Date();
  const thirtyDaysFromNow = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000);
  const ninetyDaysFromNow = new Date(today.getTime() + 90 * 24 * 60 * 60 * 1000);

  const results = await db
    .select({
      lineItem: purchaseLineItems,
      purchaseId: purchases.id,
      purchaseDate: purchases.date,
      supplierName: suppliers.companyName,
      supplierFirstName: suppliers.firstName,
      supplierLastName: suppliers.lastName,
      supplierType: suppliers.type,
    })
    .from(purchaseLineItems)
    .innerJoin(purchases, eq(purchaseLineItems.purchaseId, purchases.id))
    .leftJoin(suppliers, eq(purchases.supplierId, suppliers.id))
    .where(
      and(
        eq(purchases.isDeleted, false),
        isNotNull(purchaseLineItems.warrantyExpiresAt)
      )
    )
    .orderBy(purchaseLineItems.warrantyExpiresAt);

  return results.map((r) => ({
    ...r.lineItem,
    purchaseId: r.purchaseId,
    purchaseDate: r.purchaseDate,
    supplierName:
      r.supplierType === "company"
        ? r.supplierName
        : `${r.supplierFirstName} ${r.supplierLastName}`,
    daysUntilExpiry: r.lineItem.warrantyExpiresAt
      ? getDaysUntilExpiry(r.lineItem.warrantyExpiresAt)
      : 0,
  }));
}

export default async function WarrantiesPage() {
  const warranties = await getWarranties();

  const expiringSoon = warranties.filter(
    (w) => w.daysUntilExpiry > 0 && w.daysUntilExpiry <= 30
  );
  const expiring90Days = warranties.filter(
    (w) => w.daysUntilExpiry > 30 && w.daysUntilExpiry <= 90
  );
  const active = warranties.filter((w) => w.daysUntilExpiry > 90);
  const expired = warranties.filter((w) => w.daysUntilExpiry <= 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Warranties</h1>
        <p className="text-muted-foreground">
          Track and manage product warranties
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-red-500" />
              Expiring Soon
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-500">
              {expiringSoon.length}
            </div>
            <p className="text-xs text-muted-foreground">Within 30 days</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Shield className="h-4 w-4 text-yellow-500" />
              Expiring in 90 Days
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-500">
              {expiring90Days.length}
            </div>
            <p className="text-xs text-muted-foreground">31-90 days</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-500" />
              Active
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-500">
              {active.length}
            </div>
            <p className="text-xs text-muted-foreground">More than 90 days</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Expired</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-muted-foreground">
              {expired.length}
            </div>
            <p className="text-xs text-muted-foreground">Past expiry</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="expiring">
        <TabsList>
          <TabsTrigger value="expiring">
            Expiring Soon ({expiringSoon.length})
          </TabsTrigger>
          <TabsTrigger value="active">
            Active ({active.length + expiring90Days.length})
          </TabsTrigger>
          <TabsTrigger value="expired">Expired ({expired.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="expiring" className="mt-6">
          <WarrantyList warranties={expiringSoon} showUrgent />
        </TabsContent>

        <TabsContent value="active" className="mt-6">
          <WarrantyList warranties={[...expiring90Days, ...active]} />
        </TabsContent>

        <TabsContent value="expired" className="mt-6">
          <WarrantyList warranties={expired} expired />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function WarrantyList({
  warranties,
  showUrgent,
  expired,
}: {
  warranties: any[];
  showUrgent?: boolean;
  expired?: boolean;
}) {
  if (warranties.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <Shield className="h-12 w-12 text-muted-foreground mb-4" />
          <p className="text-muted-foreground">
            {expired ? "No expired warranties" : "No warranties in this category"}
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="space-y-4">
          {warranties.map((warranty) => (
            <Link
              key={warranty.id}
              href={`/purchases/${warranty.purchaseId}`}
              className="flex items-center justify-between p-4 rounded-lg border hover:bg-muted/50 transition-colors"
            >
              <div className="space-y-1">
                <div className="font-medium">{warranty.description}</div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  {warranty.brand && <span>{warranty.brand}</span>}
                  <span>from {warranty.supplierName}</span>
                </div>
                <div className="text-xs text-muted-foreground">
                  Purchased: {formatDate(warranty.purchaseDate)}
                </div>
              </div>
              <div className="text-right">
                <Badge
                  variant={
                    expired
                      ? "secondary"
                      : showUrgent
                      ? "destructive"
                      : warranty.daysUntilExpiry <= 90
                      ? "warning"
                      : "success"
                  }
                >
                  {expired
                    ? `Expired ${Math.abs(warranty.daysUntilExpiry)} days ago`
                    : `${warranty.daysUntilExpiry} days left`}
                </Badge>
                <p className="text-xs text-muted-foreground mt-1">
                  Expires: {formatDate(warranty.warrantyExpiresAt)}
                </p>
              </div>
            </Link>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
