"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "@/lib/i18n/client";
import type { Supplier } from "@/lib/db/schema";

const supplierSchema = z
  .object({
    type: z.enum(["company", "individual"]),
    companyName: z.string().optional(),
    companyAddress: z.string().optional(),
    firstName: z.string().optional(),
    lastName: z.string().optional(),
    email: z.string().email().optional().or(z.literal("")),
    phone: z.string().optional(),
    notes: z.string().optional(),
    rating: z.number().min(1).max(5).optional().nullable(),
  })
  .refine(
    (data) => {
      if (data.type === "company") {
        return !!data.companyName;
      }
      return !!data.firstName && !!data.lastName;
    },
    {
      message: "Required fields are missing",
    }
  );

type SupplierFormData = z.infer<typeof supplierSchema>;

interface SupplierFormProps {
  supplier?: Supplier;
}

export function SupplierForm({ supplier }: SupplierFormProps) {
  const router = useRouter();
  const { toast } = useToast();
  const { t } = useTranslation();
  const [isLoading, setIsLoading] = useState(false);
  const [rating, setRating] = useState<number | null>(supplier?.rating || null);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<SupplierFormData>({
    resolver: zodResolver(supplierSchema),
    defaultValues: {
      type: supplier?.type || "company",
      companyName: supplier?.companyName || "",
      companyAddress: supplier?.companyAddress || "",
      firstName: supplier?.firstName || "",
      lastName: supplier?.lastName || "",
      email: supplier?.email || "",
      phone: supplier?.phone || "",
      notes: supplier?.notes || "",
      rating: supplier?.rating,
    },
  });

  const supplierType = watch("type");

  const onSubmit = async (data: SupplierFormData) => {
    setIsLoading(true);
    try {
      const url = supplier ? `/api/suppliers/${supplier.id}` : "/api/suppliers";
      const method = supplier ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...data,
          email: data.email || null,
          rating,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || t("suppliers.saveFailed"));
      }

      toast({
        title: t("common.success"),
        description: supplier
          ? t("suppliers.supplierUpdated")
          : t("suppliers.supplierCreated"),
      });

      router.push("/suppliers");
      router.refresh();
    } catch (error) {
      toast({
        title: t("common.error"),
        description: error instanceof Error ? error.message : t("common.error"),
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <Card>
        <CardContent className="pt-6 space-y-6">
          <div className="space-y-2">
            <Label htmlFor="type">{t("suppliers.supplierType")}</Label>
            <Select
              value={supplierType}
              onValueChange={(value: "company" | "individual") =>
                setValue("type", value)
              }
            >
              <SelectTrigger>
                <SelectValue placeholder={t("suppliers.selectType")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="company">{t("suppliers.company")}</SelectItem>
                <SelectItem value="individual">{t("suppliers.individual")}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {supplierType === "company" ? (
            <>
              <div className="space-y-2">
                <Label htmlFor="companyName">{t("suppliers.companyName")} *</Label>
                <Input
                  id="companyName"
                  {...register("companyName")}
                  placeholder={t("suppliers.enterCompanyName")}
                />
                {errors.companyName && (
                  <p className="text-sm text-destructive">
                    {t("suppliers.companyNameRequired")}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="companyAddress">{t("suppliers.address")}</Label>
                <Textarea
                  id="companyAddress"
                  {...register("companyAddress")}
                  placeholder={t("suppliers.enterCompanyAddress")}
                />
              </div>
            </>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="firstName">{t("suppliers.firstName")} *</Label>
                <Input
                  id="firstName"
                  {...register("firstName")}
                  placeholder={t("suppliers.enterFirstName")}
                />
                {errors.firstName && (
                  <p className="text-sm text-destructive">
                    {t("suppliers.firstNameRequired")}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="lastName">{t("suppliers.lastName")} *</Label>
                <Input
                  id="lastName"
                  {...register("lastName")}
                  placeholder={t("suppliers.enterLastName")}
                />
                {errors.lastName && (
                  <p className="text-sm text-destructive">
                    {t("suppliers.lastNameRequired")}
                  </p>
                )}
              </div>
            </div>
          )}

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="email">{t("suppliers.email")}</Label>
              <Input
                id="email"
                type="email"
                {...register("email")}
                placeholder="email@example.com"
              />
              {errors.email && (
                <p className="text-sm text-destructive">
                  {t("suppliers.validEmail")}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">{t("suppliers.phone")}</Label>
              <Input
                id="phone"
                {...register("phone")}
                placeholder="+370 600 00000"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>{t("suppliers.rating")}</Label>
            <div className="flex items-center gap-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(rating === star ? null : star)}
                  className="p-1"
                >
                  <Star
                    className={`h-6 w-6 ${
                      rating && star <= rating
                        ? "fill-yellow-400 text-yellow-400"
                        : "text-muted-foreground"
                    }`}
                  />
                </button>
              ))}
              {rating && (
                <button
                  type="button"
                  onClick={() => setRating(null)}
                  className="ml-2 text-sm text-muted-foreground hover:text-foreground"
                >
                  {t("suppliers.clear")}
                </button>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">{t("suppliers.notes")}</Label>
            <Textarea
              id="notes"
              {...register("notes")}
              placeholder={t("suppliers.addNotes")}
              rows={4}
            />
          </div>
        </CardContent>

        <CardFooter className="flex justify-between border-t pt-6">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
            disabled={isLoading}
          >
            {t("common.cancel")}
          </Button>
          <Button type="submit" disabled={isLoading}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {supplier ? t("suppliers.updateSupplier") : t("suppliers.createSupplier")}
          </Button>
        </CardFooter>
      </Card>
    </form>
  );
}
