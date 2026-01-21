'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { HomeCard } from './home-card';
import { useToast } from '@/hooks/use-toast';
import { useTranslation } from '@/lib/i18n/client';
import { useHome } from '@/lib/contexts/home-context';
import type { Home } from '@/lib/db/schema';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface HomesListProps {
  initialHomes: (Home & {
    areaCount: number;
    totalSpending: number;
  })[];
}

export function HomesList({ initialHomes }: HomesListProps) {
  const [homes, setHomes] = useState(initialHomes);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const router = useRouter();
  const { toast } = useToast();
  const { t } = useTranslation();
  const { refreshHomes, selectedHomeId, setSelectedHomeId } = useHome();

  const handleDelete = async () => {
    if (!deleteId) return;

    setIsDeleting(true);
    try {
      const response = await fetch(`/api/homes/${deleteId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete home');
      }

      // Remove from local state
      setHomes(homes.filter((h) => h.id !== deleteId));

      // If the deleted home was selected, clear selection
      if (selectedHomeId === deleteId) {
        setSelectedHomeId(null);
      }

      // Refresh the homes list in context
      await refreshHomes();

      toast({
        title: t('homes.homeDeleted'),
        description: t('homes.homeDeletedDescription'),
      });

      router.refresh();
    } catch (error) {
      console.error('Error deleting home:', error);
      toast({
        title: t('common.error'),
        description: t('homes.deleteError'),
        variant: 'destructive',
      });
    } finally {
      setIsDeleting(false);
      setDeleteId(null);
    }
  };

  return (
    <>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {homes.map((home) => (
          <HomeCard
            key={home.id}
            home={home}
            onDelete={(id) => setDeleteId(id)}
          />
        ))}
      </div>

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('homes.deleteHome')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('homes.deleteHomeConfirmation')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>
              {t('common.cancel')}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? t('common.deleting') : t('common.delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
