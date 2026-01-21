"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Pencil, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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

const houseDocumentTypeKeys = [
  { value: "purchase_agreement", labelKey: "purchaseAgreement" },
  { value: "utility_contract", labelKey: "utilityContract" },
  { value: "insurance", labelKey: "insurance" },
  { value: "building_permit", labelKey: "buildingPermit" },
  { value: "tax_document", labelKey: "taxDocument" },
  { value: "warranty", labelKey: "warranty" },
  { value: "manual", labelKey: "manual" },
  { value: "other", labelKey: "other" },
] as const;

const documentSchema = z.object({
  houseDocumentType: z.string().min(1, "Document type is required"),
  documentTitle: z.string().min(1, "Title is required"),
  documentDescription: z.string().optional().nullable(),
  expiresAt: z.string().optional().nullable(),
});

type DocumentFormData = z.infer<typeof documentSchema>;

interface Document {
  id: string;
  houseDocumentType: string;
  documentTitle: string | null;
  documentDescription: string | null;
  expiresAt: string | null;
}

interface EditDocumentDialogProps {
  document: Document;
}

export function EditDocumentDialog({ document }: EditDocumentDialogProps) {
  const router = useRouter();
  const { toast } = useToast();
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<DocumentFormData>({
    resolver: zodResolver(documentSchema),
    defaultValues: {
      houseDocumentType: document.houseDocumentType,
      documentTitle: document.documentTitle || "",
      documentDescription: document.documentDescription || "",
      expiresAt: document.expiresAt
        ? new Date(document.expiresAt).toISOString().split("T")[0]
        : "",
    },
  });

  const watchDocumentType = watch("houseDocumentType");

  const onSubmit = async (data: DocumentFormData) => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/documents/${document.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          houseDocumentType: data.houseDocumentType,
          documentTitle: data.documentTitle,
          documentDescription: data.documentDescription || null,
          expiresAt: data.expiresAt || null,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to update document");
      }

      toast({
        title: t("common.success"),
        description: t("documents.documentUpdated"),
      });

      setOpen(false);
      router.refresh();
    } catch (error) {
      toast({
        title: t("common.error"),
        description: t("documents.documentUpdateFailed"),
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Pencil className="h-3 w-3" />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <form onSubmit={handleSubmit(onSubmit)}>
          <DialogHeader>
            <DialogTitle>{t("documents.editDocument")}</DialogTitle>
            <DialogDescription>
              {t("documents.editDescription")}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="houseDocumentType">{t("documents.documentType")} *</Label>
              <Select
                value={watchDocumentType}
                onValueChange={(value) => setValue("houseDocumentType", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder={t("documents.selectDocumentType")} />
                </SelectTrigger>
                <SelectContent>
                  {houseDocumentTypeKeys.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {t(`documents.${type.labelKey}`)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.houseDocumentType && (
                <p className="text-sm text-destructive">
                  {errors.houseDocumentType.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="documentTitle">{t("documents.documentTitle")} *</Label>
              <Input
                id="documentTitle"
                {...register("documentTitle")}
                placeholder={t("documents.titlePlaceholder")}
              />
              {errors.documentTitle && (
                <p className="text-sm text-destructive">
                  {errors.documentTitle.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="documentDescription">{t("common.description")}</Label>
              <Textarea
                id="documentDescription"
                {...register("documentDescription")}
                placeholder={t("documents.descriptionPlaceholder")}
                rows={2}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="expiresAt">{t("documents.expiryDate")}</Label>
              <Input
                id="expiresAt"
                type="date"
                {...register("expiresAt")}
              />
              <p className="text-xs text-muted-foreground">
                {t("documents.expiryDescription")}
              </p>
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
              {t("common.saveChanges")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
