import { NextResponse } from "next/server";
import { del } from "@vercel/blob";
import { db } from "@/lib/db";
import { attachments } from "@/lib/db/schema";
import { neonAuth } from "@/lib/auth/server";
import { eq } from "drizzle-orm";

const fileTypes = ["invoice", "receipt", "photo", "document"] as const;
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

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { session } = await neonAuth();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  try {
    const body = await request.json();
    const { fileName, fileType, documentTitle, houseDocumentType } = body;

    // Validate fileType if provided
    if (fileType && !fileTypes.includes(fileType)) {
      return NextResponse.json({ error: "Invalid file type" }, { status: 400 });
    }

    // Validate houseDocumentType if provided
    if (houseDocumentType && !houseDocumentTypes.includes(houseDocumentType)) {
      return NextResponse.json({ error: "Invalid document type" }, { status: 400 });
    }

    // Build update object with only provided fields
    const updateData: Record<string, unknown> = {};
    if (fileName !== undefined) updateData.fileName = fileName;
    if (fileType !== undefined) updateData.fileType = fileType;
    if (documentTitle !== undefined) updateData.documentTitle = documentTitle;
    if (houseDocumentType !== undefined) updateData.houseDocumentType = houseDocumentType;

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ error: "No fields to update" }, { status: 400 });
    }

    const [updated] = await db
      .update(attachments)
      .set(updateData)
      .where(eq(attachments.id, id))
      .returning();

    if (!updated) {
      return NextResponse.json({ error: "Attachment not found" }, { status: 404 });
    }

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Error updating attachment:", error);
    return NextResponse.json(
      { error: "Failed to update attachment" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { session } = await neonAuth();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  try {
    // Get the attachment to find the file URL
    const [attachment] = await db
      .select()
      .from(attachments)
      .where(eq(attachments.id, id))
      .limit(1);

    if (!attachment) {
      return NextResponse.json({ error: "Attachment not found" }, { status: 404 });
    }

    // Delete from Vercel Blob storage
    try {
      await del(attachment.fileUrl);
      if (attachment.thumbnailUrl && attachment.thumbnailUrl !== attachment.fileUrl) {
        await del(attachment.thumbnailUrl);
      }
    } catch (blobError) {
      // Log but don't fail if blob deletion fails
      console.error("Failed to delete blob:", blobError);
    }

    // Delete from database
    await db.delete(attachments).where(eq(attachments.id, id));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting attachment:", error);
    return NextResponse.json(
      { error: "Failed to delete attachment" },
      { status: 500 }
    );
  }
}
