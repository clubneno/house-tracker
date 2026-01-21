import { NextResponse } from "next/server";
import { put } from "@vercel/blob";
import { neonAuth } from "@/lib/auth/server";
import { db } from "@/lib/db";
import { attachments } from "@/lib/db/schema";
import { eq, isNotNull, desc, and, lte, gte } from "drizzle-orm";
import { v4 as uuidv4 } from "uuid";
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

export async function GET(request: Request) {
  const { session } = await neonAuth();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const documentType = searchParams.get("type");
  const expiringWithinDays = searchParams.get("expiringWithinDays");

  let conditions = [isNotNull(attachments.houseDocumentType)];

  if (documentType && houseDocumentTypes.includes(documentType as typeof houseDocumentTypes[number])) {
    conditions.push(eq(attachments.houseDocumentType, documentType as typeof houseDocumentTypes[number]));
  }

  if (expiringWithinDays) {
    const days = parseInt(expiringWithinDays, 10);
    if (!isNaN(days)) {
      const now = new Date();
      const futureDate = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);
      conditions.push(isNotNull(attachments.expiresAt));
      conditions.push(gte(attachments.expiresAt, now));
      conditions.push(lte(attachments.expiresAt, futureDate));
    }
  }

  const documents = await db
    .select()
    .from(attachments)
    .where(and(...conditions))
    .orderBy(desc(attachments.createdAt));

  return NextResponse.json(documents);
}

export async function POST(request: Request) {
  const { session } = await neonAuth();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;
    const houseDocumentType = formData.get("houseDocumentType") as string;
    const documentTitle = formData.get("documentTitle") as string | null;
    const documentDescription = formData.get("documentDescription") as string | null;
    const expiresAt = formData.get("expiresAt") as string | null;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    if (!houseDocumentType || !houseDocumentTypes.includes(houseDocumentType as typeof houseDocumentTypes[number])) {
      return NextResponse.json({ error: "Invalid document type" }, { status: 400 });
    }

    // Generate unique filename
    const extension = file.name.split(".").pop();
    const uniqueFilename = `documents/${uuidv4()}.${extension}`;

    // Upload to Vercel Blob
    const blob = await put(uniqueFilename, file, {
      access: "public",
      addRandomSuffix: false,
    });

    // Create thumbnail for images
    let thumbnailUrl = null;
    if (file.type.startsWith("image/")) {
      thumbnailUrl = blob.url;
    }

    // Save document to database
    const [document] = await db
      .insert(attachments)
      .values({
        fileUrl: blob.url,
        thumbnailUrl,
        fileName: file.name,
        fileType: "document",
        fileSizeBytes: file.size,
        houseDocumentType: houseDocumentType as typeof houseDocumentTypes[number],
        documentTitle: documentTitle || file.name,
        documentDescription,
        expiresAt: expiresAt ? new Date(expiresAt) : null,
      })
      .returning();

    return NextResponse.json(document);
  } catch (error) {
    console.error("Error creating document:", error);
    return NextResponse.json(
      { error: "Failed to create document" },
      { status: 500 }
    );
  }
}
