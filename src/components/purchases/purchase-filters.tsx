"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { getIconByName } from "@/lib/categories";
import { useTranslation } from "@/lib/i18n/client";
import type { ExpenseCategoryRecord } from "@/lib/db/schema";

export function PurchaseFilters() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { t } = useTranslation();
  const [categories, setCategories] = useState<ExpenseCategoryRecord[]>([]);

  // Fetch categories from API
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await fetch("/api/categories");
        if (response.ok) {
          const data = await response.json();
          setCategories(data);
        }
      } catch (error) {
        console.error("Failed to fetch categories:", error);
      }
    };
    fetchCategories();
  }, []);

  const handleStatusChange = (value: string) => {
    const params = new URLSearchParams(searchParams);
    if (value && value !== "all") {
      params.set("status", value);
    } else {
      params.delete("status");
    }
    router.push(`/purchases?${params.toString()}`);
  };

  const handleCategoryChange = (value: string) => {
    const params = new URLSearchParams(searchParams);
    if (value && value !== "all") {
      params.set("category", value);
    } else {
      params.delete("category");
    }
    router.push(`/purchases?${params.toString()}`);
  };

  return (
    <div className="flex gap-4 flex-wrap">
      <Select
        value={searchParams.get("status") || "all"}
        onValueChange={handleStatusChange}
      >
        <SelectTrigger className="w-40">
          <SelectValue placeholder={t("purchases.filterByStatus")} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">{t("purchases.allStatus")}</SelectItem>
          <SelectItem value="pending">{t("purchases.pending")}</SelectItem>
          <SelectItem value="partial">{t("purchases.partial")}</SelectItem>
          <SelectItem value="paid">{t("purchases.paid")}</SelectItem>
        </SelectContent>
      </Select>

      <Select
        value={searchParams.get("category") || "all"}
        onValueChange={handleCategoryChange}
      >
        <SelectTrigger className="w-44">
          <SelectValue placeholder={t("purchases.filterByCategory")} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">{t("purchases.allCategories")}</SelectItem>
          {categories.map((category) => {
            const IconComponent = getIconByName(category.iconName);
            return (
              <SelectItem key={category.name} value={category.name}>
                <div className="flex items-center gap-2">
                  <IconComponent className={`h-4 w-4 ${category.color}`} />
                  {category.label}
                </div>
              </SelectItem>
            );
          })}
        </SelectContent>
      </Select>
    </div>
  );
}
