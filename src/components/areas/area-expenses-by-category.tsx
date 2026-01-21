"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { formatCurrency } from "@/lib/utils";
import {
  categoryConfig,
  getCategoryLabelStatic,
  getCategoryColorStatic,
  ExpenseCategory,
} from "@/lib/categories";

interface CategoryExpense {
  category: ExpenseCategory | null;
  total: number;
  count: number;
}

interface AreaExpensesByCategoryProps {
  expenses: CategoryExpense[];
  totalSpending: number;
}

export function AreaExpensesByCategory({
  expenses,
  totalSpending,
}: AreaExpensesByCategoryProps) {
  if (expenses.length === 0) {
    return null;
  }

  // Sort by total amount descending
  const sortedExpenses = [...expenses].sort((a, b) => b.total - a.total);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Spending by Category</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {sortedExpenses.map((expense) => {
          const percentage = totalSpending > 0
            ? (expense.total / totalSpending) * 100
            : 0;
          const config = expense.category ? categoryConfig[expense.category] : null;
          const Icon = config?.icon;

          return (
            <div key={expense.category || "uncategorized"} className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  {Icon && (
                    <Icon className={`h-4 w-4 ${getCategoryColorStatic(expense.category)}`} />
                  )}
                  <span className="font-medium">
                    {getCategoryLabelStatic(expense.category)}
                  </span>
                  <span className="text-muted-foreground">
                    ({expense.count} purchase{expense.count !== 1 ? "s" : ""})
                  </span>
                </div>
                <span className="font-medium">
                  {formatCurrency(expense.total)}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Progress
                  value={percentage}
                  className="h-2"
                />
                <span className="text-xs text-muted-foreground w-12 text-right">
                  {percentage.toFixed(1)}%
                </span>
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
