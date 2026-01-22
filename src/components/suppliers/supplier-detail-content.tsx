"use client";

import Link from "next/link";
import { ArrowLeft, Building2, User, Star, Mail, Phone, Edit } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { formatCurrency } from "@/lib/utils";
import { LocalizedDate } from "@/components/ui/localized-date";
import { DeleteSupplierButton } from "@/components/suppliers/delete-supplier-button";
import { useTranslation } from "@/lib/i18n/client";

interface Purchase {
  id: string;
  date: Date;
  totalAmount: string | number;
  purchaseType: string;
  paymentStatus: string;
}

interface SupplierDetailContentProps {
  id: string;
  supplier: {
    id: string;
    type: "company" | "individual";
    companyName: string | null;
    firstName: string | null;
    lastName: string | null;
    email: string | null;
    phone: string | null;
    companyAddress: string | null;
    rating: number | null;
    notes: string | null;
    createdAt: Date;
    purchases: Purchase[];
    totalSpending: number;
  };
}

export function SupplierDetailContent({ id, supplier }: SupplierDetailContentProps) {
  const { t } = useTranslation();

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

  const statusVariants: Record<string, "default" | "secondary" | "success" | "warning"> = {
    pending: "warning",
    partial: "secondary",
    paid: "success",
  };

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
            {supplier.type === "company" ? t("suppliers.company") : t("suppliers.individual")}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" asChild>
            <Link href={`/suppliers/${id}/edit`}>
              <Edit className="mr-2 h-4 w-4" />
              {t("common.edit")}
            </Link>
          </Button>
          <DeleteSupplierButton id={id} name={displayName || ""} />
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <div className="md:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>{t("suppliers.contactInformation")}</CardTitle>
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
                  <p className="text-sm text-muted-foreground mb-1">{t("suppliers.address")}</p>
                  <p className="whitespace-pre-line">{supplier.companyAddress}</p>
                </div>
              )}

              {supplier.rating && (
                <div>
                  <p className="text-sm text-muted-foreground mb-1">{t("suppliers.rating")}</p>
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
                  <p className="text-sm text-muted-foreground mb-1">{t("suppliers.notes")}</p>
                  <p className="whitespace-pre-line">{supplier.notes}</p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{t("suppliers.purchaseHistory")}</CardTitle>
              <CardDescription>
                {supplier.purchases.length} {supplier.purchases.length !== 1 ? t("common.purchases") : t("common.purchase")}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {supplier.purchases.length === 0 ? (
                <p className="text-muted-foreground">{t("common.noPurchases")}</p>
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
                            <LocalizedDate date={purchase.date} />
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
                          {statusLabels[purchase.paymentStatus]}
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
              <CardTitle>{t("suppliers.statistics")}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground">{t("dashboard.totalSpending")}</p>
                <p className="text-2xl font-bold">
                  {formatCurrency(supplier.totalSpending)}
                </p>
              </div>
              <Separator />
              <div>
                <p className="text-sm text-muted-foreground">{t("suppliers.totalPurchases")}</p>
                <p className="text-2xl font-bold">{supplier.purchases.length}</p>
              </div>
              <Separator />
              <div>
                <p className="text-sm text-muted-foreground">{t("suppliers.memberSince")}</p>
                <p className="text-lg font-medium">
                  <LocalizedDate date={supplier.createdAt} />
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{t("suppliers.quickActions")}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button className="w-full" asChild>
                <Link href={`/purchases/new?supplier=${id}`}>
                  {t("purchases.addPurchase")}
                </Link>
              </Button>
              {supplier.email && (
                <Button variant="outline" className="w-full" asChild>
                  <a href={`mailto:${supplier.email}`}>{t("suppliers.sendEmail")}</a>
                </Button>
              )}
              {supplier.phone && (
                <Button variant="outline" className="w-full" asChild>
                  <a href={`tel:${supplier.phone}`}>{t("suppliers.call")}</a>
                </Button>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
