"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useFieldArray, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2, Plus, Trash2, Upload, FileText, X } from "lucide-react";
import { useDropzone } from "react-dropzone";
import imageCompression from "browser-image-compression";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { formatCurrency } from "@/lib/utils";
import { getIconByName } from "@/lib/categories";
import { useTranslation } from "@/lib/i18n/client";
import { TagInput } from "@/components/tags/tag-input";
import { useHome } from "@/lib/contexts/home-context";
import type { ExpenseCategoryRecord, Tag } from "@/lib/db/schema";

interface PendingFile {
  file: File;
  preview: string;
  type: "invoice" | "receipt" | "warranty" | "photo" | "other";
}

const lineItemSchema = z.object({
  description: z.string().min(1, "Description is required"),
  brand: z.string().optional(),
  quantity: z.string().min(1),
  unitPrice: z.string().min(1),
  areaId: z.string().optional(),
  roomId: z.string().optional(),
  warrantyMonths: z.string().optional(),
  notes: z.string().optional(),
  tagIds: z.array(z.string()).optional(),
});

const purchaseSchema = z.object({
  date: z.string().min(1, "Date is required"),
  supplierId: z.string().min(1, "Supplier is required"),
  purchaseType: z.enum(["service", "materials", "products", "indirect"]),
  expenseCategory: z.string().optional(),
  paymentStatus: z.enum(["pending", "partial", "paid"]),
  paymentDueDate: z.string().optional(),
  notes: z.string().optional(),
  lineItems: z.array(lineItemSchema).min(1, "At least one line item is required"),
});

type PurchaseFormData = z.infer<typeof purchaseSchema>;

interface PurchaseFormProps {
  suppliers: { id: string; name: string; type: string }[];
  areas: { id: string; name: string; nameLt?: string | null }[];
  rooms: { id: string; name: string; nameLt?: string | null; areaId: string | null }[];
  homes: { id: string; name: string; nameLt?: string | null }[];
  defaultSupplierId?: string;
  defaultRoomId?: string;
  purchase?: any;
}

