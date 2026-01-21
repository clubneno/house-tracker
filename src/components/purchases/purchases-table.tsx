"use client";

import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatCurrency, formatDate } from "@/lib/utils";
import { getCategoryLabelStatic, getCategoryColorStatic } from "@/lib/categories";
import { useTranslation } from "@/lib/i18n/client";

interface Purchase {
  id: string;
  date: Date;
  totalAmount: number;
  purchaseType: string;
  paymentStatus: string;
  expenseCategory: string | null;
  supplierName: string | null;
  areaName: string | null;
  roomName: string | null;
}

interface PurchasesTableProps {
  purchases: Purchase[];
}

const statusVariants: Record<string, "default" | "secondary" | "success" | "warning"> = {
  pending: "warning",
  partial: "secondary",
  paid: "success",
};

export function PurchasesTable({ purchases }: PurchasesTableProps) {
  const { t } = useTranslation();

  const typeLabels: Record<string, string> = {
    service: t("purchases.service"),
    materials: t("purchases.materials"),
    products: t("purchases.products"),
    indirect: t("purchases.indirect"),
  };

  const statusLabels: Record<string, string> = {
    pending: t("purchases.pending"),
    partial: t("purchases.partial"),
    paid: t("purchases.paid"),
  };

  return (
    <Card>
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t("purchases.date")}</TableHead>
              <TableHead>{t("purchases.supplier")}</TableHead>
              <TableHead>{t("common.type")}</TableHead>
              <TableHead>{t("purchases.category")}</TableHead>
              <TableHead>{t("purchases.location")}</TableHead>
              <TableHead className="text-right">{t("purchases.amount")}</TableHead>
              <TableHead>{t("purchases.status")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {purchases.map((purchase) => (
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
                  {purchase.expenseCategory ? (
                    <span className={`text-sm ${getCategoryColorStatic(purchase.expenseCategory)}`}>
                      {getCategoryLabelStatic(purchase.expenseCategory)}
                    </span>
                  ) : (
                    <span className="text-muted-foreground">-</span>
                  )}
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
                    {statusLabels[purchase.paymentStatus]}
                  </Badge>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </Card>
  );
}
