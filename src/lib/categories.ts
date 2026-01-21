import {
  Lightbulb,
  LayoutGrid,
  Paintbrush,
  Droplets,
  Zap,
  Wind,
  Hammer,
  DoorOpen,
  Home,
  Trees,
  Refrigerator,
  Sofa,
  Bath,
  HardHat,
  FileText,
  MoreHorizontal,
  LucideIcon,
  Wrench,
  Leaf,
  Package,
  Box,
  Building,
  Car,
  Cog,
  Cpu,
  Fence,
  Flame,
  Flower2,
  Gauge,
  Globe,
  Lamp,
  Lock,
  PaintBucket,
  Ruler,
  Shield,
  ShoppingBag,
  Sun,
  Thermometer,
  Settings,
  Truck,
  Umbrella,
  Wallet,
  Wifi,
} from "lucide-react";
import type { ExpenseCategoryRecord } from "@/lib/db/schema";

// Icon lookup map for dynamic icon resolution
export const iconMap: Record<string, LucideIcon> = {
  Lightbulb,
  LayoutGrid,
  Paintbrush,
  Droplets,
  Zap,
  Wind,
  Hammer,
  DoorOpen,
  Home,
  Trees,
  Refrigerator,
  Sofa,
  Bath,
  HardHat,
  FileText,
  MoreHorizontal,
  Wrench,
  Leaf,
  Package,
  Box,
  Building,
  Car,
  Cog,
  Cpu,
  Fence,
  Flame,
  Flower2,
  Gauge,
  Globe,
  Lamp,
  Lock,
  PaintBucket,
  Ruler,
  Shield,
  ShoppingBag,
  Sun,
  Thermometer,
  Settings,
  Truck,
  Umbrella,
  Wallet,
  Wifi,
};

// List of available icons for the icon picker
export const availableIcons = Object.keys(iconMap);

// Get icon component by name
export function getIconByName(iconName: string | null | undefined): LucideIcon {
  if (!iconName || !iconMap[iconName]) {
    return MoreHorizontal;
  }
  return iconMap[iconName];
}

// Category interface for use in components
export interface CategoryOption {
  value: string;
  label: string;
  iconName: string;
  color: string;
  bgColor: string;
}

// Helper functions for working with categories from the database
export function getCategoryLabel(
  categories: ExpenseCategoryRecord[],
  categoryName: string | null | undefined
): string {
  if (!categoryName) return "Uncategorized";
  const category = categories.find((c) => c.name === categoryName);
  return category?.label || categoryName;
}

export function getCategoryIcon(
  categories: ExpenseCategoryRecord[],
  categoryName: string | null | undefined
): LucideIcon {
  if (!categoryName) return MoreHorizontal;
  const category = categories.find((c) => c.name === categoryName);
  return category ? getIconByName(category.iconName) : MoreHorizontal;
}

export function getCategoryColor(
  categories: ExpenseCategoryRecord[],
  categoryName: string | null | undefined
): string {
  if (!categoryName) return "text-gray-600";
  const category = categories.find((c) => c.name === categoryName);
  return category?.color || "text-gray-600";
}

export function getCategoryBgColor(
  categories: ExpenseCategoryRecord[],
  categoryName: string | null | undefined
): string {
  if (!categoryName) return "bg-gray-50";
  const category = categories.find((c) => c.name === categoryName);
  return category?.bgColor || "bg-gray-50";
}

// Convert categories to options for select components
export function categoriesToOptions(
  categories: ExpenseCategoryRecord[]
): CategoryOption[] {
  return categories.map((category) => ({
    value: category.name,
    label: category.label,
    iconName: category.iconName,
    color: category.color,
    bgColor: category.bgColor,
  }));
}

// Default Tailwind color options for the color picker
export const colorOptions = [
  { value: "text-yellow-600", label: "Yellow", bgValue: "bg-yellow-50" },
  { value: "text-amber-700", label: "Amber", bgValue: "bg-amber-50" },
  { value: "text-orange-600", label: "Orange", bgValue: "bg-orange-50" },
  { value: "text-red-600", label: "Red", bgValue: "bg-red-50" },
  { value: "text-pink-600", label: "Pink", bgValue: "bg-pink-50" },
  { value: "text-purple-600", label: "Purple", bgValue: "bg-purple-50" },
  { value: "text-violet-600", label: "Violet", bgValue: "bg-violet-50" },
  { value: "text-indigo-600", label: "Indigo", bgValue: "bg-indigo-50" },
  { value: "text-blue-600", label: "Blue", bgValue: "bg-blue-50" },
  { value: "text-cyan-600", label: "Cyan", bgValue: "bg-cyan-50" },
  { value: "text-teal-600", label: "Teal", bgValue: "bg-teal-50" },
  { value: "text-emerald-600", label: "Emerald", bgValue: "bg-emerald-50" },
  { value: "text-green-600", label: "Green", bgValue: "bg-green-50" },
  { value: "text-stone-600", label: "Stone", bgValue: "bg-stone-50" },
  { value: "text-slate-600", label: "Slate", bgValue: "bg-slate-50" },
  { value: "text-gray-600", label: "Gray", bgValue: "bg-gray-50" },
];

