"use client";

import { useState, useEffect } from "react";
import { Loader2, Plus, GripVertical } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "@/lib/i18n/client";
import { getIconByName } from "@/lib/categories";
import type { ExpenseCategoryRecord } from "@/lib/db/schema";
import { AddCategoryDialog } from "./add-category-dialog";
import { EditCategoryDialog } from "./edit-category-dialog";
import { DeleteCategoryButton } from "./delete-category-button";

export function CategoriesTable() {
  const { toast } = useToast();
  const { t } = useTranslation();
  const [categories, setCategories] = useState<ExpenseCategoryRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<ExpenseCategoryRecord | null>(null);

  const fetchCategories = async () => {
    try {
      const response = await fetch("/api/categories");
      if (!response.ok) throw new Error("Failed to fetch categories");
      const data = await response.json();
      setCategories(data);
    } catch (error) {
      toast({
        title: t("common.error"),
        description: t("settings.categoryFetchFailed"),
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const handleEdit = (category: ExpenseCategoryRecord) => {
    setSelectedCategory(category);
    setEditDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    try {
      const response = await fetch(`/api/categories/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || error.error || "Failed to delete category");
      }

      toast({
        title: t("common.success"),
        description: t("settings.categoryDeleted"),
      });
      fetchCategories();
    } catch (error) {
      toast({
        title: t("common.error"),
        description: error instanceof Error ? error.message : t("settings.categoryDeleteFailed"),
        variant: "destructive",
      });
    }
  };

  const handleSuccess = () => {
    fetchCategories();
    setAddDialogOpen(false);
    setEditDialogOpen(false);
    setSelectedCategory(null);
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>{t("settings.expenseCategories")}</CardTitle>
            <CardDescription>
              {t("settings.manageCategoriesDesc")}
            </CardDescription>
          </div>
          <Button onClick={() => setAddDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            {t("settings.addCategory")}
          </Button>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">#</TableHead>
                <TableHead>{t("settings.categories")}</TableHead>
                <TableHead>{t("settings.categoryIcon")}</TableHead>
                <TableHead>{t("settings.categoryColors")}</TableHead>
                <TableHead className="text-right">{t("common.actions")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {categories.map((category, index) => {
                const IconComponent = getIconByName(category.iconName);
                return (
                  <TableRow key={category.id}>
                    <TableCell className="text-muted-foreground">
                      {index + 1}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-md ${category.bgColor}`}>
                          <IconComponent className={`h-4 w-4 ${category.color}`} />
                        </div>
                        <div>
                          <p className="font-medium">{category.label}</p>
                          <p className="text-xs text-muted-foreground">{category.name}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {category.iconName}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span className={`text-xs ${category.color}`}>
                          {category.color}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEdit(category)}
                        >
                          {t("common.edit")}
                        </Button>
                        <DeleteCategoryButton
                          categoryId={category.id}
                          categoryName={category.label}
                          onDelete={() => handleDelete(category.id)}
                        />
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
              {categories.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                    {t("settings.noCategoriesFound")}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <AddCategoryDialog
        open={addDialogOpen}
        onOpenChange={setAddDialogOpen}
        onSuccess={handleSuccess}
      />

      {selectedCategory && (
        <EditCategoryDialog
          open={editDialogOpen}
          onOpenChange={setEditDialogOpen}
          category={selectedCategory}
          onSuccess={handleSuccess}
        />
      )}
    </>
  );
}
