/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useCallback, useContext, useState } from 'react';

export type UserRole = 'gerencia' | 'tecnologia';

const CREDENTIALS: Record<UserRole, string> = {
  gerencia: 'Fombisol2026',
  tecnologia: '123456',
};

const STORAGE_KEY = 'vt_auth_role';

interface AuthContextValue {
  role: UserRole | null;
  loading: boolean;
  signIn: (role: UserRole, password: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [role, setRole] = useState<UserRole | null>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved === 'gerencia' || saved === 'tecnologia' ? saved : null;
    } catch { return null; }
  });

  const signIn = useCallback(async (selectedRole: UserRole, password: string): Promise<{ error: Error | null }> => {
    if (password === CREDENTIALS[selectedRole]) {
      localStorage.setItem(STORAGE_KEY, selectedRole);
      setRole(selectedRole);
      return { error: null };
    }
    return { error: new Error('Contraseña incorrecta. Intenta de nuevo.') };
  }, []);

  const signOut = useCallback(async () => {
    localStorage.removeItem(STORAGE_KEY);
    setRole(null);
  }, []);

  return (
    <AuthContext.Provider value={{ role, loading: false, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth debe usarse dentro de AuthProvider');
  return ctx;
}
