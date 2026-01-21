export const dynamic = 'force-dynamic';

import { db } from "@/lib/db";
import { attachments, rooms, areas, purchases } from "@/lib/db/schema";
import { desc, isNotNull, lte, gte, and, sql } from "drizzle-orm";
import { DocumentsPageClient } from "@/components/documents/documents-page-client";

async function getDocuments() {
  // Get documents with homeId through room -> area or purchase
  const documents = await db
    .select({
      attachment: attachments,
      homeIdFromRoom: areas.homeId,
      homeIdFromPurchase: purchases.homeId,
    })
    .from(attachments)
    .leftJoin(rooms, sql`${attachments.roomId} = ${rooms.id}`)
    .leftJoin(areas, sql`${rooms.areaId} = ${areas.id}`)
    .leftJoin(purchases, sql`${attachments.purchaseId} = ${purchases.id}`)
    .where(isNotNull(attachments.houseDocumentType))
    .orderBy(desc(attachments.createdAt));

  return documents.map(d => ({
    ...d.attachment,
    homeId: d.homeIdFromRoom || d.homeIdFromPurchase || null,
  }));
}

async function getExpiringDocuments() {
  const now = new Date();
  const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

  const expiringDocs = await db
    .select({
      attachment: attachments,
      homeIdFromRoom: areas.homeId,
      homeIdFromPurchase: purchases.homeId,
    })
    .from(attachments)
    .leftJoin(rooms, sql`${attachments.roomId} = ${rooms.id}`)
    .leftJoin(areas, sql`${rooms.areaId} = ${areas.id}`)
    .leftJoin(purchases, sql`${attachments.purchaseId} = ${purchases.id}`)
    .where(
      and(
        isNotNull(attachments.houseDocumentType),
        isNotNull(attachments.expiresAt),
        gte(attachments.expiresAt, now),
        lte(attachments.expiresAt, thirtyDaysFromNow)
      )
    )
    .orderBy(attachments.expiresAt);

  return expiringDocs.map(d => ({
    ...d.attachment,
    homeId: d.homeIdFromRoom || d.homeIdFromPurchase || null,
  }));
}

export default async function DocumentsPage() {
  const [documents, expiringDocuments] = await Promise.all([
    getDocuments(),
    getExpiringDocuments(),
  ]);

  return (
    <DocumentsPageClient
      documents={documents}
      expiringDocuments={expiringDocuments}
    />
  );
}
