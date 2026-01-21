"use client";

import { useState, useEffect } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "@/lib/i18n/client";
import { availableIcons, getIconByName, colorOptions } from "@/lib/categories";
import type { ExpenseCategoryRecord } from "@/lib/db/schema";

interface EditCategoryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  category: ExpenseCategoryRecord;
  onSuccess: () => void;
}

export function EditCategoryDialog({
  open,
  onOpenChange,
  category,
  onSuccess,
}: EditCategoryDialogProps) {
  const { toast } = useToast();
  const { t } = useTranslation();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    label: category.label,
    iconName: category.iconName,
    color: category.color,
    bgColor: category.bgColor,
  });

  useEffect(() => {
    setFormData({
      label: category.label,
      iconName: category.iconName,
      color: category.color,
      bgColor: category.bgColor,
    });
  }, [category]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Generate name from label
      const name = formData.label
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "_")
        .replace(/^_|_$/g, "");

      const response = await fetch(`/api/categories/${category.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          label: formData.label,
          iconName: formData.iconName,
          color: formData.color,
          bgColor: formData.bgColor,
          sortOrder: category.sortOrder,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to update category");
      }

      toast({
        title: t("common.success"),
        description: t("settings.categoryUpdated"),
      });

      onSuccess();
    } catch (error) {
      toast({
        title: t("common.error"),
        description: error instanceof Error ? error.message : t("settings.categoryUpdateFailed"),
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleColorChange = (colorValue: string) => {
    const colorOption = colorOptions.find((c) => c.value === colorValue);
    if (colorOption) {
      setFormData((prev) => ({
        ...prev,
        color: colorOption.value,
        bgColor: colorOption.bgValue,
      }));
    }
  };

  const PreviewIcon = getIconByName(formData.iconName);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{t("settings.editCategory")}</DialogTitle>
          <DialogDescription>
            {t("settings.editCategoryDesc")}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="label">{t("settings.categoryLabel")}</Label>
              <Input
                id="label"
                value={formData.label}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, label: e.target.value }))
                }
                placeholder={t("settings.categoryLabelPlaceholder")}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="icon">{t("settings.categoryIcon")}</Label>
              <Select
                value={formData.iconName}
                onValueChange={(value) =>
                  setFormData((prev) => ({ ...prev, iconName: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder={t("settings.selectIcon")} />
                </SelectTrigger>
                <SelectContent className="max-h-60">
                  {availableIcons.map((iconName) => {
                    const Icon = getIconByName(iconName);
                    return (
                      <SelectItem key={iconName} value={iconName}>
                        <div className="flex items-center gap-2">
                          <Icon className="h-4 w-4" />
                          <span>{iconName}</span>
                        </div>
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="color">{t("settings.categoryColors")}</Label>
              <Select value={formData.color} onValueChange={handleColorChange}>
                <SelectTrigger>
                  <SelectValue placeholder={t("settings.selectColor")} />
                </SelectTrigger>
                <SelectContent>
                  {colorOptions.map((color) => (
                    <SelectItem key={color.value} value={color.value}>
                      <div className="flex items-center gap-2">
                        <div className={`w-4 h-4 rounded ${color.bgValue}`}>
                          <div className={`w-full h-full rounded ${color.value.replace('text-', 'bg-').replace('-600', '-500').replace('-700', '-600')}`} />
                        </div>
                        <span>{color.label}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Preview</Label>
              <div className="flex items-center gap-3 p-3 border rounded-lg">
                <div className={`p-2 rounded-md ${formData.bgColor}`}>
                  <PreviewIcon className={`h-5 w-5 ${formData.color}`} />
                </div>
                <span className="font-medium">
                  {formData.label || t("settings.categoryLabel")}
                </span>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
            >
              {t("common.cancel")}
            </Button>
            <Button type="submit" disabled={isLoading || !formData.label}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {t("common.saveChanges")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
