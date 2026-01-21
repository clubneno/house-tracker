"use client";

import { useState, useEffect } from "react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "@/lib/i18n/client";

const roomSchema = z.object({
  areaId: z.string().min(1, "Area is required"),
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
  budget: z.string().optional(),
});

type RoomFormData = z.infer<typeof roomSchema>;

interface Area {
  id: string;
  name: string;
}

export function AddRoomWithAreaDialog() {
  const router = useRouter();
  const { toast } = useToast();
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [areas, setAreas] = useState<Area[]>([]);
  const [areasLoading, setAreasLoading] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<RoomFormData>({
    resolver: zodResolver(roomSchema),
    defaultValues: {
      areaId: "",
      name: "",
      description: "",
      budget: "",
    },
  });

  const selectedAreaId = watch("areaId");

  useEffect(() => {
    if (open) {
      setAreasLoading(true);
      fetch("/api/areas")
        .then((res) => res.json())
        .then((data) => {
          setAreas(data);
        })
        .catch((err) => {
          console.error("Failed to fetch areas:", err);
          toast({
            title: t("common.error"),
            description: t("rooms.roomCreateFailed"),
            variant: "destructive",
          });
        })
        .finally(() => {
          setAreasLoading(false);
        });
    }
  }, [open, toast, t]);

  const onSubmit = async (data: RoomFormData) => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/rooms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          areaId: data.areaId,
          name: data.name,
          description: data.description,
          budget: data.budget ? parseFloat(data.budget) : null,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to create room");
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
      <DialogContent>
        <form onSubmit={handleSubmit(onSubmit)}>
          <DialogHeader>
            <DialogTitle>{t("rooms.addNewRoom")}</DialogTitle>
            <DialogDescription>
              {t("rooms.createDescription")}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="areaId">{t("rooms.area")} *</Label>
              {areasLoading ? (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  {t("rooms.loadingAreas")}
                </div>
              ) : areas.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  {t("rooms.noAreasAvailable")}
                </p>
              ) : (
                <Select
                  value={selectedAreaId}
                  onValueChange={(value) => setValue("areaId", value, { shouldValidate: true })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={t("rooms.selectArea")} />
                  </SelectTrigger>
                  <SelectContent>
                    {areas.map((area) => (
                      <SelectItem key={area.id} value={area.id}>
                        {area.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
              {errors.areaId && (
                <p className="text-sm text-destructive">{t("rooms.areaRequired")}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="name">{t("rooms.name")} *</Label>
              <Input
                id="name"
                {...register("name")}
                placeholder={t("rooms.namePlaceholder")}
              />
              {errors.name && (
                <p className="text-sm text-destructive">{t("rooms.nameRequired")}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">{t("rooms.description")}</Label>
              <Textarea
                id="description"
                {...register("description")}
                placeholder={t("rooms.descriptionPlaceholder")}
              />
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
            <Button type="submit" disabled={isLoading || areas.length === 0}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {t("rooms.createRoom")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
