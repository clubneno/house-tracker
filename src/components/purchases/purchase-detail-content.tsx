"use client";

import Link from "next/link";
import { ArrowLeft, ShoppingCart, Edit, Shield } from "lucide-react";
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
import { useTranslation } from "@/lib/i18n/client";
import { DeletePurchaseButton } from "@/components/purchases/delete-purchase-button";
import { PurchaseAttachments } from "@/components/purchases/purchase-attachments";
import type { Attachment } from "@/lib/db/schema";

const statusVariants: Record<string, "default" | "secondary" | "success" | "warning"> = {
  pending: "warning",
  partial: "secondary",
  paid: "success",
};

interface LineItem {
  id: string;
  description: string;
  brand: string | null;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  warrantyMonths: number | null;
  warrantyExpiresAt: Date | null;
  areaName: string | null;
  roomName: string | null;
}

interface PurchaseDetailContentProps {
  id: string;
  purchase: {
    date: Date;
    supplierId: string;
    supplierName: string | null;
    supplierEmail: string | null;
    supplierPhone: string | null;
    purchaseType: string;
    paymentStatus: string;
    paymentDueDate: Date | null;
    totalAmount: number;
    notes: string | null;
    lineItems: LineItem[];
    attachments: Attachment[];
  };
}

export function PurchaseDetailContent({ id, purchase }: PurchaseDetailContentProps) {
  const { t, locale } = useTranslation();

  const typeLabels: Record<string, string> = {
    service: t("purchaseTypes.service"),
    materials: t("purchaseTypes.materials"),
    products: t("purchaseTypes.products"),
    indirect: t("purchaseTypes.indirect"),
  };

  const statusLabels: Record<string, string> = {
    pending: t("purchases.pending"),
    partial: t("purchases.partial"),
    paid: t("purchases.paid"),
  };

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
              {t("purchases.purchaseFrom")} {purchase.supplierName}
            </h1>
          </div>
          <p className="text-muted-foreground">{formatDate(purchase.date, locale)}</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" asChild>
            <Link href={`/purchases/${id}/edit`}>
              <Edit className="mr-2 h-4 w-4" />
              {t("common.edit")}
            </Link>
          </Button>
          <DeletePurchaseButton id={id} />
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <div className="md:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>{t("purchases.lineItems")}</CardTitle>
              <CardDescription>
                {purchase.lineItems.length} {purchase.lineItems.length !== 1 ? t("purchases.items") : t("purchases.item")}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t("purchases.description")}</TableHead>
                    <TableHead>{t("purchases.brand")}</TableHead>
                    <TableHead>{t("purchases.location")}</TableHead>
                    <TableHead className="text-right">{t("purchases.qty")}</TableHead>
                    <TableHead className="text-right">{t("purchases.unitPrice")}</TableHead>
                    <TableHead className="text-right">{t("common.total")}</TableHead>
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
                              {item.warrantyMonths} {t("purchases.monthWarranty")}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>{item.brand || "-"}</TableCell>
                      <TableCell>
                        {item.roomName ? (
                          <>
                            {item.roomName}
                            {item.areaName && (
                              <span className="text-muted-foreground text-sm">
                                {" "}({item.areaName})
                              </span>
                            )}
                          </>
                        ) : item.areaName ? (
                          item.areaName
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
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
                    <TableCell colSpan={5}>{t("common.total")}</TableCell>
                    <TableCell className="text-right font-bold">
                      {formatCurrency(purchase.totalAmount)}
                    </TableCell>
                  </TableRow>
                </TableFooter>
              </Table>
            </CardContent>
          </Card>

          <PurchaseAttachments
            purchaseId={id}
            attachments={purchase.attachments}
          />

          {purchase.notes && (
            <Card>
              <CardHeader>
                <CardTitle>{t("purchases.notes")}</CardTitle>
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
              <CardTitle>{t("purchases.details")}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground">{t("common.type")}</p>
                <Badge variant="outline" className="mt-1">
                  {typeLabels[purchase.purchaseType]}
                </Badge>
              </div>

              <Separator />

              <div>
                <p className="text-sm text-muted-foreground">{t("purchases.paymentStatus")}</p>
                <Badge variant={statusVariants[purchase.paymentStatus]} className="mt-1">
                  {statusLabels[purchase.paymentStatus]}
                </Badge>
              </div>

              {purchase.paymentDueDate && (
                <>
                  <Separator />
                  <div>
                    <p className="text-sm text-muted-foreground">{t("purchases.paymentDue")}</p>
                    <p className="font-medium mt-1">
                      {formatDate(purchase.paymentDueDate, locale)}
                    </p>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{t("purchases.supplier")}</CardTitle>
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
                  {t("warranties.title")}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {warrantyItems.map((item) => (
                  <div key={item.id} className="text-sm">
                    <p className="font-medium">{item.description}</p>
                    <p className="text-muted-foreground">
                      {item.warrantyMonths} {t("purchases.months")}
                      {item.warrantyExpiresAt && (
                        <> ({t("common.expires")} {formatDate(item.warrantyExpiresAt, locale)})</>
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
