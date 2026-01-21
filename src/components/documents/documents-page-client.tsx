'use client';

import { useState, useMemo } from 'react';
import { useTranslation } from '@/lib/i18n/client';
import { useHome } from '@/lib/contexts/home-context';
import { AddDocumentDialog } from '@/components/documents/add-document-dialog';
import { DocumentsHeader } from '@/components/documents/documents-header';
import { NoDocuments } from '@/components/documents/no-documents';
import { DocumentsExpiringAlert } from '@/components/documents/documents-expiring-alert';
import { DocumentsStats } from '@/components/documents/documents-stats';
import { DocumentsGroupedList } from '@/components/documents/documents-grouped-list';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { Attachment } from '@/lib/db/schema';

interface DocumentItem extends Attachment {
  homeId?: string | null;
}

interface DocumentsPageClientProps {
  documents: DocumentItem[];
  expiringDocuments: DocumentItem[];
}

export function DocumentsPageClient({ documents, expiringDocuments }: DocumentsPageClientProps) {
  const { t, locale } = useTranslation();
  const { selectedHomeId, homes } = useHome();
  const [filterHomeId, setFilterHomeId] = useState<string>('all');

  // Filter documents based on selected home
  const filteredDocuments = useMemo(() => {
    if (selectedHomeId) {
      return documents.filter(d => d.homeId === selectedHomeId);
    }
    if (filterHomeId && filterHomeId !== 'all') {
      return documents.filter(d => d.homeId === filterHomeId);
    }
    return documents;
  }, [documents, selectedHomeId, filterHomeId]);

  const filteredExpiringDocuments = useMemo(() => {
    if (selectedHomeId) {
      return expiringDocuments.filter(d => d.homeId === selectedHomeId);
    }
    if (filterHomeId && filterHomeId !== 'all') {
      return expiringDocuments.filter(d => d.homeId === filterHomeId);
    }
    return expiringDocuments;
  }, [expiringDocuments, selectedHomeId, filterHomeId]);

  // Group documents by type
  const documentsByType = useMemo(() => {
    return filteredDocuments.reduce((acc, doc) => {
      const type = doc.houseDocumentType || "other";
      if (!acc[type]) {
        acc[type] = [];
      }
      acc[type].push(doc);
      return acc;
    }, {} as Record<string, typeof filteredDocuments>);
  }, [filteredDocuments]);

  const showHomeFilter = !selectedHomeId && homes.length > 1;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <DocumentsHeader />
        <div className="flex items-center gap-2">
          {showHomeFilter && (
            <Select value={filterHomeId} onValueChange={setFilterHomeId}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder={t('homes.selectHome')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('homes.allHomes')}</SelectItem>
                {homes.map((home) => (
                  <SelectItem key={home.id} value={home.id}>
                    {locale === 'lt' && home.nameLt ? home.nameLt : home.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          <AddDocumentDialog />
        </div>
      </div>

      <DocumentsExpiringAlert count={filteredExpiringDocuments.length} />

      <DocumentsStats
        totalDocuments={filteredDocuments.length}
        documentTypes={Object.keys(documentsByType).length}
        expiringSoon={filteredExpiringDocuments.length}
        withExpiryDates={filteredDocuments.filter(d => d.expiresAt).length}
      />

      {filteredDocuments.length === 0 ? (
        <NoDocuments />
      ) : (
        <DocumentsGroupedList documentsByType={documentsByType as any} />
      )}
    </div>
  );
}
