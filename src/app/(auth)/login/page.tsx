'use client';

import { AuthView } from '@neondatabase/auth-ui';

export default function LoginPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50">
      <div className="w-full max-w-md">
        <AuthView pathname="sign-in" />
        <p className="mt-4 text-center text-sm text-gray-500">
          Access is by invitation only. Contact your administrator for access.
        </p>
      </div>
    </div>
  );
}