export function PurchaseForm({
  suppliers,
  areas,
  rooms,
  homes,
  defaultSupplierId,
  defaultRoomId,
  purchase,
}: PurchaseFormProps) {
  const router = useRouter();
  const { toast } = useToast();
  const { t, locale } = useTranslation();
  const { selectedHomeId } = useHome();

  // Helper functions for locale-aware names
  const getAreaName = (area: { name: string; nameLt?: string | null }) =>
    locale === 'lt' && area.nameLt ? area.nameLt : area.name;
  const getRoomName = (room: { name: string; nameLt?: string | null }) =>
    locale === 'lt' && room.nameLt ? room.nameLt : room.name;
  const getHomeName = (home: { name: string; nameLt?: string | null }) =>
    locale === 'lt' && home.nameLt ? home.nameLt : home.name;
  const [isLoading, setIsLoading] = useState(false);
  const [formHomeId, setFormHomeId] = useState<string | null>(
    purchase?.homeId || selectedHomeId || null
  );
  const [categories, setCategories] = useState<ExpenseCategoryRecord[]>([]);
  const [pendingFiles, setPendingFiles] = useState<PendingFile[]>([]);
  const [uploadingFiles, setUploadingFiles] = useState(false);
  const [lineItemAreas, setLineItemAreas] = useState<Record<number, string>>({});
  const [lineItemTags, setLineItemTags] = useState<Record<number, Tag[]>>({});

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

  // File dropzone handler
  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const newFiles: PendingFile[] = [];

    for (const file of acceptedFiles) {
      let processedFile = file;

      // Compress images
      if (file.type.startsWith("image/")) {
        try {
          processedFile = await imageCompression(file, {
            maxSizeMB: 2,
            maxWidthOrHeight: 1920,
            useWebWorker: true,
          });
        } catch (err) {
          console.error("Image compression failed:", err);
        }
      }

      // Determine file type based on filename or default to "other"
      let fileType: PendingFile["type"] = "other";
      const lowerName = file.name.toLowerCase();
      if (lowerName.includes("invoice") || lowerName.includes("faktur")) {
        fileType = "invoice";
      } else if (lowerName.includes("receipt") || lowerName.includes("kvit")) {
        fileType = "receipt";
      } else if (lowerName.includes("warranty") || lowerName.includes("garantija")) {
        fileType = "warranty";
      } else if (file.type.startsWith("image/")) {
        fileType = "photo";
      }

      newFiles.push({
        file: processedFile,
        preview: file.type.startsWith("image/")
          ? URL.createObjectURL(processedFile)
          : "",
        type: fileType,
      });
    }

    setPendingFiles((prev) => [...prev, ...newFiles]);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "image/*": [".jpeg", ".jpg", ".png", ".gif", ".webp"],
      "application/pdf": [".pdf"],
    },
    maxSize: 10 * 1024 * 1024, // 10MB
  });

  const removePendingFile = (index: number) => {
    setPendingFiles((prev) => {
      const newFiles = [...prev];
      if (newFiles[index].preview) {
        URL.revokeObjectURL(newFiles[index].preview);
      }
      newFiles.splice(index, 1);
      return newFiles;
    });
  };

  const updateFileType = (index: number, type: PendingFile["type"]) => {
    setPendingFiles((prev) => {
      const newFiles = [...prev];
      newFiles[index] = { ...newFiles[index], type };
      return newFiles;
    });
  };

  // Upload files to a purchase
  const uploadFilesToPurchase = async (purchaseId: string) => {
    if (pendingFiles.length === 0) return;

    setUploadingFiles(true);
    try {
      for (const pendingFile of pendingFiles) {
        const formData = new FormData();
        formData.append("file", pendingFile.file);
        formData.append("type", pendingFile.type);
        formData.append("purchaseId", purchaseId);

        const response = await fetch("/api/upload", {
          method: "POST",
          body: formData,
        });

        if (!response.ok) {
          console.error("Failed to upload file:", pendingFile.file.name);
        }
      }
    } catch (error) {
      console.error("Error uploading files:", error);
    } finally {
      setUploadingFiles(false);
      // Clean up previews
      pendingFiles.forEach((f) => {
        if (f.preview) URL.revokeObjectURL(f.preview);
      });
    }
  };

  // Find area from default room
  const defaultRoom = rooms.find((r) => r.id === defaultRoomId);

  const {
    register,
    handleSubmit,
    control,
    watch,
    setValue,
    formState: { errors },
  } = useForm<PurchaseFormData>({
    resolver: zodResolver(purchaseSchema),
    defaultValues: {
      date: purchase?.date
        ? new Date(purchase.date).toISOString().split("T")[0]
        : new Date().toISOString().split("T")[0],
      supplierId: purchase?.supplierId || defaultSupplierId || "",
      purchaseType: purchase?.purchaseType || "materials",
      expenseCategory: purchase?.expenseCategory || "",
      paymentStatus: purchase?.paymentStatus || "pending",
      paymentDueDate: purchase?.paymentDueDate
        ? new Date(purchase.paymentDueDate).toISOString().split("T")[0]
        : "",
      notes: purchase?.notes || "",
      lineItems: purchase?.lineItems?.map((item: any) => ({
        description: item.description,
        brand: item.brand || "",
        quantity: item.quantity.toString(),
        unitPrice: item.unitPrice.toString(),
        areaId: item.areaId || "",
        roomId: item.roomId || "",
        warrantyMonths: item.warrantyMonths?.toString() || "",
        notes: item.notes || "",
        tagIds: item.tags?.map((t: any) => t.id) || [],
      })) || [
        {
          description: "",
          brand: "",
          quantity: "1",
          unitPrice: "",
          areaId: defaultRoom?.areaId || "",
          roomId: defaultRoomId || "",
          warrantyMonths: "",
          notes: "",
          tagIds: [],
        },
      ],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "lineItems",
  });

  const watchedLineItems = watch("lineItems");

  // Initialize line item areas from watched values
  useEffect(() => {
    const newAreas: Record<number, string> = {};
    watchedLineItems.forEach((item, index) => {
      newAreas[index] = item.areaId || "";
    });
    setLineItemAreas(newAreas);
  }, [watchedLineItems]);

  const getFilteredRooms = (areaId: string) => {
    if (!areaId) return rooms;
    return rooms.filter((r) => r.areaId === areaId);
  };

  const calculateTotal = () => {
    return watchedLineItems.reduce((sum, item) => {
      const qty = parseFloat(item.quantity) || 0;
      const price = parseFloat(item.unitPrice) || 0;
      return sum + qty * price;
    }, 0);
  };

  const onSubmit = async (data: PurchaseFormData) => {
    setIsLoading(true);
    try {
      const url = purchase ? `/api/purchases/${purchase.id}` : "/api/purchases";
      const method = purchase ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          date: data.date,
          supplierId: data.supplierId,
          homeId: formHomeId || null,
          purchaseType: data.purchaseType,
          expenseCategory: data.expenseCategory || null,
          paymentStatus: data.paymentStatus,
          paymentDueDate: data.paymentDueDate || null,
          notes: data.notes,
          lineItems: data.lineItems.map((item) => ({
            description: item.description,
            brand: item.brand || null,
            quantity: parseFloat(item.quantity),
            unitPrice: parseFloat(item.unitPrice),
            areaId: item.areaId || null,
            roomId: item.roomId || null,
            warrantyMonths: item.warrantyMonths ? parseInt(item.warrantyMonths) : null,
            notes: item.notes || null,
            tagIds: item.tagIds || [],
          })),
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to save purchase");
      }

      const result = await response.json();

      // Upload any pending attachments
      if (pendingFiles.length > 0 && result.id) {
        await uploadFilesToPurchase(result.id);
      }

      toast({
        title: t("common.success"),
        description: purchase
          ? t("purchases.purchaseUpdated")
          : t("purchases.purchaseCreated"),
      });

      router.push("/purchases");
      router.refresh();
    } catch (error) {
      toast({
        title: t("common.error"),
        description: t("purchases.purchaseSaveFailed"),
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>{t("purchases.purchaseDetails")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="purchase-date">{t("purchases.date")} *</Label>
              <Input id="purchase-date" type="date" {...register("date")} />
              {errors.date && (
                <p className="text-sm text-destructive">{errors.date.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="purchase-home">{t("purchases.home")}</Label>
              <Select
                value={formHomeId || "__none__"}
                onValueChange={(value) => setFormHomeId(value === "__none__" ? null : value)}
              >
                <SelectTrigger id="purchase-home">
                  <SelectValue placeholder={t("purchases.selectHome")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">{t("common.none")}</SelectItem>
                  {homes.map((home) => (
                    <SelectItem key={home.id} value={home.id}>
                      {getHomeName(home)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="purchase-supplier">{t("purchases.supplier")} *</Label>
              <Select
                value={watch("supplierId")}
                onValueChange={(value) => setValue("supplierId", value, { shouldValidate: true, shouldDirty: true })}
              >
                <SelectTrigger id="purchase-supplier">
                  <SelectValue placeholder={t("purchases.selectSupplier")} />
                </SelectTrigger>
                <SelectContent>
                  {suppliers.map((supplier) => (
                    <SelectItem key={supplier.id} value={supplier.id}>
                      {supplier.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.supplierId && (
                <p className="text-sm text-destructive">{errors.supplierId.message}</p>
              )}
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="purchase-type">{t("common.type")} *</Label>
              <Select
                value={watch("purchaseType")}
                onValueChange={(value: "service" | "materials" | "products" | "indirect") =>
                  setValue("purchaseType", value, { shouldValidate: true, shouldDirty: true })
                }
              >
                <SelectTrigger id="purchase-type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="materials">{t("purchases.materials")}</SelectItem>
                  <SelectItem value="products">{t("purchases.products")}</SelectItem>
                  <SelectItem value="service">{t("purchases.service")}</SelectItem>
                  <SelectItem value="indirect">{t("purchases.indirectCost")}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="purchase-category">{t("purchases.category")}</Label>
              <Select
                value={watch("expenseCategory") || "__none__"}
                onValueChange={(value) =>
                  setValue("expenseCategory", value === "__none__" ? "" : value, { shouldValidate: true, shouldDirty: true })
                }
              >
                <SelectTrigger id="purchase-category">
                  <SelectValue placeholder={t("purchases.selectCategory")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">{t("common.none")}</SelectItem>
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

            <div className="space-y-2">
              <Label htmlFor="purchase-payment-status">{t("purchases.paymentStatus")} *</Label>
              <Select
                value={watch("paymentStatus")}
                onValueChange={(value: "pending" | "partial" | "paid") =>
                  setValue("paymentStatus", value, { shouldValidate: true, shouldDirty: true })
                }
              >
                <SelectTrigger id="purchase-payment-status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">{t("purchases.pending")}</SelectItem>
                  <SelectItem value="partial">{t("purchases.partial")}</SelectItem>
                  <SelectItem value="paid">{t("purchases.paid")}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="purchase-due-date">{t("purchases.paymentDueDate")}</Label>
            <Input
              id="purchase-due-date"
              type="date"
              {...register("paymentDueDate")}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="purchase-notes">{t("purchases.notes")}</Label>
            <Textarea
              id="purchase-notes"
              {...register("notes")}
              placeholder={t("purchases.additionalNotes")}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>{t("purchases.lineItems")}</CardTitle>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() =>
              append({
                description: "",
                brand: "",
                quantity: "1",
                unitPrice: "",
                areaId: "",
                roomId: "",
                warrantyMonths: "",
                notes: "",
                tagIds: [],
              })
            }
          >
            <Plus className="mr-2 h-4 w-4" />
            {t("purchases.addItem")}
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          {fields.map((field, index) => (
            <div key={field.id} className="space-y-4 p-4 border rounded-lg">
              <div className="flex items-center justify-between">
                <span className="font-medium">{t("purchases.item")} {index + 1}</span>
                {fields.length > 1 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => remove(index)}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                )}
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor={`item-${index}-description`}>{t("purchases.description")} *</Label>
                  <Input
                    id={`item-${index}-description`}
                    {...register(`lineItems.${index}.description`)}
                    placeholder={t("purchases.itemDescription")}
                  />
                  {errors.lineItems?.[index]?.description && (
                    <p className="text-sm text-destructive">
                      {errors.lineItems[index].description?.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor={`item-${index}-brand`}>{t("purchases.brand")}</Label>
                  <Input
                    id={`item-${index}-brand`}
                    {...register(`lineItems.${index}.brand`)}
                    placeholder={t("purchases.brandName")}
                  />
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor={`item-${index}-area`}>{t("purchases.area")}</Label>
                  <Select
                    value={watch(`lineItems.${index}.areaId`) || "__none__"}
                    onValueChange={(value) => {
                      const newValue = value === "__none__" ? "" : value;
                      setValue(`lineItems.${index}.areaId`, newValue, { shouldValidate: true, shouldDirty: true });
                      setValue(`lineItems.${index}.roomId`, "", { shouldValidate: true, shouldDirty: true });
                      setLineItemAreas((prev) => ({ ...prev, [index]: newValue }));
                    }}
                  >
                    <SelectTrigger id={`item-${index}-area`}>
                      <SelectValue placeholder={t("purchases.selectArea")} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__none__">{t("common.none")}</SelectItem>
                      {areas.map((area) => (
                        <SelectItem key={area.id} value={area.id}>
                          {getAreaName(area)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor={`item-${index}-room`}>{t("purchases.room")}</Label>
                  <Select
                    value={watch(`lineItems.${index}.roomId`) || "__none__"}
                    onValueChange={(value) => setValue(`lineItems.${index}.roomId`, value === "__none__" ? "" : value, { shouldValidate: true, shouldDirty: true })}
                  >
                    <SelectTrigger id={`item-${index}-room`}>
                      <SelectValue placeholder={t("purchases.selectRoom")} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__none__">{t("common.none")}</SelectItem>
                      {getFilteredRooms(lineItemAreas[index] || "").map((room) => (
                        <SelectItem key={room.id} value={room.id}>
                          {getRoomName(room)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-3">
                <div className="space-y-2">
                  <Label htmlFor={`item-${index}-quantity`}>{t("purchases.quantity")} *</Label>
                  <Input
                    id={`item-${index}-quantity`}
                    type="number"
                    step="0.001"
                    min="0"
                    {...register(`lineItems.${index}.quantity`)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor={`item-${index}-price`}>{t("purchases.unitPriceEur")} *</Label>
                  <Input
                    id={`item-${index}-price`}
                    type="number"
                    step="0.01"
                    min="0"
                    {...register(`lineItems.${index}.unitPrice`)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor={`item-${index}-warranty`}>{t("purchases.warrantyMonths")}</Label>
                  <Input
                    id={`item-${index}-warranty`}
                    type="number"
                    min="0"
                    {...register(`lineItems.${index}.warrantyMonths`)}
                    placeholder="0"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor={`item-${index}-notes`}>{t("purchases.itemNotes")}</Label>
                <Input
                  id={`item-${index}-notes`}
                  {...register(`lineItems.${index}.notes`)}
                  placeholder={t("purchases.notesForThisItem")}
                />
              </div>

              <div className="space-y-2">
                <Label>{t("tags.tags")}</Label>
                <TagInput
                  selectedTags={lineItemTags[index] || []}
                  onChange={(tags) => {
                    setLineItemTags((prev) => ({ ...prev, [index]: tags }));
                    setValue(`lineItems.${index}.tagIds`, tags.map((t) => t.id), {
                      shouldValidate: true,
                      shouldDirty: true,
                    });
                  }}
                  placeholder={t("tags.selectTags")}
                />
              </div>

              <div className="text-right text-sm text-muted-foreground">
                {t("purchases.subtotal")}:{" "}
                {formatCurrency(
                  (parseFloat(watchedLineItems[index]?.quantity || "0") || 0) *
                    (parseFloat(watchedLineItems[index]?.unitPrice || "0") || 0)
                )}
              </div>
            </div>
          ))}

          {errors.lineItems && !Array.isArray(errors.lineItems) && (
            <p className="text-sm text-destructive">{errors.lineItems.message}</p>
          )}

          <Separator />

          <div className="flex justify-between items-center text-lg font-semibold">
            <span>{t("common.total")}</span>
            <span>{formatCurrency(calculateTotal())}</span>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t("purchases.attachments")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Dropzone */}
          <div
            {...getRootProps()}
            className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
              isDragActive
                ? "border-primary bg-primary/5"
                : "border-muted-foreground/25 hover:border-primary/50"
            }`}
          >
            <input {...getInputProps()} />
            <Upload className="mx-auto h-8 w-8 text-muted-foreground mb-2" />
            {isDragActive ? (
              <p className="text-sm text-muted-foreground">{t("purchases.dropFilesHere")}</p>
            ) : (
              <div>
                <p className="text-sm text-muted-foreground">
                  {t("purchases.dragDropFiles")}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {t("purchases.supportsImagesPdfs")}
                </p>
              </div>
            )}
          </div>

          {/* Pending files list */}
          {pendingFiles.length > 0 && (
            <div className="space-y-2">
              <p className="text-sm font-medium">{t("purchases.filesToUpload")} ({pendingFiles.length})</p>
              <div className="grid gap-2">
                {pendingFiles.map((pf, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-3 p-3 border rounded-lg bg-muted/30"
                  >
                    {/* Preview */}
                    <div className="w-12 h-12 flex-shrink-0 rounded overflow-hidden bg-muted flex items-center justify-center">
                      {pf.preview ? (
                        <img
                          src={pf.preview}
                          alt="Preview"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <FileText className="h-6 w-6 text-muted-foreground" />
                      )}
                    </div>

                    {/* File info */}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{pf.file.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {(pf.file.size / 1024).toFixed(1)} KB
                      </p>
                    </div>

                    {/* Type selector */}
                    <Select
                      value={pf.type}
                      onValueChange={(value: PendingFile["type"]) =>
                        updateFileType(index, value)
                      }
                    >
                      <SelectTrigger id={`attachment-${index}-type`} className="w-28">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="invoice">{t("purchases.invoice")}</SelectItem>
                        <SelectItem value="receipt">{t("purchases.receipt")}</SelectItem>
                        <SelectItem value="warranty">{t("purchases.warranty")}</SelectItem>
                        <SelectItem value="photo">{t("purchases.photo")}</SelectItem>
                        <SelectItem value="other">{t("purchases.other")}</SelectItem>
                      </SelectContent>
                    </Select>

                    {/* Remove button */}
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removePendingFile(index)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>

        <CardFooter className="flex justify-between border-t pt-6">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
            disabled={isLoading || uploadingFiles}
          >
            {t("common.cancel")}
          </Button>
          <Button type="submit" disabled={isLoading || uploadingFiles}>
            {(isLoading || uploadingFiles) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {uploadingFiles
              ? t("purchases.uploadingFiles")
              : purchase
              ? t("purchases.updatePurchase")
              : t("purchases.createPurchase")}
          </Button>
        </CardFooter>
      </Card>
    </form>
  );
}
