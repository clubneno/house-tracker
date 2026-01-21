"use client";

import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useTranslation } from "@/lib/i18n/client";

export function NoSuppliers() {
  const { t } = useTranslation();

  return (
    <Card>
      <CardContent className="flex flex-col items-center justify-center py-12">
        <p className="text-muted-foreground mb-4">{t("suppliers.noSuppliers")}</p>
        <Button asChild>
          <Link href="/suppliers/new">{t("suppliers.addFirstSupplier")}</Link>
        </Button>
      </CardContent>
    </Card>
  );
}
