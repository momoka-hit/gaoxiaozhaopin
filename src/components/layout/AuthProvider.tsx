'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import Navbar from './Navbar';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [loading, setLoading] = useState(true);
  const [authed, setAuthed] = useState(false);
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      setAuthed(!!user);
      setLoading(false);
      if (!user && !pathname.startsWith('/login') && !pathname.startsWith('/register')) {
        router.push('/login');
      }
    });
  }, [pathname]);

  const isAuthPage = pathname.startsWith('/login') || pathname.startsWith('/register');

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-[var(--primary)] border-t-transparent" />
      </div>
    );
  }

  if (isAuthPage) {
    return <>{children}</>;
  }

  if (!authed) {
    return null;
  }

  return (
    <>
      <Navbar />
      <main className="flex-1">{children}</main>
    </>
  );
}
