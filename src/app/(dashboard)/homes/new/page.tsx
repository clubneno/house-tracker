'use client';

import { HomeForm } from '@/components/homes/home-form';
import { useTranslation } from '@/lib/i18n/client';

export default function NewHomePage() {
  const { t } = useTranslation();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{t('homes.addNewHome')}</h1>
        <p className="text-muted-foreground">
          {t('homes.newHomeDescription')}
        </p>
      </div>
      <HomeForm />
    </div>
  );
}
