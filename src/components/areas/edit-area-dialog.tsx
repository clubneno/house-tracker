"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Edit, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
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
import { useHome } from "@/lib/contexts/home-context";
import type { Area } from "@/lib/db/schema";

const areaSchema = z.object({
  name: z.string().min(1, "Name is required"),
  nameLt: z.string().optional(),
  description: z.string().optional(),
  descriptionLt: z.string().optional(),
  budget: z.string().optional(),
  homeId: z.string().optional(),
});

type AreaFormData = z.infer<typeof areaSchema>;

interface EditAreaDialogProps {
  area: Area;
}

export function EditAreaDialog({ area }: EditAreaDialogProps) {
  const router = useRouter();
  const { toast } = useToast();
  const { t } = useTranslation();
  const { homes } = useHome();
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<AreaFormData>({
    resolver: zodResolver(areaSchema),
    defaultValues: {
      name: area.name,
      nameLt: area.nameLt || "",
      description: area.description || "",
      descriptionLt: area.descriptionLt || "",
      budget: area.budget?.toString() || "",
      homeId: area.homeId || undefined,
    },
  });

  const selectedHomeId = watch("homeId");

  const onSubmit = async (data: AreaFormData) => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/areas/${area.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: data.name,
          nameLt: data.nameLt || null,
          description: data.description,
          descriptionLt: data.descriptionLt || null,
          budget: data.budget ? parseFloat(data.budget) : null,
          homeId: data.homeId || null,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to update area");
      }

      toast({
        title: t("common.success"),
        description: t("areas.areaUpdated"),
      });

      setOpen(false);
      router.refresh();
    } catch (error) {
      toast({
        title: t("common.error"),
        description: t("areas.areaUpdateFailed"),
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <Edit className="mr-2 h-4 w-4" />
          {t("common.edit")}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <form onSubmit={handleSubmit(onSubmit)}>
          <DialogHeader>
            <DialogTitle>{t("areas.editArea")}</DialogTitle>
            <DialogDescription>
              {t("areas.editDescription")}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {homes.length > 0 && (
              <div className="space-y-2">
                <Label htmlFor="homeId">{t("areas.home")}</Label>
                <Select
                  value={selectedHomeId || ""}
                  onValueChange={(value) => setValue("homeId", value || undefined)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={t("areas.selectHome")} />
                  </SelectTrigger>
                  <SelectContent>
                    {homes.map((home) => (
                      <SelectItem key={home.id} value={home.id}>
                        {home.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="name">{t("areas.name")} *</Label>
                <Input id="name" {...register("name")} />
                {errors.name && (
                  <p className="text-sm text-destructive">{errors.name.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="nameLt">{t("areas.nameLt")}</Label>
                <Input id="nameLt" {...register("nameLt")} />
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="description">{t("areas.description")}</Label>
                <Textarea id="description" {...register("description")} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="descriptionLt">{t("areas.descriptionLt")}</Label>
                <Textarea id="descriptionLt" {...register("descriptionLt")} />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="budget">{t("areas.budgetEur")}</Label>
              <Input
                id="budget"
                type="number"
                step="0.01"
                min="0"
                {...register("budget")}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={isLoading}
            >
              {t("common.cancel")}
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {t("common.save")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
