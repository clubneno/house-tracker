import Link from "next/link";
import { db } from "@/lib/db";
import { rooms, areas, purchases } from "@/lib/db/schema";
import { desc, sum, eq, and } from "drizzle-orm";
import { DoorOpen, Layers } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/utils";

async function getRooms() {
  const result = await db
    .select({
      room: rooms,
      areaName: areas.name,
    })
    .from(rooms)
    .leftJoin(areas, eq(rooms.areaId, areas.id))
    .orderBy(areas.name, rooms.name);

  // Get spending per room
  const spending = await db
    .select({
      roomId: purchases.roomId,
      total: sum(purchases.totalAmount),
    })
    .from(purchases)
    .where(eq(purchases.isDeleted, false))
    .groupBy(purchases.roomId);

  const spendingMap = new Map(
    spending.map((s) => [s.roomId, Number(s.total || 0)])
  );

  return result.map((r) => ({
    ...r.room,
    areaName: r.areaName,
    totalSpending: spendingMap.get(r.room.id) || 0,
  }));
}

export default async function RoomsPage() {
  const roomList = await getRooms();

  // Group rooms by area
  const groupedRooms = roomList.reduce(
    (acc, room) => {
      const areaName = room.areaName || "Uncategorized";
      if (!acc[areaName]) {
        acc[areaName] = [];
      }
      acc[areaName].push(room);
      return acc;
    },
    {} as Record<string, typeof roomList>
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Rooms</h1>
        <p className="text-muted-foreground">
          All rooms across your house
        </p>
      </div>

      {roomList.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <DoorOpen className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground mb-4">No rooms yet</p>
            <p className="text-sm text-muted-foreground">
              Create an area first, then add rooms to it
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-8">
          {Object.entries(groupedRooms).map(([areaName, areaRooms]) => (
            <div key={areaName} className="space-y-4">
              <div className="flex items-center gap-2">
                <Layers className="h-5 w-5 text-muted-foreground" />
                <h2 className="text-xl font-semibold">{areaName}</h2>
                <Badge variant="secondary">{areaRooms.length}</Badge>
              </div>

              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {areaRooms.map((room) => {
                  const budget = Number(room.budget || 0);
                  const percentage =
                    budget > 0 ? (room.totalSpending / budget) * 100 : 0;
                  const isOverBudget = room.totalSpending > budget && budget > 0;

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
                            <span
                              className={isOverBudget ? "text-destructive" : ""}
                            >
                              {formatCurrency(room.totalSpending)}
                              {budget > 0 && ` / ${formatCurrency(budget)}`}
                            </span>
                          </div>
                          {budget > 0 && (
                            <Progress
                              value={Math.min(percentage, 100)}
                              className={
                                isOverBudget ? "[&>div]:bg-destructive" : ""
                              }
                            />
                          )}
                        </CardContent>
                      </Card>
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
