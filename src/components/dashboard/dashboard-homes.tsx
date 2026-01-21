'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Plus, Home as HomeIcon, Check } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { HomeCard } from '@/components/homes/home-card';
import { useHome } from '@/lib/contexts/home-context';
import { useToast } from '@/hooks/use-toast';
import { useTranslation } from '@/lib/i18n/client';
import { cn } from '@/lib/utils';
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

interface DashboardHomesProps {
  homes: (Home & {
    areaCount: number;
    totalSpending: number;
  })[];
}

export function DashboardHomes({ homes: initialHomes }: DashboardHomesProps) {
  const [homes, setHomes] = useState(initialHomes);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const { selectedHomeId, setSelectedHomeId, refreshHomes } = useHome();
  const { toast } = useToast();
  const { t } = useTranslation();
  const router = useRouter();

  const handleSelectHome = (homeId: string | null) => {
    if (selectedHomeId === homeId) {
      // Clicking selected home deselects it (back to all)
      setSelectedHomeId(null);
    } else {
      setSelectedHomeId(homeId);
    }
  };

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
      });

      router.refresh();
    } catch (error) {
      console.error('Error deleting home:', error);
      toast({
        title: t('common.error'),
        description: t('homes.homeDeleteFailed'),
        variant: 'destructive',
      });
    } finally {
      setIsDeleting(false);
      setDeleteId(null);
    }
  };

  return (
    <>
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">{t('dashboard.homes')}</h2>
          <Button variant="outline" size="sm" asChild>
            <Link href="/homes/new">
              <Plus className="h-4 w-4 mr-1" />
              {t('homes.addHome')}
            </Link>
          </Button>
        </div>

        <div className="flex gap-3 overflow-x-auto pt-1 pb-2 -mt-1 -mx-1 px-1">
          {/* All Homes Card */}
          <Card
            className={cn(
              "overflow-hidden transition-all flex-shrink-0 w-[200px] cursor-pointer hover:shadow-md",
              selectedHomeId === null && "ring-2 ring-primary"
            )}
            onClick={() => handleSelectHome(null)}
          >
            <div className="aspect-[4/3] bg-muted flex items-center justify-center relative">
              <HomeIcon className="h-8 w-8 text-muted-foreground" />
              {selectedHomeId === null && (
                <div className="absolute top-2 right-2 h-6 w-6 rounded-full bg-primary flex items-center justify-center">
                  <Check className="h-4 w-4 text-primary-foreground" />
                </div>
              )}
            </div>
            <CardContent className="p-3 space-y-1">
              <h3 className="font-semibold text-sm">{t('dashboard.allHomes')}</h3>
              <p className="text-xs text-muted-foreground line-clamp-2">
                {t('dashboard.allHomesDescription')}
              </p>
            </CardContent>
          </Card>

          {/* Home Cards */}
          {homes.map((home) => (
            <HomeCard
              key={home.id}
              home={home}
              compact
              isSelected={selectedHomeId === home.id}
              onSelect={() => handleSelectHome(home.id)}
              onDelete={(id) => setDeleteId(id)}
            />
          ))}
        </div>
      </div>

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('homes.deleteHome')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('homes.deleteConfirm')}
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
              {t('common.delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
