"use client";

import Link from "next/link";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTranslation } from "@/lib/i18n/client";

export function AddSupplierButton() {
  const { t } = useTranslation();

  return (
    <Button asChild>
      <Link href="/suppliers/new">
        <Plus className="mr-2 h-4 w-4" />
        {t("suppliers.addSupplier")}
      </Link>
    </Button>
  );
}