// =============================================================================
// BACKWARD COMPATIBILITY - Static config for server components
// These are used by pages that cannot fetch from the API (server components)
// =============================================================================

export const expenseCategories = [
  "lighting",
  "flooring",
  "painting",
  "plumbing",
  "electrical",
  "hvac",
  "carpentry",
  "windows_doors",
  "roofing",
  "landscaping",
  "appliances",
  "furniture",
  "fixtures",
  "labor",
  "permits_fees",
  "other",
] as const;

export type ExpenseCategory = typeof expenseCategories[number];

export interface CategoryConfig {
  label: string;
  icon: LucideIcon;
  color: string;
  bgColor: string;
}

// Static config for server components (fallback when DB not available)
export const categoryConfig: Record<ExpenseCategory, CategoryConfig> = {
  lighting: {
    label: "Lighting",
    icon: Lightbulb,
    color: "text-yellow-600",
    bgColor: "bg-yellow-50",
  },
  flooring: {
    label: "Flooring",
    icon: LayoutGrid,
    color: "text-amber-700",
    bgColor: "bg-amber-50",
  },
  painting: {
    label: "Painting",
    icon: Paintbrush,
    color: "text-pink-600",
    bgColor: "bg-pink-50",
  },
  plumbing: {
    label: "Plumbing",
    icon: Droplets,
    color: "text-blue-600",
    bgColor: "bg-blue-50",
  },
  electrical: {
    label: "Electrical",
    icon: Zap,
    color: "text-orange-600",
    bgColor: "bg-orange-50",
  },
  hvac: {
    label: "HVAC",
    icon: Wind,
    color: "text-cyan-600",
    bgColor: "bg-cyan-50",
  },
  carpentry: {
    label: "Carpentry",
    icon: Hammer,
    color: "text-stone-600",
    bgColor: "bg-stone-50",
  },
  windows_doors: {
    label: "Windows & Doors",
    icon: DoorOpen,
    color: "text-indigo-600",
    bgColor: "bg-indigo-50",
  },
  roofing: {
    label: "Roofing",
    icon: Home,
    color: "text-red-600",
    bgColor: "bg-red-50",
  },
  landscaping: {
    label: "Landscaping",
    icon: Trees,
    color: "text-green-600",
    bgColor: "bg-green-50",
  },
  appliances: {
    label: "Appliances",
    icon: Refrigerator,
    color: "text-slate-600",
    bgColor: "bg-slate-50",
  },
  furniture: {
    label: "Furniture",
    icon: Sofa,
    color: "text-purple-600",
    bgColor: "bg-purple-50",
  },
  fixtures: {
    label: "Fixtures",
    icon: Bath,
    color: "text-teal-600",
    bgColor: "bg-teal-50",
  },
  labor: {
    label: "Labor",
    icon: HardHat,
    color: "text-emerald-600",
    bgColor: "bg-emerald-50",
  },
  permits_fees: {
    label: "Permits & Fees",
    icon: FileText,
    color: "text-violet-600",
    bgColor: "bg-violet-50",
  },
  other: {
    label: "Other",
    icon: MoreHorizontal,
    color: "text-gray-600",
    bgColor: "bg-gray-50",
  },
};

// Static category options for server components
export const categoryOptions = expenseCategories.map((category) => ({
  value: category,
  label: categoryConfig[category].label,
}));

// Legacy helper functions using static config (for server components)
export function getCategoryLabelStatic(category: ExpenseCategory | string | null | undefined): string {
  if (!category) return "Uncategorized";
  return categoryConfig[category as ExpenseCategory]?.label || category;
}

export function getCategoryIconStatic(category: ExpenseCategory | string | null | undefined): LucideIcon {
  if (!category) return MoreHorizontal;
  return categoryConfig[category as ExpenseCategory]?.icon || MoreHorizontal;
}

export function getCategoryColorStatic(category: ExpenseCategory | string | null | undefined): string {
  if (!category) return "text-gray-600";
  return categoryConfig[category as ExpenseCategory]?.color || "text-gray-600";
}

export function getCategoryBgColorStatic(category: ExpenseCategory | string | null | undefined): string {
  if (!category) return "bg-gray-50";
  return categoryConfig[category as ExpenseCategory]?.bgColor || "bg-gray-50";
}
