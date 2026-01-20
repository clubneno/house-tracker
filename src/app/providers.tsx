'use client';

import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { NeonAuthUIProvider } from '@neondatabase/auth-ui';
import { authClient } from '@/lib/auth/client';

export function Providers({ children }: { children: React.ReactNode }) {
  const router = useRouter();

  return (
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
      {children}
    </NeonAuthUIProvider>
  );
}
