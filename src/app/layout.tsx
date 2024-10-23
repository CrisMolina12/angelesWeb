"use client"; // Asegura que este componente sea tratado como un Client Component

import { useEffect } from "react";
import type { Metadata } from "next";
import { getMetadata } from "./metadata";  // Ajusta la ruta si es necesario
import localFont from "next/font/local";
import "./globals.css";
import { useRouter } from "next/navigation";
import supabase from '../../lib/supabaseClient'; // Asegúrate de que la ruta de importación de supabase sea correcta
import InteractiveMenu from '../../components/menu';
// Carga de fuentes locales con configuración específica de peso y variable CSS
const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});

const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});

const metadata: Metadata = getMetadata("Página de Ventas");

// Tiempo de inactividad en milisegundos (ej. 5 minutos = 300000 ms)
const INACTIVITY_TIMEOUT = 300000;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const router = useRouter();

  useEffect(() => {
    let timeoutId: NodeJS.Timeout;

    // Función para cerrar la sesión
    const handleLogout = async () => {
      await supabase.auth.signOut();
      router.push("/login"); // Redirige al usuario a la página de login
    };

    // Función para resetear el timeout de inactividad
    const resetTimeout = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(handleLogout, INACTIVITY_TIMEOUT);
    };

    // Eventos que se consideran actividad del usuario
    window.addEventListener("mousemove", resetTimeout);
    window.addEventListener("keypress", resetTimeout);
    window.addEventListener("scroll", resetTimeout);
    window.addEventListener("click", resetTimeout);

    // Iniciar el timeout cuando el componente se monta
    resetTimeout();

    // Limpiar los eventos y el timeout cuando el componente se desmonta
    return () => {
      clearTimeout(timeoutId);
      window.removeEventListener("mousemove", resetTimeout);
      window.removeEventListener("keypress", resetTimeout);
      window.removeEventListener("scroll", resetTimeout);
      window.removeEventListener("click", resetTimeout);
    };
  }, [router]);

  return (
    <html lang="en">
      <head>
        {/* Puedes agregar más elementos de <head> aquí si lo necesitas */}
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
