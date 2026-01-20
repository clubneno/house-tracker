import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { db } from "@/lib/db";
import { rooms, areas, purchases, attachments, suppliers } from "@/lib/db/schema";
import { eq, sum, desc, and } from "drizzle-orm";
import { ArrowLeft, DoorOpen, Layers, ImageIcon, ShoppingCart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formatCurrency, formatDate } from "@/lib/utils";
import { EditRoomDialog } from "@/components/rooms/edit-room-dialog";
import { DeleteRoomButton } from "@/components/rooms/delete-room-button";
import { RoomGalleryUpload } from "@/components/rooms/room-gallery-upload";

const typeLabels: Record<string, string> = {
  service: "Service",
  materials: "Materials",
  products: "Products",
  indirect: "Indirect",
};

const statusVariants: Record<string, "default" | "secondary" | "success" | "warning"> = {
  pending: "warning",
  partial: "secondary",
  paid: "success",
};

async function getRoom(id: string) {
  const [result] = await db
    .select({
      room: rooms,
      areaId: areas.id,
      areaName: areas.name,
    })
    .from(rooms)
    .leftJoin(areas, eq(rooms.areaId, areas.id))
    .where(eq(rooms.id, id))
    .limit(1);

  if (!result) return null;

  // Get purchases
  const roomPurchases = await db
    .select({
      id: purchases.id,
      date: purchases.date,
      totalAmount: purchases.totalAmount,
      purchaseType: purchases.purchaseType,
      paymentStatus: purchases.paymentStatus,
      supplierName: suppliers.companyName,
      supplierFirstName: suppliers.firstName,
      supplierLastName: suppliers.lastName,
      supplierType: suppliers.type,
    })
    .from(purchases)
    .leftJoin(suppliers, eq(purchases.supplierId, suppliers.id))
    .where(and(eq(purchases.roomId, id), eq(purchases.isDeleted, false)))
    .orderBy(desc(purchases.date));

  // Get gallery
  const gallery = await db
    .select()
    .from(attachments)
    .where(eq(attachments.roomId, id))
    .orderBy(desc(attachments.createdAt));

  // Get total spending
  const [totalSpending] = await db
    .select({ total: sum(purchases.totalAmount) })
    .from(purchases)
    .where(and(eq(purchases.roomId, id), eq(purchases.isDeleted, false)));

  return {
    ...result.room,
    areaId: result.areaId,
    areaName: result.areaName,
    purchases: roomPurchases.map((p) => ({
      ...p,
      totalAmount: Number(p.totalAmount),
      supplierName:
        p.supplierType === "company"
          ? p.supplierName
          : `${p.supplierFirstName} ${p.supplierLastName}`,
    })),
    gallery,
    totalSpending: Number(totalSpending?.total || 0),
  };
}

export default async function RoomDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const room = await getRoom(id);

  if (!room) {
    notFound();
  }

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
            <h1 className="text-3xl font-bold tracking-tight">{room.name}</h1>
          </div>
          <div className="flex items-center gap-2 text-muted-foreground">
            <Layers className="h-4 w-4" />
            <span>{room.areaName}</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <EditRoomDialog room={room} areaId={room.areaId || ""} />
          <DeleteRoomButton id={id} name={room.name} areaId={room.areaId || ""} />
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Total Spending</CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${isOverBudget ? "text-destructive" : ""}`}>
              {formatCurrency(room.totalSpending)}
            </div>
            {budget > 0 && (
              <p className="text-xs text-muted-foreground">
                of {formatCurrency(budget)} budget
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Purchases</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{room.purchases.length}</div>
            <p className="text-xs text-muted-foreground">
              purchase{room.purchases.length !== 1 ? "s" : ""} for this room
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Budget Usage</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {budget > 0 ? (
              <>
                <Progress
                  value={Math.min(percentage, 100)}
                  className={isOverBudget ? "[&>div]:bg-destructive" : ""}
                />
                <p className={`text-sm ${isOverBudget ? "text-destructive" : "text-muted-foreground"}`}>
                  {percentage.toFixed(1)}% used
                </p>
              </>
            ) : (
              <p className="text-sm text-muted-foreground">No budget set</p>
            )}
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="purchases">
        <TabsList>
          <TabsTrigger value="purchases" className="flex items-center gap-2">
            <ShoppingCart className="h-4 w-4" />
            Purchases
          </TabsTrigger>
          <TabsTrigger value="gallery" className="flex items-center gap-2">
            <ImageIcon className="h-4 w-4" />
            Gallery
          </TabsTrigger>
        </TabsList>

        <TabsContent value="purchases" className="mt-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">Purchases</h2>
            <Button asChild>
              <Link href={`/purchases/new?room=${id}`}>Add Purchase</Link>
            </Button>
          </div>

          {room.purchases.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <ShoppingCart className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground mb-4">No purchases yet</p>
                <Button asChild>
                  <Link href={`/purchases/new?room=${id}`}>Add Purchase</Link>
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
                          <span>{formatDate(purchase.date)}</span>
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
                          {purchase.paymentStatus}
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
            <h2 className="text-xl font-semibold">Gallery</h2>
            <RoomGalleryUpload roomId={id} />
          </div>

          {room.gallery.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <ImageIcon className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground mb-4">No photos yet</p>
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
                      {formatDate(photo.createdAt)}
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
