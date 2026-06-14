import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import type { User } from '@thunder-spark/shared';
import { clearSession, loadSession, saveSession } from '@/lib/auth-storage';

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  signIn: (user: User, tokens: { accessToken: string; refreshToken: string; expiresIn: number }) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSession()
      .then((session) => setUser(session?.user ?? null))
      .finally(() => setLoading(false));
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      loading,
      async signIn(nextUser, tokens) {
        await saveSession(nextUser, tokens);
        setUser(nextUser);
      },
      async signOut() {
        await clearSession();
        setUser(null);
      },
    }),
    [user, loading],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
