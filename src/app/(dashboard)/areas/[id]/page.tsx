export const dynamic = 'force-dynamic';

import { notFound } from "next/navigation";
import Link from "next/link";
import { db } from "@/lib/db";
import { areas, rooms, purchases } from "@/lib/db/schema";
import { eq, sum, desc, and } from "drizzle-orm";
import { ArrowLeft, Layers, DoorOpen, Edit, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { formatCurrency, formatDate } from "@/lib/utils";
import { AddRoomDialog } from "@/components/rooms/add-room-dialog";
import { EditAreaDialog } from "@/components/areas/edit-area-dialog";
import { DeleteAreaButton } from "@/components/areas/delete-area-button";

async function getArea(id: string) {
  const [area] = await db
    .select()
    .from(areas)
    .where(eq(areas.id, id))
    .limit(1);

  if (!area) return null;

  // Get rooms with spending
  const areaRooms = await db
    .select({
      room: rooms,
    })
    .from(rooms)
    .where(eq(rooms.areaId, id))
    .orderBy(rooms.name);

  // Get spending per room
  const roomSpending = await db
    .select({
      roomId: purchases.roomId,
      total: sum(purchases.totalAmount),
    })
    .from(purchases)
    .where(and(eq(purchases.areaId, id), eq(purchases.isDeleted, false)))
    .groupBy(purchases.roomId);

  const spendingMap = new Map(
    roomSpending.map((s) => [s.roomId, Number(s.total || 0)])
  );

  // Get total spending
  const [totalSpending] = await db
    .select({ total: sum(purchases.totalAmount) })
    .from(purchases)
    .where(and(eq(purchases.areaId, id), eq(purchases.isDeleted, false)));

  return {
    ...area,
    rooms: areaRooms.map((r) => ({
      ...r.room,
      totalSpending: spendingMap.get(r.room.id) || 0,
    })),
    totalSpending: Number(totalSpending?.total || 0),
  };
}

export default async function AreaDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const area = await getArea(id);

  if (!area) {
    notFound();
  }

  const budget = Number(area.budget || 0);
  const percentage = budget > 0 ? (area.totalSpending / budget) * 100 : 0;
  const isOverBudget = area.totalSpending > budget && budget > 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/areas">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <Layers className="h-6 w-6 text-primary" />
            <h1 className="text-3xl font-bold tracking-tight">{area.name}</h1>
          </div>
          {area.description && (
            <p className="text-muted-foreground">{area.description}</p>
          )}
        </div>
        <div className="flex items-center gap-2">
          <EditAreaDialog area={area} />
          <DeleteAreaButton id={id} name={area.name} hasRooms={area.rooms.length > 0} />
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Total Spending</CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${isOverBudget ? "text-destructive" : ""}`}>
              {formatCurrency(area.totalSpending)}
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
            <CardTitle className="text-sm font-medium">Rooms</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{area.rooms.length}</div>
            <p className="text-xs text-muted-foreground">
              room{area.rooms.length !== 1 ? "s" : ""} in this area
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

      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Rooms</h2>
        <AddRoomDialog areaId={id} areaName={area.name} />
      </div>

      {area.rooms.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <DoorOpen className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground mb-4">No rooms in this area yet</p>
            <AddRoomDialog areaId={id} areaName={area.name} />
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {area.rooms.map((room) => {
            const roomBudget = Number(room.budget || 0);
            const roomPercentage =
              roomBudget > 0 ? (room.totalSpending / roomBudget) * 100 : 0;
            const roomOverBudget = room.totalSpending > roomBudget && roomBudget > 0;

            return (
              <Link key={room.id} href={`/rooms/${room.id}`}>
                <Card className="hover:bg-muted/50 transition-colors cursor-pointer h-full">
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <DoorOpen className="h-5 w-5 text-muted-foreground" />
                      {room.name}
                    </CardTitle>
                    {room.description && (
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {room.description}
                      </p>
                    )}
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Spending</span>
                      <span className={roomOverBudget ? "text-destructive" : ""}>
                        {formatCurrency(room.totalSpending)}
                        {roomBudget > 0 && ` / ${formatCurrency(roomBudget)}`}
                      </span>
                    </div>
                    {roomBudget > 0 && (
                      <Progress
                        value={Math.min(roomPercentage, 100)}
                        className={roomOverBudget ? "[&>div]:bg-destructive" : ""}
                      />
                    )}
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
