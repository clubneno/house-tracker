"use client";

import Link from "next/link";
import { Building2, User, Star } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/utils";
import { useTranslation } from "@/lib/i18n/client";

interface SupplierCardProps {
  supplier: {
    id: string;
    type: "company" | "individual";
    companyName: string | null;
    firstName: string | null;
    lastName: string | null;
    email: string | null;
    phone: string | null;
    rating: number | null;
    totalSpending: number;
    purchaseCount: number;
  };
}

function RatingStars({ rating, noRatingText }: { rating: number | null; noRatingText: string }) {
  if (!rating) return <span className="text-muted-foreground text-sm">{noRatingText}</span>;
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

export function SupplierCard({ supplier }: SupplierCardProps) {
  const { t } = useTranslation();

  const displayName =
    supplier.type === "company"
      ? supplier.companyName
      : `${supplier.firstName} ${supplier.lastName}`;

  const typeLabel =
    supplier.type === "company" ? t("suppliers.company") : t("suppliers.individual");

  const purchaseLabel =
    supplier.purchaseCount === 1 ? t("suppliers.purchase") : t("suppliers.purchases");

  return (
    <Link href={`/suppliers/${supplier.id}`}>
      <Card className="hover:bg-muted/50 transition-colors cursor-pointer h-full">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2">
              {supplier.type === "company" ? (
                <Building2 className="h-5 w-5 text-muted-foreground" />
              ) : (
                <User className="h-5 w-5 text-muted-foreground" />
              )}
              <CardTitle className="text-lg">{displayName}</CardTitle>
            </div>
            <Badge variant="outline">{typeLabel}</Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <RatingStars rating={supplier.rating} noRatingText={t("suppliers.noRating")} />

          {supplier.email && (
            <p className="text-sm text-muted-foreground truncate">{supplier.email}</p>
          )}

          {supplier.phone && (
            <p className="text-sm text-muted-foreground">{supplier.phone}</p>
          )}

          <div className="pt-3 border-t flex justify-between text-sm">
            <span className="text-muted-foreground">
              {supplier.purchaseCount} {purchaseLabel}
            </span>
            <span className="font-medium">{formatCurrency(supplier.totalSpending)}</span>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
