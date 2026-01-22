"use client";

import Link from "next/link";
import { ArrowLeft, Layers, DoorOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { formatCurrency } from "@/lib/utils";
import { AddRoomDialog } from "@/components/rooms/add-room-dialog";
import { EditAreaDialog } from "@/components/areas/edit-area-dialog";
import { DeleteAreaButton } from "@/components/areas/delete-area-button";
import { AreaExpensesByCategory } from "@/components/areas/area-expenses-by-category";
import { useTranslation } from "@/lib/i18n/client";
import type { ExpenseCategory } from "@/lib/categories";

interface RoomData {
  id: string;
  name: string;
  nameLt: string | null;
  description: string | null;
  descriptionLt: string | null;
  budget: string | number | null;
  totalSpending: number;
}

interface AreaDetailContentProps {
  id: string;
  area: {
    id: string;
    name: string;
    nameLt: string | null;
    description: string | null;
    descriptionLt: string | null;
    budget: string | null;
    homeId: string | null;
    createdAt: Date;
    updatedAt: Date;
    rooms: RoomData[];
    totalSpending: number;
    categoryExpenses: {
      category: ExpenseCategory | null;
      total: number;
      count: number;
    }[];
  };
}

export function AreaDetailContent({ id, area }: AreaDetailContentProps) {
  const { t, locale } = useTranslation();

  const displayName = locale === 'lt' && area.nameLt ? area.nameLt : area.name;
  const displayDescription = locale === 'lt' && area.descriptionLt ? area.descriptionLt : area.description;

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
            <h1 className="text-3xl font-bold tracking-tight">{displayName}</h1>
          </div>
          {displayDescription && (
            <p className="text-muted-foreground">{displayDescription}</p>
          )}
        </div>
        <div className="flex items-center gap-2">
          <EditAreaDialog area={area} />
          <DeleteAreaButton id={id} name={displayName} hasRooms={area.rooms.length > 0} />
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">{t("dashboard.totalSpending")}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${isOverBudget ? "text-destructive" : ""}`}>
              {formatCurrency(area.totalSpending)}
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
            <CardTitle className="text-sm font-medium">{t("rooms.title")}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{area.rooms.length}</div>
            <p className="text-xs text-muted-foreground">
              {area.rooms.length !== 1 ? t("common.rooms") : t("common.room")} {t("areas.inThisArea") || "in this area"}
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

      {area.categoryExpenses.length > 0 && (
        <AreaExpensesByCategory
          expenses={area.categoryExpenses}
          totalSpending={area.totalSpending}
        />
      )}

      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">{t("rooms.title")}</h2>
        <AddRoomDialog areaId={id} areaName={displayName} />
      </div>

      {area.rooms.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <DoorOpen className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground mb-4">{t("areas.noRoomsInArea")}</p>
            <AddRoomDialog areaId={id} areaName={displayName} />
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {area.rooms.map((room) => {
            const roomDisplayName = locale === 'lt' && room.nameLt ? room.nameLt : room.name;
            const roomDisplayDescription = locale === 'lt' && room.descriptionLt ? room.descriptionLt : room.description;
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
                      {roomDisplayName}
                    </CardTitle>
                    {roomDisplayDescription && (
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {roomDisplayDescription}
                      </p>
                    )}
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>{t("areas.spending")}</span>
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
