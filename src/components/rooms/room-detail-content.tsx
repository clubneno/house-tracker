"use client";

import Link from "next/link";
import Image from "next/image";
import { ArrowLeft, DoorOpen, Layers, ImageIcon, ShoppingCart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formatCurrency } from "@/lib/utils";
import { LocalizedDate } from "@/components/ui/localized-date";
import { EditRoomDialog } from "@/components/rooms/edit-room-dialog";
import { DeleteRoomButton } from "@/components/rooms/delete-room-button";
import { RoomGalleryUpload } from "@/components/rooms/room-gallery-upload";
import { useTranslation } from "@/lib/i18n/client";
import type { Attachment } from "@/lib/db/schema";

interface Purchase {
  id: string;
  date: Date;
  totalAmount: number;
  purchaseType: string;
  paymentStatus: string;
  supplierName: string | null;
}

interface RoomDetailContentProps {
  id: string;
  room: {
    id: string;
    name: string;
    nameLt: string | null;
    description: string | null;
    descriptionLt: string | null;
    budget: string | null;
    areaId: string | null;
    areaName: string | null;
    areaNameLt: string | null;
    purchases: Purchase[];
    gallery: Attachment[];
    totalSpending: number;
  };
}

export function RoomDetailContent({ id, room }: RoomDetailContentProps) {
  const { t, locale } = useTranslation();

  const displayName = locale === 'lt' && room.nameLt ? room.nameLt : room.name;
  const displayDescription = locale === 'lt' && room.descriptionLt ? room.descriptionLt : room.description;
  const displayAreaName = locale === 'lt' && room.areaNameLt ? room.areaNameLt : room.areaName;

  const typeLabels: Record<string, string> = {
    service: t("purchaseTypes.service"),
    materials: t("purchaseTypes.materials"),
    products: t("purchaseTypes.products"),
    indirect: t("purchaseTypes.indirect"),
  };

  const statusLabels: Record<string, string> = {
    pending: t("purchases.pending"),
    partial: t("purchases.partial"),
    paid: t("purchases.paid"),
  };

  const statusVariants: Record<string, "default" | "secondary" | "success" | "warning"> = {
    pending: "warning",
    partial: "secondary",
    paid: "success",
  };

  const budget = Number(room.budget || 0);
  const percentage = budget > 0 ? (room.totalSpending / budget) * 100 : 0;
  const isOverBudget = room.totalSpending > budget && budget > 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href={room.areaId ? `/areas/${room.areaId}` : "/rooms"}>
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <DoorOpen className="h-6 w-6 text-muted-foreground" />
            <h1 className="text-3xl font-bold tracking-tight">{displayName}</h1>
          </div>
          <div className="flex items-center gap-2 text-muted-foreground">
            <Layers className="h-4 w-4" />
            <span>{displayAreaName}</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <EditRoomDialog room={room} areaId={room.areaId || ""} />
          <DeleteRoomButton id={id} name={displayName} areaId={room.areaId || ""} />
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">{t("dashboard.totalSpending")}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${isOverBudget ? "text-destructive" : ""}`}>
              {formatCurrency(room.totalSpending)}
            </div>
            {budget > 0 && (
              <p className="text-xs text-muted-foreground">
                {t("common.of")} {formatCurrency(budget)} {t("dashboard.budget").toLowerCase()}
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">{t("purchases.title")}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{room.purchases.length}</div>
            <p className="text-xs text-muted-foreground">
              {room.purchases.length !== 1 ? t("common.purchases") : t("common.purchase")} {t("rooms.forThisRoom") || "for this room"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">{t("dashboard.budgetProgress")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {budget > 0 ? (
              <>
                <Progress
                  value={Math.min(percentage, 100)}
                  className={isOverBudget ? "[&>div]:bg-destructive" : ""}
                />
                <p className={`text-sm ${isOverBudget ? "text-destructive" : "text-muted-foreground"}`}>
                  {percentage.toFixed(1)}% {t("areas.used") || "used"}
                </p>
              </>
            ) : (
              <p className="text-sm text-muted-foreground">{t("areas.noBudgetSet")}</p>
            )}
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="purchases">
        <TabsList>
          <TabsTrigger value="purchases" className="flex items-center gap-2">
            <ShoppingCart className="h-4 w-4" />
            {t("purchases.title")}
          </TabsTrigger>
          <TabsTrigger value="gallery" className="flex items-center gap-2">
            <ImageIcon className="h-4 w-4" />
            {t("homes.gallery")}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="purchases" className="mt-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">{t("purchases.title")}</h2>
            <Button asChild>
              <Link href={`/purchases/new?room=${id}`}>{t("purchases.addPurchase")}</Link>
            </Button>
          </div>

          {room.purchases.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <ShoppingCart className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground mb-4">{t("common.noPurchases")}</p>
                <Button asChild>
                  <Link href={`/purchases/new?room=${id}`}>{t("purchases.addPurchase")}</Link>
                </Button>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="pt-6">
                <div className="space-y-4">
                  {room.purchases.map((purchase) => (
                    <Link
                      key={purchase.id}
                      href={`/purchases/${purchase.id}`}
                      className="flex items-center justify-between p-3 rounded-lg hover:bg-muted/50 transition-colors"
                    >
                      <div className="space-y-1">
                        <div className="font-medium">{purchase.supplierName}</div>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <LocalizedDate date={purchase.date} />
                          <Badge variant="outline">
                            {typeLabels[purchase.purchaseType]}
                          </Badge>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-medium">
                          {formatCurrency(purchase.totalAmount)}
                        </div>
                        <Badge variant={statusVariants[purchase.paymentStatus]}>
                          {statusLabels[purchase.paymentStatus]}
                        </Badge>
                      </div>
                    </Link>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="gallery" className="mt-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">{t("homes.gallery")}</h2>
            <RoomGalleryUpload roomId={id} />
          </div>

          {room.gallery.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <ImageIcon className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground mb-4">{t("homes.noImages")}</p>
                <RoomGalleryUpload roomId={id} />
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
              {room.gallery.map((photo) => (
                <Card key={photo.id} className="overflow-hidden">
                  <div className="relative aspect-square">
                    <Image
                      src={photo.thumbnailUrl || photo.fileUrl}
                      alt={photo.fileName}
                      fill
                      className="object-cover"
                    />
                  </div>
                  <CardContent className="p-2">
                    <p className="text-xs text-muted-foreground truncate">
                      <LocalizedDate date={photo.createdAt} />
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
