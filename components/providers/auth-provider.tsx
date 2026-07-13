'use client';

import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase/client';
import type { Company } from '@/lib/types/database';

type AuthContextValue = {
  session: Session | null;
  user: User | null;
  company: Company | null;
  loading: boolean;
  signOut: () => Promise<void>;
  refreshCompany: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue>({
  session: null,
  user: null,
  company: null,
  loading: true,
  signOut: async () => {},
  refreshCompany: async () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [company, setCompany] = useState<Company | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchCompany = useCallback(async (uid: string) => {
    const { data } = await supabase
      .from('companies')
      .select('*')
      .eq('user_id', uid)
      .is('deleted_at', null)
      .maybeSingle();
    setCompany((data as Company | null) ?? null);
  }, []);

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchCompany(session.user.id).finally(() => setLoading(false));
      } else {
        setLoading(false);
      }
    });

    // Listen for auth changes — wrap async in IIFE to avoid deadlock
    const { data: listener } = supabase.auth.onAuthStateChange((_event, newSession) => {
      (async () => {
        setSession(newSession);
        setUser(newSession?.user ?? null);
        if (newSession?.user) {
          await fetchCompany(newSession.user.id);
        } else {
          setCompany(null);
        }
        setLoading(false);
      })();
    });

    return () => {
      listener.subscription.unsubscribe();
    };
  }, [fetchCompany]);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    setSession(null);
    setUser(null);
    setCompany(null);
  }, []);

  const refreshCompany = useCallback(async () => {
    if (user) await fetchCompany(user.id);
  }, [user, fetchCompany]);

  return (
    <AuthContext.Provider value={{ session, user, company, loading, signOut, refreshCompany }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
