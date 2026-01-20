import { notFound } from "next/navigation";
import Link from "next/link";
import { db } from "@/lib/db";
import { purchases, purchaseLineItems, suppliers, areas, rooms, attachments } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { ArrowLeft, ShoppingCart, Edit, Receipt, Shield, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  TableFooter,
} from "@/components/ui/table";
import { formatCurrency, formatDate } from "@/lib/utils";
import { DeletePurchaseButton } from "@/components/purchases/delete-purchase-button";

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

async function getPurchase(id: string) {
  const [result] = await db
    .select({
      purchase: purchases,
      supplierName: suppliers.companyName,
      supplierFirstName: suppliers.firstName,
      supplierLastName: suppliers.lastName,
      supplierType: suppliers.type,
      supplierEmail: suppliers.email,
      supplierPhone: suppliers.phone,
      areaName: areas.name,
      roomName: rooms.name,
    })
    .from(purchases)
    .leftJoin(suppliers, eq(purchases.supplierId, suppliers.id))
    .leftJoin(areas, eq(purchases.areaId, areas.id))
    .leftJoin(rooms, eq(purchases.roomId, rooms.id))
    .where(and(eq(purchases.id, id), eq(purchases.isDeleted, false)))
    .limit(1);

  if (!result) return null;

  const lineItems = await db
    .select()
    .from(purchaseLineItems)
    .where(eq(purchaseLineItems.purchaseId, id));

  const purchaseAttachments = await db
    .select()
    .from(attachments)
    .where(eq(attachments.purchaseId, id));

  return {
    ...result.purchase,
    totalAmount: Number(result.purchase.totalAmount),
    supplierName:
      result.supplierType === "company"
        ? result.supplierName
        : `${result.supplierFirstName} ${result.supplierLastName}`,
    supplierEmail: result.supplierEmail,
    supplierPhone: result.supplierPhone,
    areaName: result.areaName,
    roomName: result.roomName,
    lineItems: lineItems.map((item) => ({
      ...item,
      quantity: Number(item.quantity),
      unitPrice: Number(item.unitPrice),
      totalPrice: Number(item.totalPrice),
    })),
    attachments: purchaseAttachments,
  };
}

export default async function PurchaseDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const purchase = await getPurchase(id);

  if (!purchase) {
    notFound();
  }

  const warrantyItems = purchase.lineItems.filter((item) => item.warrantyMonths);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/purchases">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <ShoppingCart className="h-6 w-6 text-muted-foreground" />
            <h1 className="text-3xl font-bold tracking-tight">
              Purchase from {purchase.supplierName}
            </h1>
          </div>
          <p className="text-muted-foreground">{formatDate(purchase.date)}</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" asChild>
            <Link href={`/purchases/${id}/edit`}>
              <Edit className="mr-2 h-4 w-4" />
              Edit
            </Link>
          </Button>
          <DeletePurchaseButton id={id} />
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <div className="md:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Line Items</CardTitle>
              <CardDescription>
                {purchase.lineItems.length} item{purchase.lineItems.length !== 1 ? "s" : ""}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Description</TableHead>
                    <TableHead>Brand</TableHead>
                    <TableHead className="text-right">Qty</TableHead>
                    <TableHead className="text-right">Unit Price</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {purchase.lineItems.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell>
                        <div>
                          <span className="font-medium">{item.description}</span>
                          {item.warrantyMonths && (
                            <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                              <Shield className="h-3 w-3" />
                              {item.warrantyMonths} month warranty
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>{item.brand || "-"}</TableCell>
                      <TableCell className="text-right">{item.quantity}</TableCell>
                      <TableCell className="text-right">
                        {formatCurrency(item.unitPrice)}
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {formatCurrency(item.totalPrice)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
                <TableFooter>
                  <TableRow>
                    <TableCell colSpan={4}>Total</TableCell>
                    <TableCell className="text-right font-bold">
                      {formatCurrency(purchase.totalAmount)}
                    </TableCell>
                  </TableRow>
                </TableFooter>
              </Table>
            </CardContent>
          </Card>

          {purchase.attachments.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Attachments
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-2">
                  {purchase.attachments.map((attachment) => (
                    <a
                      key={attachment.id}
                      href={attachment.fileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-3 p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                    >
                      <Receipt className="h-8 w-8 text-muted-foreground" />
                      <div>
                        <p className="font-medium truncate">{attachment.fileName}</p>
                        <p className="text-xs text-muted-foreground">
                          {attachment.fileType}
                        </p>
                      </div>
                    </a>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {purchase.notes && (
            <Card>
              <CardHeader>
                <CardTitle>Notes</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="whitespace-pre-line">{purchase.notes}</p>
              </CardContent>
            </Card>
          )}
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground">Type</p>
                <Badge variant="outline" className="mt-1">
                  {typeLabels[purchase.purchaseType]}
                </Badge>
              </div>

              <Separator />

              <div>
                <p className="text-sm text-muted-foreground">Payment Status</p>
                <Badge variant={statusVariants[purchase.paymentStatus]} className="mt-1">
                  {purchase.paymentStatus}
                </Badge>
              </div>

              {purchase.paymentDueDate && (
                <>
                  <Separator />
                  <div>
                    <p className="text-sm text-muted-foreground">Payment Due</p>
                    <p className="font-medium mt-1">
                      {formatDate(purchase.paymentDueDate)}
                    </p>
                  </div>
                </>
              )}

              <Separator />

              <div>
                <p className="text-sm text-muted-foreground">Location</p>
                <p className="font-medium mt-1">
                  {purchase.roomName ? (
                    <>
                      {purchase.roomName}
                      {purchase.areaName && (
                        <span className="text-muted-foreground">
                          {" "}({purchase.areaName})
                        </span>
                      )}
                    </>
                  ) : purchase.areaName ? (
                    purchase.areaName
                  ) : (
                    <span className="text-muted-foreground">Not specified</span>
                  )}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Supplier</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Link
                href={`/suppliers/${purchase.supplierId}`}
                className="font-medium text-primary hover:underline"
              >
                {purchase.supplierName}
              </Link>

              {purchase.supplierEmail && (
                <p className="text-sm">
                  <a
                    href={`mailto:${purchase.supplierEmail}`}
                    className="text-primary hover:underline"
                  >
                    {purchase.supplierEmail}
                  </a>
                </p>
              )}

              {purchase.supplierPhone && (
                <p className="text-sm">
                  <a
                    href={`tel:${purchase.supplierPhone}`}
                    className="text-primary hover:underline"
                  >
                    {purchase.supplierPhone}
                  </a>
                </p>
              )}
            </CardContent>
          </Card>

          {warrantyItems.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  Warranties
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {warrantyItems.map((item) => (
                  <div key={item.id} className="text-sm">
                    <p className="font-medium">{item.description}</p>
                    <p className="text-muted-foreground">
                      {item.warrantyMonths} months
                      {item.warrantyExpiresAt && (
                        <> (expires {formatDate(item.warrantyExpiresAt)})</>
                      )}
                    </p>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
