"use client";

import { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { FileText, Receipt, Image, File, ExternalLink, Upload, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { Attachment } from "@/lib/db/schema";
import { DeleteAttachmentButton } from "./delete-attachment-button";
import { EditAttachmentDialog } from "./edit-attachment-dialog";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "@/lib/i18n/client";
import imageCompression from "browser-image-compression";

interface PurchaseAttachmentsProps {
  purchaseId: string;
  attachments: Attachment[];
  onAttachmentsChange?: () => void;
}

const fileTypeIcons: Record<string, typeof FileText> = {
  invoice: Receipt,
  receipt: Receipt,
  photo: Image,
  document: File,
};

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function PurchaseAttachments({
  purchaseId,
  attachments: initialAttachments,
  onAttachmentsChange,
}: PurchaseAttachmentsProps) {
  const { toast } = useToast();
  const { t } = useTranslation();
  const [attachments, setAttachments] = useState(initialAttachments);
  const [isUploading, setIsUploading] = useState(false);

  const handleUpload = async (file: File) => {
    setIsUploading(true);

    try {
      let fileToUpload = file;

      // Compress images
      if (file.type.startsWith("image/")) {
        const options = {
          maxSizeMB: 1,
          maxWidthOrHeight: 1920,
          useWebWorker: true,
        };
        fileToUpload = await imageCompression(file, options);
      }

      // Auto-detect file type
      let fileType = "document";
      if (file.type.startsWith("image/")) {
        fileType = "photo";
      } else if (file.name.toLowerCase().includes("invoice")) {
        fileType = "invoice";
      } else if (file.name.toLowerCase().includes("receipt")) {
        fileType = "receipt";
      }

      const formData = new FormData();
      formData.append("file", fileToUpload);
      formData.append("purchaseId", purchaseId);
      formData.append("fileType", fileType);

      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Failed to upload file");
      }

      const attachment = await response.json();
      setAttachments((prev) => [...prev, attachment]);
      toast({
        title: t("common.success"),
        description: t("attachments.uploadSuccess"),
      });
      onAttachmentsChange?.();
    } catch (error) {
      toast({
        title: t("common.error"),
        description: t("attachments.uploadFailed"),
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      handleUpload(acceptedFiles[0]);
    }
  }, [purchaseId]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    multiple: false,
    disabled: isUploading,
    accept: {
      "image/*": [".png", ".jpg", ".jpeg", ".gif", ".webp"],
      "application/pdf": [".pdf"],
      "application/msword": [".doc"],
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document": [".docx"],
    },
  });

  const handleDelete = async (attachmentId: string) => {
    try {
      const response = await fetch(`/api/attachments/${attachmentId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete attachment");
      }

      setAttachments((prev) => prev.filter((a) => a.id !== attachmentId));
      toast({
        title: t("common.success"),
        description: t("attachments.deleteSuccess"),
      });
      onAttachmentsChange?.();
    } catch (error) {
      toast({
        title: t("common.error"),
        description: t("attachments.deleteFailed"),
        variant: "destructive",
      });
    }
  };

  const handleUpdate = (updated: Attachment) => {
    setAttachments((prev) =>
      prev.map((a) => (a.id === updated.id ? updated : a))
    );
    onAttachmentsChange?.();
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          {t("purchases.attachments")}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Attachments List */}
        {attachments.length > 0 && (
          <div className="grid gap-3 md:grid-cols-2">
            {attachments.map((attachment) => {
              const IconComponent = fileTypeIcons[attachment.fileType] || File;
              const hasThumbnail = attachment.thumbnailUrl &&
                (attachment.fileType === "photo" || attachment.fileName.toLowerCase().endsWith(".pdf"));

              return (
                <div
                  key={attachment.id}
                  className="flex items-center gap-3 p-3 border rounded-lg group"
                >
                  <div className="flex-shrink-0">
                    {hasThumbnail ? (
                      <img
                        src={attachment.thumbnailUrl!}
                        alt={attachment.fileName}
                        className="w-10 h-10 object-cover rounded"
                      />
                    ) : (
                      <div className="w-10 h-10 bg-muted rounded flex items-center justify-center">
                        <IconComponent className="h-5 w-5 text-muted-foreground" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{attachment.fileName}</p>
                    <p className="text-xs text-muted-foreground">
                      {t(`attachments.types.${attachment.fileType}`)} &middot; {formatFileSize(attachment.fileSizeBytes)}
                    </p>
                  </div>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button variant="ghost" size="sm" asChild>
                      <a
                        href={attachment.fileUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <ExternalLink className="h-4 w-4" />
                      </a>
                    </Button>
                    <EditAttachmentDialog
                      attachment={attachment}
                      onSuccess={handleUpdate}
                    />
                    <DeleteAttachmentButton
                      attachmentId={attachment.id}
                      fileName={attachment.fileName}
                      onDelete={() => handleDelete(attachment.id)}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Always-visible Drop Zone */}
        <div
          {...getRootProps()}
          className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors
            ${isDragActive ? "border-primary bg-primary/5" : "border-muted-foreground/25 hover:border-primary/50"}
            ${isUploading ? "opacity-50 cursor-not-allowed" : ""}`}
        >
          <input {...getInputProps()} />
          {isUploading ? (
            <div className="flex flex-col items-center">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground mb-2" />
              <p className="text-sm text-muted-foreground">{t("attachments.uploading")}</p>
            </div>
          ) : isDragActive ? (
            <div className="flex flex-col items-center">
              <Upload className="h-8 w-8 text-primary mb-2" />
              <p className="font-medium">{t("attachments.dropHere")}</p>
            </div>
          ) : (
            <div className="flex flex-col items-center">
              <Upload className="h-8 w-8 text-muted-foreground mb-2" />
              <p className="font-medium">{t("attachments.dragDrop")}</p>
              <p className="text-sm text-muted-foreground mt-1">
                {t("attachments.clickBrowse")}
              </p>
              <p className="text-xs text-muted-foreground mt-2">
                {t("attachments.supportedFormats")}
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
