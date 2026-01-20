'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { authClient } from '@/lib/auth/client';
import { Shield, CheckCircle, XCircle, Loader2 } from 'lucide-react';

export default function SetupPage() {
  const router = useRouter();
  const [status, setStatus] = useState<'checking' | 'ready' | 'processing' | 'success' | 'error'>('checking');
  const [message, setMessage] = useState('');
  const [isSignedIn, setIsSignedIn] = useState(false);

  useEffect(() => {
    checkStatus();
  }, []);

  const checkStatus = async () => {
    try {
      // Check if user is signed in
      const session = await authClient.getSession();
      setIsSignedIn(!!session.data?.user);

      // Check if bootstrap is needed
      const response = await fetch('/api/admin/bootstrap', { method: 'GET' });

      // If GET returns 405, we need to try POST
      // For now, just set status to ready if signed in
      if (session.data?.user) {
        setStatus('ready');
        setMessage('You are signed in. Click the button below to become the first admin.');
      } else {
        setStatus('ready');
        setMessage('Please sign in first, then return to this page to complete setup.');
      }
    } catch (error) {
      setStatus('ready');
      setMessage('Ready to set up the first admin user.');
    }
  };

  const handleBootstrap = async () => {
    setStatus('processing');
    try {
      const response = await fetch('/api/admin/bootstrap', {
        method: 'POST',
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to bootstrap admin');
      }

      setStatus('success');
      setMessage('You are now an admin! Redirecting to dashboard...');
      setTimeout(() => router.push('/'), 2000);
    } catch (error) {
      setStatus('error');
      setMessage(error instanceof Error ? error.message : 'Failed to bootstrap admin');
    }
  };

  const handleSignIn = () => {
    router.push('/login');
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50">
      <div className="text-center max-w-md px-4">
        <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-6">
          <Shield className="w-8 h-8 text-primary" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Initial Setup</h1>
        <p className="text-gray-600 mb-6">
          Welcome! This page will help you set up the first administrator account.
        </p>

        {status === 'checking' && (
          <div className="flex items-center justify-center gap-2 text-gray-500">
            <Loader2 className="w-4 h-4 animate-spin" />
            Checking status...
          </div>
        )}

        {status === 'ready' && (
          <div className="space-y-4">
            <p className="text-sm text-gray-500">{message}</p>
            {isSignedIn ? (
              <Button onClick={handleBootstrap} className="w-full">
                <Shield className="mr-2 h-4 w-4" />
                Become Admin
              </Button>
            ) : (
              <Button onClick={handleSignIn} className="w-full">
                Sign In First
              </Button>
            )}
          </div>
        )}

        {status === 'processing' && (
          <div className="flex items-center justify-center gap-2 text-gray-500">
            <Loader2 className="w-4 h-4 animate-spin" />
            Setting up admin account...
          </div>
        )}

        {status === 'success' && (
          <div className="space-y-4">
            <div className="flex items-center justify-center gap-2 text-green-600">
              <CheckCircle className="w-5 h-5" />
              {message}
            </div>
          </div>
        )}

        {status === 'error' && (
          <div className="space-y-4">
            <div className="flex items-center justify-center gap-2 text-red-600">
              <XCircle className="w-5 h-5" />
              {message}
            </div>
            <Button variant="outline" onClick={() => setStatus('ready')}>
              Try Again
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
