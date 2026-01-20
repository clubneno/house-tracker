import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDate } from "@/lib/utils";
import { Shield } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface ExpiringWarrantiesProps {
  warranties: {
    id: string;
    description: string;
    brand: string | null;
    warrantyExpiresAt: Date | null;
  }[];
}

function getDaysUntilExpiry(date: Date): number {
  const today = new Date();
  const diffTime = date.getTime() - today.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

export function ExpiringWarranties({ warranties }: ExpiringWarrantiesProps) {
  if (warranties.length === 0) {
    return (
      <Card>
        <CardHeader className="flex flex-row items-center gap-2">
          <Shield className="h-5 w-5 text-muted-foreground" />
          <CardTitle className="text-base">Expiring Warranties</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">No warranties expiring soon</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div className="flex items-center gap-2">
          <Shield className="h-5 w-5 text-muted-foreground" />
          <CardTitle className="text-base">Expiring Warranties</CardTitle>
        </div>
        <Link href="/warranties" className="text-sm text-primary hover:underline">
          View all
        </Link>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {warranties.map((warranty) => {
            const daysLeft = warranty.warrantyExpiresAt
              ? getDaysUntilExpiry(warranty.warrantyExpiresAt)
              : 0;
            const isUrgent = daysLeft <= 30;

            return (
              <div
                key={warranty.id}
                className="flex items-center justify-between text-sm"
              >
                <div>
                  <div className="font-medium">{warranty.description}</div>
                  {warranty.brand && (
                    <div className="text-muted-foreground text-xs">{warranty.brand}</div>
                  )}
                </div>
                <Badge variant={isUrgent ? "destructive" : "secondary"}>
                  {daysLeft} days
                </Badge>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
