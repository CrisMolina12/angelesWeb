"use client"; // Hace que el contexto sea un Client Component

import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import supabase from '../../../lib/supabaseClient';

interface AuthContextType {
  workerId: string | null;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
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
        // Intenta cerrar sesión
        const { error } = await supabase.auth.signOut();

        if (error) {
          console.error("Error al cerrar la sesión:", error.message);
          return;
        }

        // Redirige a la página de inicio de sesión después de cerrar sesión
        router.push('/login');
      } catch (error) {
        console.error("Error inesperado al cerrar la sesión:", error);
      }
    };

    const handleActivity = () => {
      resetTimeout(); // Restablece el contador de inactividad en cada actividad
    };

    const checkSession = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        router.push('/login'); // Redirige si no hay sesión
      } else {
        setWorkerId(session.user.id);
        setIsLoading(false);
        resetTimeout(); // Inicia el contador de inactividad al cargar la página
      }
    };

    checkSession();

    // Eventos para detectar actividad del usuario
    window.addEventListener('mousemove', handleActivity);
    window.addEventListener('keydown', handleActivity);

    return () => {
      // Limpia los eventos y el timeout al desmontar el componente
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
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
