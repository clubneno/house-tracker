"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useDropzone } from "react-dropzone";
import imageCompression from "browser-image-compression";
import { Plus, Loader2, Upload, File } from "lucide-react";
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
  documentDescription: z.string().optional(),
  expiresAt: z.string().optional(),
});

type DocumentFormData = z.infer<typeof documentSchema>;

export function AddDocumentDialog() {
  const router = useRouter();
  const { toast } = useToast();
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<DocumentFormData>({
    resolver: zodResolver(documentSchema),
  });

  const watchDocumentType = watch("houseDocumentType");

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      const file = acceptedFiles[0];
      setSelectedFile(file);
      // Auto-fill title from filename (without extension)
      const titleWithoutExt = file.name.replace(/\.[^/.]+$/, "");
      setValue("documentTitle", titleWithoutExt);
    }
  }, [setValue]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    maxFiles: 1,
    accept: {
      "application/pdf": [".pdf"],
      "image/*": [".png", ".jpg", ".jpeg", ".gif"],
      "application/msword": [".doc"],
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document": [".docx"],
    },
  });

  const compressImage = async (file: File): Promise<File> => {
    const options = {
      maxSizeMB: 1,
      maxWidthOrHeight: 1920,
      useWebWorker: true,
      fileType: file.type as string,
    };
    return imageCompression(file, options);
  };

  const onSubmit = async (data: DocumentFormData) => {
    if (!selectedFile) {
      toast({
        title: t("common.error"),
        description: t("documents.selectFile"),
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      // Compress images before upload
      let fileToUpload = selectedFile;
      if (selectedFile.type.startsWith("image/")) {
        try {
          fileToUpload = await compressImage(selectedFile);
        } catch (err) {
          console.warn("Image compression failed, using original:", err);
        }
      }

      const formData = new FormData();
      formData.append("file", fileToUpload);
      formData.append("houseDocumentType", data.houseDocumentType);
      formData.append("documentTitle", data.documentTitle);
      if (data.documentDescription) {
        formData.append("documentDescription", data.documentDescription);
      }
      if (data.expiresAt) {
        formData.append("expiresAt", data.expiresAt);
      }

      const response = await fetch("/api/documents", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Failed to upload document");
      }

      toast({
        title: t("common.success"),
        description: t("documents.documentUploaded"),
      });

      setOpen(false);
      reset();
      setSelectedFile(null);
      router.refresh();
    } catch (error) {
      toast({
        title: t("common.error"),
        description: t("documents.documentUploadFailed"),
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen);
    if (!newOpen) {
      reset();
      setSelectedFile(null);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          {t("documents.addDocument")}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <form onSubmit={handleSubmit(onSubmit)}>
          <DialogHeader>
            <DialogTitle>{t("documents.addHouseDocument")}</DialogTitle>
            <DialogDescription>
              {t("documents.uploadDescription")}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div
              {...getRootProps()}
              className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
                isDragActive
                  ? "border-primary bg-primary/5"
                  : "border-muted-foreground/25 hover:border-primary/50"
              }`}
            >
              <input {...getInputProps()} />
              {selectedFile ? (
                <div className="flex items-center justify-center gap-2">
                  <File className="h-8 w-8 text-muted-foreground" />
                  <div className="text-left">
                    <p className="font-medium">{selectedFile.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {(selectedFile.size / 1024).toFixed(1)} KB
                    </p>
                  </div>
                </div>
              ) : (
                <>
                  <Upload className="mx-auto h-8 w-8 text-muted-foreground" />
                  <p className="mt-2 text-sm text-muted-foreground">
                    {isDragActive
                      ? t("documents.dropHere")
                      : t("documents.dragDrop")}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {t("documents.pdfWordImages")}
                  </p>
                </>
              )}
            </div>

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
              onClick={() => handleOpenChange(false)}
              disabled={isLoading}
            >
              {t("common.cancel")}
            </Button>
            <Button type="submit" disabled={isLoading || !selectedFile}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {t("documents.uploadDocument")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
