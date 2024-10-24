// src/components/AuthProvider.tsx
'use client';

import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import supabase from '../lib/supabaseClient';

interface AuthContextType {
  workerId: string | null;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const router = useRouter();
  const [workerId, setWorkerId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const INACTIVITY_TIMEOUT = 5 * 60 * 1000; // 5 minutos de inactividad

    const resetTimeout = () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      timeoutRef.current = setTimeout(() => {
        handleLogout();
      }, INACTIVITY_TIMEOUT);
    };

    const handleLogout = async () => {
      try {
        const { error } = await supabase.auth.signOut();

        if (error) {
          console.error("Error al cerrar la sesión:", error.message);
          return;
        }

        router.push('/login');
      } catch (error) {
        console.error("Error inesperado al cerrar la sesión:", error);
      }
    };

    const handleActivity = () => {
      resetTimeout();
    };

    const checkSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();

        if (error) {
          console.error("Error al obtener la sesión:", error.message);
          return;
        }

        if (!session) {
          router.push('/login');
        } else {
          setWorkerId(session.user.id);
          setIsLoading(false);
          resetTimeout();
        }
      } catch (err) {
        console.error("Error inesperado al verificar la sesión:", err);
      }
    };

    checkSession();

    window.addEventListener('mousemove', handleActivity);
    window.addEventListener('keydown', handleActivity);

    return () => {
      window.removeEventListener('mousemove', handleActivity);
      window.removeEventListener('keydown', handleActivity);
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [router]);

  return (
    <AuthContext.Provider value={{ workerId, isLoading }}>
      {!isLoading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth debe ser utilizado dentro de un AuthProvider');
  }
  return context;
};
