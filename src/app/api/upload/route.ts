import { NextResponse } from "next/server";
import { put } from "@vercel/blob";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { attachments } from "@/lib/db/schema";
import { v4 as uuidv4 } from "uuid";

export async function POST(request: Request) {
  const session = await auth();
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

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // Generate unique filename
    const extension = file.name.split(".").pop();
    const uniqueFilename = `${uuidv4()}.${extension}`;

    // Upload to Vercel Blob
    const blob = await put(uniqueFilename, file, {
      access: "public",
      addRandomSuffix: false,
    });

    // Create thumbnail for images (simplified - in production you'd use Sharp or similar)
    let thumbnailUrl = null;
    if (file.type.startsWith("image/")) {
      thumbnailUrl = blob.url; // In production, generate actual thumbnail
    }

    // Save attachment to database
    const [attachment] = await db
      .insert(attachments)
      .values({
        purchaseId: purchaseId || null,
        lineItemId: lineItemId || null,
        roomId: roomId || null,
        fileUrl: blob.url,
        thumbnailUrl,
        fileName: file.name,
        fileType: fileType as "invoice" | "receipt" | "photo" | "document",
        fileSizeBytes: file.size,
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
