import { useState, useEffect, createContext, useContext, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

// DEV MODE: Skip login and use mock user
const DEV_SKIP_LOGIN = true;

// Mock user for development (bypasses login)
// Using a valid UUID format for Supabase compatibility
const MOCK_DEV_USER = {
  id: '00000000-0000-0000-0000-000000000001',
  email: 'dev@example.com',
  user_metadata: { name: 'Dev User' },
  app_metadata: {},
  aud: 'authenticated',
  created_at: new Date().toISOString(),
} as User;

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signOut: () => Promise<void>;
  setMockUser: (user: any) => void;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  loading: true,
  signOut: async () => {},
  setMockUser: () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  // If DEV_SKIP_LOGIN is true, start with mock user already set
  const [user, setUser] = useState<User | null>(DEV_SKIP_LOGIN ? MOCK_DEV_USER : null);
  const [session, setSession] = useState<Session | null>(DEV_SKIP_LOGIN ? {
    access_token: 'dev-token',
    token_type: 'bearer',
    user: MOCK_DEV_USER,
    expires_in: 3600,
    expires_at: Math.floor(Date.now() / 1000) + 3600,
    refresh_token: 'dev-refresh',
    provider_token: null,
    provider_refresh_token: null,
  } as any : null);
  const [loading, setLoading] = useState(!DEV_SKIP_LOGIN);

  // Allow setting a mock user for development
  const setMockUser = (mockUser: any) => {
    setUser(mockUser);
    setSession({
      access_token: 'dev-token',
      token_type: 'bearer',
      user: mockUser,
      expires_in: 3600,
      expires_at: Math.floor(Date.now() / 1000) + 3600,
      refresh_token: 'dev-refresh',
      provider_token: null,
      provider_refresh_token: null,
    } as any);
    setLoading(false);
  };

  useEffect(() => {
    // Skip auth check in dev mode
    if (DEV_SKIP_LOGIN) {
      return;
    }

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signOut = async () => {
    // In dev mode, just reload to "log back in" with mock user
    if (DEV_SKIP_LOGIN) {
      window.location.reload();
      return;
    }
    setUser(null);
    setSession(null);
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider value={{ user, session, loading, signOut, setMockUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
