"use client";

import { useState, useEffect } from "react";
import { Plus, Pencil, Trash2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { TagBadge } from "./tag-badge";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "@/lib/i18n/client";
import type { Tag } from "@/lib/db/schema";

const TAG_COLORS = [
  { value: "bg-gray-100 text-gray-800", label: "Gray" },
  { value: "bg-red-100 text-red-800", label: "Red" },
  { value: "bg-orange-100 text-orange-800", label: "Orange" },
  { value: "bg-amber-100 text-amber-800", label: "Amber" },
  { value: "bg-yellow-100 text-yellow-800", label: "Yellow" },
  { value: "bg-lime-100 text-lime-800", label: "Lime" },
  { value: "bg-green-100 text-green-800", label: "Green" },
  { value: "bg-emerald-100 text-emerald-800", label: "Emerald" },
  { value: "bg-teal-100 text-teal-800", label: "Teal" },
  { value: "bg-cyan-100 text-cyan-800", label: "Cyan" },
  { value: "bg-sky-100 text-sky-800", label: "Sky" },
  { value: "bg-blue-100 text-blue-800", label: "Blue" },
  { value: "bg-indigo-100 text-indigo-800", label: "Indigo" },
  { value: "bg-violet-100 text-violet-800", label: "Violet" },
  { value: "bg-purple-100 text-purple-800", label: "Purple" },
  { value: "bg-fuchsia-100 text-fuchsia-800", label: "Fuchsia" },
  { value: "bg-pink-100 text-pink-800", label: "Pink" },
  { value: "bg-rose-100 text-rose-800", label: "Rose" },
];

export function TagsManager() {
  const { toast } = useToast();
  const { t } = useTranslation();
  const [tags, setTags] = useState<Tag[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingTag, setEditingTag] = useState<Tag | null>(null);
  const [formData, setFormData] = useState({ name: "", color: "bg-gray-100 text-gray-800" });

  useEffect(() => {
    fetchTags();
  }, []);

  const fetchTags = async () => {
    try {
      const response = await fetch("/api/tags");
      if (response.ok) {
        const data = await response.json();
        setTags(data);
      }
    } catch (error) {
      console.error("Failed to fetch tags:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenCreate = () => {
    setEditingTag(null);
    setFormData({ name: "", color: "bg-gray-100 text-gray-800" });
    setDialogOpen(true);
  };

  const handleOpenEdit = (tag: Tag) => {
    setEditingTag(tag);
    setFormData({ name: tag.name, color: tag.color || "bg-gray-100 text-gray-800" });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!formData.name.trim()) return;

    setIsSaving(true);
    try {
      const url = editingTag ? `/api/tags/${editingTag.id}` : "/api/tags";
      const method = editingTag ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        toast({
          title: t("common.success"),
          description: editingTag ? t("tags.tagUpdated") : t("tags.tagCreated"),
        });
        setDialogOpen(false);
        fetchTags();
      } else if (response.status === 409) {
        toast({
          title: t("common.error"),
          description: t("tags.tagExists"),
          variant: "destructive",
        });
      } else {
        throw new Error("Failed to save tag");
      }
    } catch (error) {
      toast({
        title: t("common.error"),
        description: t("tags.tagSaveFailed"),
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (tagId: string) => {
    try {
      const response = await fetch(`/api/tags/${tagId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        toast({
          title: t("common.success"),
          description: t("tags.tagDeleted"),
        });
        fetchTags();
      } else {
        throw new Error("Failed to delete tag");
      }
    } catch (error) {
      toast({
        title: t("common.error"),
        description: t("tags.tagDeleteFailed"),
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium">{t("tags.manageTags")}</h3>
          <p className="text-sm text-muted-foreground">
            {t("tags.manageTagsDescription")}
          </p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={handleOpenCreate}>
              <Plus className="mr-2 h-4 w-4" />
              {t("tags.addTag")}
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingTag ? t("tags.editTag") : t("tags.addNewTag")}
              </DialogTitle>
              <DialogDescription>
                {editingTag ? t("tags.editTagDescription") : t("tags.addTagDescription")}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="name">{t("tags.name")} *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder={t("tags.namePlaceholder")}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="color">{t("tags.color")}</Label>
                <Select
                  value={formData.color}
                  onValueChange={(value) => setFormData({ ...formData, color: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {TAG_COLORS.map((color) => (
                      <SelectItem key={color.value} value={color.value}>
                        <span className={`inline-block rounded px-2 py-0.5 text-xs font-medium ${color.value}`}>
                          {color.label}
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>{t("tags.preview")}</Label>
                <div>
                  <TagBadge
                    tag={{
                      id: "preview",
                      name: formData.name || t("tags.sampleTag"),
                      color: formData.color,
                      createdAt: new Date(),
                    }}
                  />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setDialogOpen(false)}
                disabled={isSaving}
              >
                {t("common.cancel")}
              </Button>
              <Button onClick={handleSave} disabled={!formData.name.trim() || isSaving}>
                {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {t("common.save")}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {tags.length === 0 ? (
        <div className="rounded-lg border border-dashed p-8 text-center">
          <p className="text-muted-foreground">{t("tags.noTags")}</p>
        </div>
      ) : (
        <div className="space-y-2">
          {tags.map((tag) => (
            <div
              key={tag.id}
              className="flex items-center justify-between rounded-lg border p-3"
            >
              <TagBadge tag={tag} />
              <div className="flex gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleOpenEdit(tag)}
                >
                  <Pencil className="h-4 w-4" />
                </Button>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="ghost" size="sm">
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>{t("tags.deleteTag")}</AlertDialogTitle>
                      <AlertDialogDescription>
                        {t("tags.deleteTagConfirm").replace("{name}", tag.name)}
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>{t("common.cancel")}</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() => handleDelete(tag.id)}
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                      >
                        {t("common.delete")}
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
