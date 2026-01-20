import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency, formatDate } from "@/lib/utils";
import { CalendarClock } from "lucide-react";

interface UpcomingPaymentsProps {
  payments: {
    id: string;
    totalAmount: number;
    paymentDueDate: Date | null;
    supplierName: string | null;
  }[];
}

export function UpcomingPayments({ payments }: UpcomingPaymentsProps) {
  if (payments.length === 0) {
    return (
      <Card>
        <CardHeader className="flex flex-row items-center gap-2">
          <CalendarClock className="h-5 w-5 text-muted-foreground" />
          <CardTitle className="text-base">Upcoming Payments</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">No upcoming payments</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center gap-2">
        <CalendarClock className="h-5 w-5 text-muted-foreground" />
        <CardTitle className="text-base">Upcoming Payments</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {payments.map((payment) => (
            <Link
              key={payment.id}
              href={`/purchases/${payment.id}`}
              className="flex items-center justify-between text-sm hover:bg-muted/50 -mx-2 px-2 py-1 rounded"
            >
              <div>
                <div className="font-medium">{payment.supplierName}</div>
                <div className="text-muted-foreground text-xs">
                  Due: {payment.paymentDueDate ? formatDate(payment.paymentDueDate) : "N/A"}
                </div>
              </div>
              <div className="font-medium">{formatCurrency(payment.totalAmount)}</div>
            </Link>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
