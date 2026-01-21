import { NextResponse } from "next/server";
import { put } from "@vercel/blob";
import { neonAuth } from "@/lib/auth/server";
import { db } from "@/lib/db";
import { attachments } from "@/lib/db/schema";
import { v4 as uuidv4 } from "uuid";
import { optimizeImage, isImage, formatBytes, getCompressionRatio } from "@/lib/image-optimization";
import { optimizePdf, isCloudConvertConfigured } from "@/lib/pdf-optimization";

// Increase timeout for CloudConvert PDF processing
export const maxDuration = 60;

const houseDocumentTypes = [
  "purchase_agreement",
  "utility_contract",
  "insurance",
  "building_permit",
  "tax_document",
  "warranty",
  "manual",
  "other",
] as const;

export async function POST(request: Request) {
  const { session } = await neonAuth();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;
    const purchaseId = formData.get("purchaseId") as string | null;
    const lineItemId = formData.get("lineItemId") as string | null;
    const roomId = formData.get("roomId") as string | null;
    const fileType = (formData.get("fileType") as string) || "document";

    // House document specific fields
    const houseDocumentType = formData.get("houseDocumentType") as string | null;
    const documentTitle = formData.get("documentTitle") as string | null;
    const documentDescription = formData.get("documentDescription") as string | null;
    const expiresAt = formData.get("expiresAt") as string | null;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // Validate house document type if provided
    if (houseDocumentType && !houseDocumentTypes.includes(houseDocumentType as typeof houseDocumentTypes[number])) {
      return NextResponse.json({ error: "Invalid document type" }, { status: 400 });
    }

    const fileId = uuidv4();
    const folder = houseDocumentType ? "documents/" : "";
    let fileUrl: string;
    let thumbnailUrl: string | null = null;
    let finalFileSize = file.size;

    // Check if file is an image and should be optimized
    if (isImage(file.type)) {
      try {
        // Convert file to buffer
        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        // Optimize image and generate thumbnail
        const result = await optimizeImage(buffer, file.type, {
          maxWidth: 1920,
          maxHeight: 1920,
          quality: 80,
          thumbnailWidth: 400,
          thumbnailHeight: 400,
          generateThumbnail: true,
        });

        // Log compression stats
        const ratio = getCompressionRatio(result.originalSize, result.optimizedSize);
        console.log(
          `Image optimization: ${formatBytes(result.originalSize)} -> ${formatBytes(result.optimizedSize)} (${ratio}% reduction)`
        );

        // Determine file extension based on output format
        const extension = result.format === "jpeg" ? "jpg" : result.format;
        const optimizedFilename = `${folder}${fileId}.${extension}`;

        // Upload optimized image
        const optimizedBlob = await put(optimizedFilename, result.optimizedBuffer, {
          access: "public",
          addRandomSuffix: false,
          contentType: `image/${result.format}`,
        });
        fileUrl = optimizedBlob.url;
        finalFileSize = result.optimizedSize;

        // Upload thumbnail if generated
        if (result.thumbnailBuffer) {
          const thumbnailFilename = `${folder}thumbnails/${fileId}.jpg`;
          const thumbnailBlob = await put(thumbnailFilename, result.thumbnailBuffer, {
            access: "public",
            addRandomSuffix: false,
            contentType: "image/jpeg",
          });
          thumbnailUrl = thumbnailBlob.url;
          console.log(`Thumbnail generated: ${formatBytes(result.thumbnailSize || 0)}`);
        }
      } catch (err) {
        console.error("Image optimization failed, uploading original:", err);
        // Fall back to uploading original file
        const extension = file.name.split(".").pop();
        const uniqueFilename = `${folder}${fileId}.${extension}`;
        const blob = await put(uniqueFilename, file, {
          access: "public",
          addRandomSuffix: false,
        });
        fileUrl = blob.url;
      }
    } else if (file.type === "application/pdf" && isCloudConvertConfigured()) {
      // Optimize PDF using CloudConvert
      try {
        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        const result = await optimizePdf(buffer, file.name);

        // Log compression stats
        const ratio = getCompressionRatio(result.originalSize, result.optimizedSize);
        console.log(
          `PDF optimization: ${formatBytes(result.originalSize)} -> ${formatBytes(result.optimizedSize)} (${ratio}% reduction)`
        );

        const uniqueFilename = `${folder}${fileId}.pdf`;
        const blob = await put(uniqueFilename, result.optimizedBuffer, {
          access: "public",
          addRandomSuffix: false,
          contentType: "application/pdf",
        });
        fileUrl = blob.url;
        finalFileSize = result.optimizedSize;

        // Upload PDF thumbnail if generated
        if (result.thumbnailBuffer) {
          const thumbnailFilename = `${folder}thumbnails/${fileId}.jpg`;
          const thumbnailBlob = await put(thumbnailFilename, result.thumbnailBuffer, {
            access: "public",
            addRandomSuffix: false,
            contentType: "image/jpeg",
          });
          thumbnailUrl = thumbnailBlob.url;
          console.log(`PDF thumbnail uploaded: ${formatBytes(result.thumbnailBuffer.length)}`);
        }
      } catch (err) {
        console.error("PDF optimization failed, uploading original:", err);
        const uniqueFilename = `${folder}${fileId}.pdf`;
        const blob = await put(uniqueFilename, file, {
          access: "public",
          addRandomSuffix: false,
        });
        fileUrl = blob.url;
      }
    } else {
      // Other files (including PDFs when CloudConvert not configured): upload as-is
      const extension = file.name.split(".").pop();
      const uniqueFilename = `${folder}${fileId}.${extension}`;
      const blob = await put(uniqueFilename, file, {
        access: "public",
        addRandomSuffix: false,
      });
      fileUrl = blob.url;
    }

    // Save attachment to database
    const [attachment] = await db
      .insert(attachments)
      .values({
        purchaseId: purchaseId || null,
        lineItemId: lineItemId || null,
        roomId: roomId || null,
        fileUrl,
        thumbnailUrl,
        fileName: file.name,
        fileType: fileType as "invoice" | "receipt" | "photo" | "document",
        fileSizeBytes: finalFileSize,
        // House document fields
        houseDocumentType: houseDocumentType as typeof houseDocumentTypes[number] | null,
        documentTitle: documentTitle || null,
        documentDescription: documentDescription || null,
        expiresAt: expiresAt ? new Date(expiresAt) : null,
      })
      .returning();

    return NextResponse.json(attachment);
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json(
      { error: "Failed to upload file" },
      { status: 500 }
    );
  }
}
