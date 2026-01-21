"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState, useTransition } from "react";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useTranslation } from "@/lib/i18n/client";

export function SupplierSearch() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const [search, setSearch] = useState(searchParams.get("search") || "");
  const { t } = useTranslation();

  const currentType = searchParams.get("type") || "all";

  const handleSearch = (value: string) => {
    setSearch(value);
    startTransition(() => {
      const params = new URLSearchParams(searchParams);
      if (value) {
        params.set("search", value);
      } else {
        params.delete("search");
      }
      router.push(`/suppliers?${params.toString()}`);
    });
  };

  const handleTypeChange = (value: string) => {
    startTransition(() => {
      const params = new URLSearchParams(searchParams);
      if (value && value !== "all") {
        params.set("type", value);
      } else {
        params.delete("type");
      }
      router.push(`/suppliers?${params.toString()}`);
    });
  };

  return (
    <div className="flex flex-col sm:flex-row gap-3">
      <div className="relative flex-1 max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder={t("suppliers.searchPlaceholder")}
          value={search}
          onChange={(e) => handleSearch(e.target.value)}
          className="pl-10"
        />
      </div>
      <Select value={currentType} onValueChange={handleTypeChange}>
        <SelectTrigger className="w-full sm:w-[180px]">
          <SelectValue placeholder={t("suppliers.allTypes")} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">{t("suppliers.allTypes")}</SelectItem>
          <SelectItem value="company">{t("suppliers.company")}</SelectItem>
          <SelectItem value="individual">{t("suppliers.individual")}</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}
