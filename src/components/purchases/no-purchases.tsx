"use client";

import Link from "next/link";
import { ShoppingCart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useTranslation } from "@/lib/i18n/client";

export function NoPurchases() {
  const { t } = useTranslation();

  return (
    <Card>
      <CardContent className="flex flex-col items-center justify-center py-12">
        <ShoppingCart className="h-12 w-12 text-muted-foreground mb-4" />
        <p className="text-muted-foreground mb-4">{t("common.noPurchases")}</p>
        <Button asChild>
          <Link href="/purchases/new">{t("purchases.addFirstPurchase")}</Link>
        </Button>
      </CardContent>
    </Card>
  );
}
