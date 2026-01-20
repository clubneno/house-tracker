export const dynamic = 'force-dynamic';

import Link from "next/link";
import { db } from "@/lib/db";
import { areas, rooms, purchases } from "@/lib/db/schema";
import { desc, sum, count, eq, and } from "drizzle-orm";
import { Plus, Layers, DoorOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { formatCurrency } from "@/lib/utils";
import { AddAreaDialog } from "@/components/areas/add-area-dialog";

async function getAreas() {
  const result = await db
    .select({
      area: areas,
      roomCount: count(rooms.id),
    })
    .from(areas)
    .leftJoin(rooms, eq(rooms.areaId, areas.id))
    .groupBy(areas.id)
    .orderBy(desc(areas.createdAt));

  // Get spending per area
  const spending = await db
    .select({
      areaId: purchases.areaId,
      total: sum(purchases.totalAmount),
    })
    .from(purchases)
    .where(eq(purchases.isDeleted, false))
    .groupBy(purchases.areaId);

  const spendingMap = new Map(
    spending.map((s) => [s.areaId, Number(s.total || 0)])
  );

  return result.map((r) => ({
    ...r.area,
    roomCount: Number(r.roomCount || 0),
    totalSpending: spendingMap.get(r.area.id) || 0,
  }));
}

export default async function AreasPage() {
  const areaList = await getAreas();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Areas</h1>
          <p className="text-muted-foreground">
            Manage your house areas and zones
          </p>
        </div>
        <AddAreaDialog />
      </div>

      {areaList.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Layers className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground mb-4">No areas yet</p>
            <AddAreaDialog />
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {areaList.map((area) => {
            const budget = Number(area.budget || 0);
            const percentage = budget > 0 ? (area.totalSpending / budget) * 100 : 0;
            const isOverBudget = area.totalSpending > budget && budget > 0;

            return (
              <Link key={area.id} href={`/areas/${area.id}`}>
                <Card className="hover:bg-muted/50 transition-colors cursor-pointer h-full">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg flex items-center gap-2">
                        <Layers className="h-5 w-5 text-primary" />
                        {area.name}
                      </CardTitle>
                    </div>
                    {area.description && (
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {area.description}
                      </p>
                    )}
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <DoorOpen className="h-4 w-4" />
                      <span>
                        {area.roomCount} room{area.roomCount !== 1 ? "s" : ""}
                      </span>
                    </div>

                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Spending</span>
                        <span className={isOverBudget ? "text-destructive" : ""}>
                          {formatCurrency(area.totalSpending)}
                          {budget > 0 && ` / ${formatCurrency(budget)}`}
                        </span>
                      </div>
                      {budget > 0 && (
                        <Progress
                          value={Math.min(percentage, 100)}
                          className={isOverBudget ? "[&>div]:bg-destructive" : ""}
                        />
                      )}
                    </div>
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
