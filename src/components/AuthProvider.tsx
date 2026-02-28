'use client';

import { createClient } from '@/lib/supabase/client';
import { useEffect } from 'react';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        supabase.auth.signInAnonymously();
      }
    });
  }, []);
  return <>{children}</>;
}
