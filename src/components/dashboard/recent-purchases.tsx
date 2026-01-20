import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatCurrency, formatDate } from "@/lib/utils";

interface RecentPurchasesProps {
  purchases: {
    id: string;
    date: Date;
    totalAmount: number;
    purchaseType: string;
    paymentStatus: string;
    supplierName: string | null;
  }[];
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

export function RecentPurchases({ purchases }: RecentPurchasesProps) {
  if (purchases.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Recent Purchases</CardTitle>
          <CardDescription>Latest purchase transactions</CardDescription>
        </CardHeader>
        <CardContent className="flex h-[200px] items-center justify-center">
          <div className="text-center">
            <p className="text-muted-foreground">No purchases yet</p>
            <Button asChild className="mt-4">
              <Link href="/purchases/new">Add Purchase</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Recent Purchases</CardTitle>
          <CardDescription>Latest purchase transactions</CardDescription>
        </div>
        <Button asChild variant="outline" size="sm">
          <Link href="/purchases">View all</Link>
        </Button>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {purchases.map((purchase) => (
            <div
              key={purchase.id}
              className="flex items-center justify-between border-b pb-4 last:border-0 last:pb-0"
            >
              <div className="space-y-1">
                <Link
                  href={`/purchases/${purchase.id}`}
                  className="font-medium hover:underline"
                >
                  {purchase.supplierName || "Unknown Supplier"}
                </Link>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <span>{formatDate(purchase.date)}</span>
                  <Badge variant="outline">{typeLabels[purchase.purchaseType]}</Badge>
                </div>
              </div>
              <div className="text-right">
                <div className="font-medium">{formatCurrency(purchase.totalAmount)}</div>
                <Badge variant={statusVariants[purchase.paymentStatus]}>
                  {purchase.paymentStatus}
                </Badge>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
