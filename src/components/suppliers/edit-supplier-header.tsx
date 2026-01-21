"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTranslation } from "@/lib/i18n/client";

interface EditSupplierHeaderProps {
  supplierId: string;
  displayName: string;
}

export function EditSupplierHeader({ supplierId, displayName }: EditSupplierHeaderProps) {
  const { t } = useTranslation();

  return (
    <div className="flex items-center gap-4">
      <Button variant="ghost" size="icon" asChild>
        <Link href={`/suppliers/${supplierId}`}>
          <ArrowLeft className="h-4 w-4" />
        </Link>
      </Button>
      <div>
        <h1 className="text-3xl font-bold tracking-tight">{t("suppliers.editSupplier")}</h1>
        <p className="text-muted-foreground">{displayName}</p>
      </div>
    </div>
  );
}
