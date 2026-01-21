"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Plus, Loader2 } from "lucide-react";
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
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "@/lib/i18n/client";

const roomSchema = z.object({
  name: z.string().min(1, "Name is required"),
  nameLt: z.string().optional(),
  description: z.string().optional(),
  descriptionLt: z.string().optional(),
  budget: z.string().optional(),
});

type RoomFormData = z.infer<typeof roomSchema>;

interface AddRoomDialogProps {
  areaId: string;
  areaName: string;
}

export function AddRoomDialog({ areaId, areaName }: AddRoomDialogProps) {
  const router = useRouter();
  const { toast } = useToast();
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<RoomFormData>({
    resolver: zodResolver(roomSchema),
  });

  const onSubmit = async (data: RoomFormData) => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/rooms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          areaId,
          name: data.name,
          nameLt: data.nameLt || null,
          description: data.description,
          descriptionLt: data.descriptionLt || null,
          budget: data.budget ? parseFloat(data.budget) : null,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to create room");
      }

      toast({
        title: t("common.success"),
        description: t("rooms.roomCreated"),
      });

      setOpen(false);
      reset();
      router.refresh();
    } catch (error) {
      toast({
        title: t("common.error"),
        description: t("rooms.roomCreateFailed"),
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          {t("rooms.addRoom")}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <form onSubmit={handleSubmit(onSubmit)}>
          <DialogHeader>
            <DialogTitle>{t("rooms.addNewRoom")}</DialogTitle>
            <DialogDescription>
              {t("rooms.addToArea").replace("{area}", areaName)}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="name">{t("rooms.name")} *</Label>
                <Input
                  id="name"
                  {...register("name")}
                  placeholder={t("rooms.namePlaceholder")}
                />
                {errors.name && (
                  <p className="text-sm text-destructive">{errors.name.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="nameLt">{t("rooms.nameLt")}</Label>
                <Input
                  id="nameLt"
                  {...register("nameLt")}
                  placeholder={t("rooms.nameLtPlaceholder")}
                />
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="description">{t("rooms.description")}</Label>
                <Textarea
                  id="description"
                  {...register("description")}
                  placeholder={t("rooms.descriptionPlaceholder")}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="descriptionLt">{t("rooms.descriptionLt")}</Label>
                <Textarea
                  id="descriptionLt"
                  {...register("descriptionLt")}
                  placeholder={t("rooms.descriptionLtPlaceholder")}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="budget">{t("rooms.budgetEur")}</Label>
              <Input
                id="budget"
                type="number"
                step="0.01"
                min="0"
                {...register("budget")}
                placeholder="0.00"
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
              {t("rooms.createRoom")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
