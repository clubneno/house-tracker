'use client';

import { authClient } from '@/lib/auth/client';
import { Button } from '@/components/ui/button';
import { ShieldX } from 'lucide-react';

export default function AccessDeniedPage() {
  const handleSignOut = async () => {
    try {
      await authClient.signOut();
    } catch (e) {
      // If sign-out fails, clear cookies manually
      document.cookie.split(";").forEach((c) => {
        document.cookie = c
          .replace(/^ +/, "")
          .replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");
      });
    }
    window.location.href = '/login';
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50">
      <div className="text-center max-w-md px-4">
        <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-6">
          <ShieldX className="w-8 h-8 text-red-600" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h1>
        <p className="text-gray-600 mb-6">
          Your account has not been granted access to this application.
          Please contact your administrator to request access.
        </p>
        <Button onClick={handleSignOut} variant="outline">
          Sign Out
        </Button>
      </div>
    </div>
  );
}
