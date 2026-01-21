'use client';

import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { NeonAuthUIProvider } from '@neondatabase/auth-ui';
import { authClient } from '@/lib/auth/client';
import { I18nProvider } from '@/lib/i18n/client';
import { HomeProvider } from '@/lib/contexts/home-context';

export function Providers({ children }: { children: React.ReactNode }) {
  const router = useRouter();

  return (
    <I18nProvider>
      <NeonAuthUIProvider
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        authClient={authClient as any}
        navigate={router.push}
        replace={router.replace}
        onSessionChange={() => router.refresh()}
        emailOTP
        redirectTo="/"
        Link={Link}
      >
        <HomeProvider>
          {children}
        </HomeProvider>
      </NeonAuthUIProvider>
    </I18nProvider>
  );
}
