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

interface EditRoomDialogProps {
  room: {
    id: string;
    name: string;
    nameLt?: string | null;
    description: string | null;
    descriptionLt?: string | null;
    budget: string | null;
  };
  areaId: string;
}

export function EditRoomDialog({ room, areaId }: EditRoomDialogProps) {
  const router = useRouter();
  const { toast } = useToast();
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RoomFormData>({
    resolver: zodResolver(roomSchema),
    defaultValues: {
      name: room.name,
      nameLt: room.nameLt || "",
      description: room.description || "",
      descriptionLt: room.descriptionLt || "",
      budget: room.budget?.toString() || "",
    },
  });

  const onSubmit = async (data: RoomFormData) => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/rooms/${room.id}`, {
        method: "PUT",
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
        throw new Error("Failed to update room");
      }

      toast({
        title: t("common.success"),
        description: t("rooms.roomUpdated"),
      });

      setOpen(false);
      router.refresh();
    } catch (error) {
      toast({
        title: t("common.error"),
        description: t("rooms.roomUpdateFailed"),
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
            <DialogTitle>{t("rooms.editRoom")}</DialogTitle>
            <DialogDescription>{t("rooms.editDescription")}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="name">{t("rooms.name")} *</Label>
                <Input id="name" {...register("name")} />
                {errors.name && (
                  <p className="text-sm text-destructive">{errors.name.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="nameLt">{t("rooms.nameLt")}</Label>
                <Input id="nameLt" {...register("nameLt")} />
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="description">{t("rooms.description")}</Label>
                <Textarea id="description" {...register("description")} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="descriptionLt">{t("rooms.descriptionLt")}</Label>
                <Textarea id="descriptionLt" {...register("descriptionLt")} />
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
