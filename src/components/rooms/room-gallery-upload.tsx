"use client";

import { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { useRouter } from "next/navigation";
import imageCompression from "browser-image-compression";
import { Upload, Loader2, X, ImageIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { formatFileSize } from "@/lib/utils";

interface RoomGalleryUploadProps {
  roomId: string;
}

interface UploadFile {
  file: File;
  preview: string;
  uploading: boolean;
  uploaded: boolean;
  error?: string;
}

export function RoomGalleryUpload({ roomId }: RoomGalleryUploadProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [files, setFiles] = useState<UploadFile[]>([]);
  const [isUploading, setIsUploading] = useState(false);

  const compressImage = async (file: File): Promise<File> => {
    const options = {
      maxSizeMB: 1,
      maxWidthOrHeight: 1920,
      useWebWorker: true,
    };
    return imageCompression(file, options);
  };

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const newFiles: UploadFile[] = acceptedFiles.map((file) => ({
      file,
      preview: URL.createObjectURL(file),
      uploading: false,
      uploaded: false,
    }));
    setFiles((prev) => [...prev, ...newFiles]);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "image/*": [".png", ".jpg", ".jpeg", ".webp", ".heic"],
    },
    maxSize: 10 * 1024 * 1024, // 10MB
  });

  const removeFile = (index: number) => {
    setFiles((prev) => {
      const newFiles = [...prev];
      URL.revokeObjectURL(newFiles[index].preview);
      newFiles.splice(index, 1);
      return newFiles;
    });
  };

  const handleUpload = async () => {
    if (files.length === 0) return;

    setIsUploading(true);

    try {
      for (let i = 0; i < files.length; i++) {
        if (files[i].uploaded) continue;

        // Mark as uploading
        setFiles((prev) => {
          const newFiles = [...prev];
          newFiles[i].uploading = true;
          return newFiles;
        });

        try {
          // Compress image
          const compressedFile = await compressImage(files[i].file);

          // Create form data
          const formData = new FormData();
          formData.append("file", compressedFile);
          formData.append("roomId", roomId);
          formData.append("fileType", "photo");

          // Upload
          const response = await fetch("/api/upload", {
            method: "POST",
            body: formData,
          });

          if (!response.ok) {
            throw new Error("Upload failed");
          }

          // Mark as uploaded
          setFiles((prev) => {
            const newFiles = [...prev];
            newFiles[i].uploading = false;
            newFiles[i].uploaded = true;
            return newFiles;
          });
        } catch (error) {
          setFiles((prev) => {
            const newFiles = [...prev];
            newFiles[i].uploading = false;
            newFiles[i].error = "Upload failed";
            return newFiles;
          });
        }
      }

      const successCount = files.filter((f) => f.uploaded || !f.error).length;
      const failCount = files.filter((f) => f.error).length;

      if (failCount === 0) {
        toast({
          title: "Upload complete",
          description: `${successCount} photo${successCount !== 1 ? "s" : ""} uploaded successfully.`,
        });
        setOpen(false);
        resetState();
        router.refresh();
      } else {
        toast({
          title: "Upload partially complete",
          description: `${successCount} uploaded, ${failCount} failed.`,
          variant: "destructive",
        });
      }
    } finally {
      setIsUploading(false);
    }
  };

  const resetState = () => {
    files.forEach((f) => URL.revokeObjectURL(f.preview));
    setFiles([]);
    setIsUploading(false);
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(isOpen) => {
        setOpen(isOpen);
        if (!isOpen) resetState();
      }}
    >
      <DialogTrigger asChild>
        <Button>
          <Upload className="mr-2 h-4 w-4" />
          Upload Photo
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Upload Photos</DialogTitle>
          <DialogDescription>
            Add photos to document progress in this room
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div
            {...getRootProps()}
            className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
              isDragActive
                ? "border-primary bg-primary/5"
                : "border-muted-foreground/25 hover:border-primary"
            }`}
          >
            <input {...getInputProps()} />
            <Upload className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            {isDragActive ? (
              <p>Drop the files here...</p>
            ) : (
              <>
                <p className="text-lg font-medium">
                  Drag & drop photos here
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  or click to select files
                </p>
                <p className="text-xs text-muted-foreground mt-2">
                  Supports PNG, JPG, JPEG, WebP, HEIC (max 10MB each)
                </p>
              </>
            )}
          </div>

          {files.length > 0 && (
            <div className="space-y-2">
              <p className="text-sm font-medium">
                {files.length} file{files.length !== 1 ? "s" : ""} selected
              </p>
              <div className="grid gap-2 grid-cols-2 md:grid-cols-3">
                {files.map((uploadFile, index) => (
                  <div
                    key={index}
                    className="relative group border rounded-lg overflow-hidden"
                  >
                    <div className="aspect-square relative">
                      <img
                        src={uploadFile.preview}
                        alt={`Preview ${index + 1}`}
                        className="w-full h-full object-cover"
                      />
                      {uploadFile.uploading && (
                        <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                          <Loader2 className="h-6 w-6 text-white animate-spin" />
                        </div>
                      )}
                      {uploadFile.uploaded && (
                        <div className="absolute inset-0 bg-green-500/20 flex items-center justify-center">
                          <div className="bg-green-500 text-white rounded-full p-1">
                            <ImageIcon className="h-4 w-4" />
                          </div>
                        </div>
                      )}
                      {uploadFile.error && (
                        <div className="absolute inset-0 bg-red-500/20 flex items-center justify-center">
                          <p className="text-xs text-red-500 font-medium">
                            {uploadFile.error}
                          </p>
                        </div>
                      )}
                    </div>
                    <div className="p-2">
                      <p className="text-xs truncate">{uploadFile.file.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatFileSize(uploadFile.file.size)}
                      </p>
                    </div>
                    {!uploadFile.uploading && !uploadFile.uploaded && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="absolute top-1 right-1 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={() => removeFile(index)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleUpload}
            disabled={files.length === 0 || isUploading}
          >
            {isUploading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Uploading...
              </>
            ) : (
              <>
                <Upload className="mr-2 h-4 w-4" />
                Upload {files.length > 0 ? `(${files.length})` : ""}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
