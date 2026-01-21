import { NextResponse } from "next/server";
import { del } from "@vercel/blob";
import { neonAuth } from "@/lib/auth/server";
import { db } from "@/lib/db";
import { attachments } from "@/lib/db/schema";
import { eq, and, isNotNull } from "drizzle-orm";
import { z } from "zod";

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

const updateDocumentSchema = z.object({
  houseDocumentType: z.enum(houseDocumentTypes).optional(),
  documentTitle: z.string().min(1).optional(),
  documentDescription: z.string().nullable().optional(),
  expiresAt: z.string().nullable().optional(),
});

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { session } = await neonAuth();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const [document] = await db
    .select()
    .from(attachments)
    .where(and(eq(attachments.id, id), isNotNull(attachments.houseDocumentType)))
    .limit(1);

  if (!document) {
    return NextResponse.json({ error: "Document not found" }, { status: 404 });
  }

  return NextResponse.json(document);
}

export async function PUT(
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
    const data = updateDocumentSchema.parse(body);

    const updateValues: Record<string, unknown> = {};

    if (data.houseDocumentType !== undefined) {
      updateValues.houseDocumentType = data.houseDocumentType;
    }
    if (data.documentTitle !== undefined) {
      updateValues.documentTitle = data.documentTitle;
    }
    if (data.documentDescription !== undefined) {
      updateValues.documentDescription = data.documentDescription;
    }
    if (data.expiresAt !== undefined) {
      updateValues.expiresAt = data.expiresAt ? new Date(data.expiresAt) : null;
    }

    const [document] = await db
      .update(attachments)
      .set(updateValues)
      .where(and(eq(attachments.id, id), isNotNull(attachments.houseDocumentType)))
      .returning();

    if (!document) {
      return NextResponse.json({ error: "Document not found" }, { status: 404 });
    }

    return NextResponse.json(document);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid input", details: error.errors },
        { status: 400 }
      );
    }
    console.error("Error updating document:", error);
    return NextResponse.json(
      { error: "Internal server error" },
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

  // Get the document first to get the file URL
  const [document] = await db
    .select()
    .from(attachments)
    .where(and(eq(attachments.id, id), isNotNull(attachments.houseDocumentType)))
    .limit(1);

  if (!document) {
    return NextResponse.json({ error: "Document not found" }, { status: 404 });
  }

  try {
    // Delete from Vercel Blob
    await del(document.fileUrl);
  } catch (error) {
    console.error("Error deleting file from blob storage:", error);
    // Continue with database deletion even if blob deletion fails
  }

  // Delete from database
  await db.delete(attachments).where(eq(attachments.id, id));

  return NextResponse.json({ success: true });
}
