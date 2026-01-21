"use client";

import { Layers } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { RoomCard } from "./room-card";

interface Room {
  id: string;
  name: string;
  description: string | null;
  budget: string | number | null;
  totalSpending: number;
  areaName: string | null;
}

interface RoomsAreaGroupProps {
  areaName: string;
  rooms: Room[];
}

export function RoomsAreaGroup({ areaName, rooms }: RoomsAreaGroupProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Layers className="h-5 w-5 text-muted-foreground" />
        <h2 className="text-xl font-semibold">{areaName}</h2>
        <Badge variant="secondary">{rooms.length}</Badge>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {rooms.map((room) => (
          <RoomCard key={room.id} room={room} />
        ))}
      </div>
    </div>
  );
}
