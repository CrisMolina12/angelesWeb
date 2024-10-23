"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import supabase from "../lib/supabaseClient";

interface AuthGuardProps {
  children: React.ReactNode;
}

export default function AuthGuard({ children }: AuthGuardProps) {
  const router = useRouter();

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        // Redirigir a la página de inicio de sesión si no hay sesión activa
        router.push('/login'); // Ajusta esta ruta según tu configuración
      }
    };

    checkAuth();
  }, [router]);

  return <>{children}</>;
}
