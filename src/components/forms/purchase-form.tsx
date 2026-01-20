"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useFieldArray, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2, Plus, Trash2, Upload } from "lucide-react";
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

const lineItemSchema = z.object({
  description: z.string().min(1, "Description is required"),
  brand: z.string().optional(),
  quantity: z.string().min(1),
  unitPrice: z.string().min(1),
  warrantyMonths: z.string().optional(),
  notes: z.string().optional(),
});

const purchaseSchema = z.object({
  date: z.string().min(1, "Date is required"),
  supplierId: z.string().min(1, "Supplier is required"),
  purchaseType: z.enum(["service", "materials", "products", "indirect"]),
  areaId: z.string().optional(),
  roomId: z.string().optional(),
  paymentStatus: z.enum(["pending", "partial", "paid"]),
  paymentDueDate: z.string().optional(),
  notes: z.string().optional(),
  lineItems: z.array(lineItemSchema).min(1, "At least one line item is required"),
});

type PurchaseFormData = z.infer<typeof purchaseSchema>;

interface PurchaseFormProps {
  suppliers: { id: string; name: string; type: string }[];
  areas: { id: string; name: string }[];
  rooms: { id: string; name: string; areaId: string }[];
  defaultSupplierId?: string;
  defaultRoomId?: string;
  purchase?: any;
}

export function PurchaseForm({
  suppliers,
  areas,
  rooms,
  defaultSupplierId,
  defaultRoomId,
  purchase,
}: PurchaseFormProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [selectedAreaId, setSelectedAreaId] = useState<string>(
    purchase?.areaId || ""
  );

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
      areaId: purchase?.areaId || defaultRoom?.areaId || "",
      roomId: purchase?.roomId || defaultRoomId || "",
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
        warrantyMonths: item.warrantyMonths?.toString() || "",
        notes: item.notes || "",
      })) || [
        {
          description: "",
          brand: "",
          quantity: "1",
          unitPrice: "",
          warrantyMonths: "",
          notes: "",
        },
      ],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "lineItems",
  });

  const watchedAreaId = watch("areaId");
  const watchedLineItems = watch("lineItems");

  useEffect(() => {
    setSelectedAreaId(watchedAreaId || "");
  }, [watchedAreaId]);

  const filteredRooms = selectedAreaId
    ? rooms.filter((r) => r.areaId === selectedAreaId)
    : rooms;

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
          purchaseType: data.purchaseType,
          areaId: data.areaId || null,
          roomId: data.roomId || null,
          paymentStatus: data.paymentStatus,
          paymentDueDate: data.paymentDueDate || null,
          notes: data.notes,
          lineItems: data.lineItems.map((item) => ({
            description: item.description,
            brand: item.brand || null,
            quantity: parseFloat(item.quantity),
            unitPrice: parseFloat(item.unitPrice),
            warrantyMonths: item.warrantyMonths ? parseInt(item.warrantyMonths) : null,
            notes: item.notes || null,
          })),
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to save purchase");
      }

      toast({
        title: "Success",
        description: purchase
          ? "Purchase updated successfully"
          : "Purchase created successfully",
      });

      router.push("/purchases");
      router.refresh();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save purchase",
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
          <CardTitle>Purchase Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="date">Date *</Label>
              <Input id="date" type="date" {...register("date")} />
              {errors.date && (
                <p className="text-sm text-destructive">{errors.date.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="supplierId">Supplier *</Label>
              <Select
                value={watch("supplierId")}
                onValueChange={(value) => setValue("supplierId", value, { shouldValidate: true, shouldDirty: true })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select supplier" />
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

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="purchaseType">Type *</Label>
              <Select
                value={watch("purchaseType")}
                onValueChange={(value: "service" | "materials" | "products" | "indirect") =>
                  setValue("purchaseType", value, { shouldValidate: true, shouldDirty: true })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="materials">Materials</SelectItem>
                  <SelectItem value="products">Products</SelectItem>
                  <SelectItem value="service">Service</SelectItem>
                  <SelectItem value="indirect">Indirect Cost</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="paymentStatus">Payment Status *</Label>
              <Select
                value={watch("paymentStatus")}
                onValueChange={(value: "pending" | "partial" | "paid") =>
                  setValue("paymentStatus", value, { shouldValidate: true, shouldDirty: true })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="partial">Partial</SelectItem>
                  <SelectItem value="paid">Paid</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="areaId">Area</Label>
              <Select
                value={watch("areaId") || ""}
                onValueChange={(value) => {
                  setValue("areaId", value, { shouldValidate: true, shouldDirty: true });
                  setValue("roomId", "", { shouldValidate: true, shouldDirty: true }); // Reset room when area changes
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select area (optional)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">None</SelectItem>
                  {areas.map((area) => (
                    <SelectItem key={area.id} value={area.id}>
                      {area.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="roomId">Room</Label>
              <Select
                value={watch("roomId") || ""}
                onValueChange={(value) => setValue("roomId", value, { shouldValidate: true, shouldDirty: true })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select room (optional)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">None</SelectItem>
                  {filteredRooms.map((room) => (
                    <SelectItem key={room.id} value={room.id}>
                      {room.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="paymentDueDate">Payment Due Date</Label>
            <Input
              id="paymentDueDate"
              type="date"
              {...register("paymentDueDate")}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              {...register("notes")}
              placeholder="Additional notes..."
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Line Items</CardTitle>
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
                warrantyMonths: "",
                notes: "",
              })
            }
          >
            <Plus className="mr-2 h-4 w-4" />
            Add Item
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          {fields.map((field, index) => (
            <div key={field.id} className="space-y-4 p-4 border rounded-lg">
              <div className="flex items-center justify-between">
                <span className="font-medium">Item {index + 1}</span>
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
                  <Label>Description *</Label>
                  <Input
                    {...register(`lineItems.${index}.description`)}
                    placeholder="Item description"
                  />
                  {errors.lineItems?.[index]?.description && (
                    <p className="text-sm text-destructive">
                      {errors.lineItems[index].description?.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label>Brand</Label>
                  <Input
                    {...register(`lineItems.${index}.brand`)}
                    placeholder="Brand name"
                  />
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-3">
                <div className="space-y-2">
                  <Label>Quantity *</Label>
                  <Input
                    type="number"
                    step="0.001"
                    min="0"
                    {...register(`lineItems.${index}.quantity`)}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Unit Price (EUR) *</Label>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    {...register(`lineItems.${index}.unitPrice`)}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Warranty (months)</Label>
                  <Input
                    type="number"
                    min="0"
                    {...register(`lineItems.${index}.warrantyMonths`)}
                    placeholder="0"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Item Notes</Label>
                <Input
                  {...register(`lineItems.${index}.notes`)}
                  placeholder="Notes for this item"
                />
              </div>

              <div className="text-right text-sm text-muted-foreground">
                Subtotal:{" "}
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
            <span>Total</span>
            <span>{formatCurrency(calculateTotal())}</span>
          </div>
        </CardContent>

        <CardFooter className="flex justify-between border-t pt-6">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={isLoading}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {purchase ? "Update Purchase" : "Create Purchase"}
          </Button>
        </CardFooter>
      </Card>
    </form>
  );
}
