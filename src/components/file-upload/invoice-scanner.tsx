"use client";

import { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import imageCompression from "browser-image-compression";
import { Loader2, Upload, FileText, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
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

interface ExtractedData {
  date: string | null;
  supplierName: string | null;
  supplierAddress: string | null;
  invoiceNumber: string | null;
  lineItems: {
    description: string;
    brand: string | null;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
  }[];
  subtotal: number | null;
  tax: number | null;
  totalAmount: number | null;
  currency: string;
  paymentMethod: string | null;
  notes: string | null;
}

interface InvoiceScannerProps {
  onDataExtracted: (data: ExtractedData) => void;
}

export function InvoiceScanner({ onDataExtracted }: InvoiceScannerProps) {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [extractedData, setExtractedData] = useState<ExtractedData | null>(null);

  const compressImage = async (file: File): Promise<string> => {
    const options = {
      maxSizeMB: 1,
      maxWidthOrHeight: 1920,
      useWebWorker: true,
    };

    const compressedFile = await imageCompression(file, options);
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const base64 = (reader.result as string).split(",")[1];
        resolve(base64);
      };
      reader.onerror = reject;
      reader.readAsDataURL(compressedFile);
    });
  };

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (!file) return;

    setFile(file);

    // Create preview
    const reader = new FileReader();
    reader.onload = () => {
      setPreview(reader.result as string);
    };
    reader.readAsDataURL(file);

    setExtractedData(null);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "image/*": [".png", ".jpg", ".jpeg", ".webp"],
      "application/pdf": [".pdf"],
    },
    maxFiles: 1,
    maxSize: 10 * 1024 * 1024, // 10MB
  });

  const handleExtract = async () => {
    if (!file) return;

    setIsProcessing(true);
    try {
      let requestBody;

      if (file.type.startsWith("image/")) {
        const base64 = await compressImage(file);
        requestBody = {
          imageBase64: base64,
          mimeType: file.type,
        };
      } else {
        // For PDFs, we'd need to convert to image or use different approach
        toast({
          title: "PDF Support",
          description: "PDF extraction coming soon. Please use an image for now.",
          variant: "destructive",
        });
        setIsProcessing(false);
        return;
      }

      const response = await fetch("/api/ai/extract-invoice", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        throw new Error("Failed to extract data");
      }

      const result = await response.json();

      if (result.success && result.data) {
        setExtractedData(result.data);
        toast({
          title: "Success",
          description: "Invoice data extracted successfully",
        });
      } else {
        throw new Error(result.error || "Extraction failed");
      }
    } catch (error) {
      console.error("Extraction error:", error);
      toast({
        title: "Error",
        description: "Failed to extract invoice data. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleConfirm = () => {
    if (extractedData) {
      onDataExtracted(extractedData);
      setOpen(false);
      resetState();
    }
  };

  const resetState = () => {
    setFile(null);
    setPreview(null);
    setExtractedData(null);
    setIsProcessing(false);
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => {
      setOpen(isOpen);
      if (!isOpen) resetState();
    }}>
      <DialogTrigger asChild>
        <Button variant="outline" type="button">
          <FileText className="mr-2 h-4 w-4" />
          Scan Invoice
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Scan Invoice</DialogTitle>
          <DialogDescription>
            Upload an invoice image to automatically extract data
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {!file ? (
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
                <p>Drop the file here...</p>
              ) : (
                <>
                  <p className="text-lg font-medium">
                    Drag & drop an invoice here
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">
                    or click to select a file
                  </p>
                  <p className="text-xs text-muted-foreground mt-2">
                    Supports PNG, JPG, JPEG, WebP (max 10MB)
                  </p>
                </>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center gap-4 p-4 border rounded-lg">
                {preview && (
                  <img
                    src={preview}
                    alt="Invoice preview"
                    className="h-20 w-20 object-cover rounded"
                  />
                )}
                <div className="flex-1">
                  <p className="font-medium">{file.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {formatFileSize(file.size)}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={resetState}
                  disabled={isProcessing}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>

              {!extractedData && (
                <Button
                  onClick={handleExtract}
                  disabled={isProcessing}
                  className="w-full"
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Extracting data...
                    </>
                  ) : (
                    <>
                      <FileText className="mr-2 h-4 w-4" />
                      Extract Invoice Data
                    </>
                  )}
                </Button>
              )}

              {extractedData && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Check className="h-5 w-5 text-green-500" />
                      Extracted Data
                    </CardTitle>
                    <CardDescription>
                      Review the extracted information below
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-muted-foreground">Date</p>
                        <p className="font-medium">
                          {extractedData.date || "Not found"}
                        </p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Supplier</p>
                        <p className="font-medium">
                          {extractedData.supplierName || "Not found"}
                        </p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Invoice #</p>
                        <p className="font-medium">
                          {extractedData.invoiceNumber || "Not found"}
                        </p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Total</p>
                        <p className="font-medium">
                          {extractedData.totalAmount
                            ? `${extractedData.currency} ${extractedData.totalAmount}`
                            : "Not found"}
                        </p>
                      </div>
                    </div>

                    {extractedData.lineItems.length > 0 && (
                      <div>
                        <p className="text-muted-foreground text-sm mb-2">
                          Line Items ({extractedData.lineItems.length})
                        </p>
                        <div className="space-y-2 max-h-40 overflow-y-auto">
                          {extractedData.lineItems.map((item, index) => (
                            <div
                              key={index}
                              className="flex justify-between text-sm p-2 bg-muted rounded"
                            >
                              <span className="truncate flex-1">
                                {item.description}
                              </span>
                              <span className="font-medium ml-4">
                                {extractedData.currency} {item.totalPrice}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          {extractedData && (
            <Button onClick={handleConfirm}>
              Use Extracted Data
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
