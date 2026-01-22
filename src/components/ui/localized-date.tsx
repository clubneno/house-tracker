"use client";

import { formatDate } from "@/lib/utils";
import { useTranslation } from "@/lib/i18n/client";

interface LocalizedDateProps {
  date: Date | string;
  className?: string;
}

export function LocalizedDate({ date, className }: LocalizedDateProps) {
  const { locale } = useTranslation();
  return <span className={className}>{formatDate(date, locale)}</span>;
}
