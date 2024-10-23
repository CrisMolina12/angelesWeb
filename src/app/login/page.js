"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import supabase from '../../../lib/supabaseClient';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isRecoveringPassword, setIsRecoveringPassword] = useState(false);
  const router = useRouter();

  // Verificar si ya hay una sesión activa
  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        const { data: userData, error: roleError } = await supabase
          .from('users')
          .select('role')
          .eq('email', session.user.email)
          .single();

        if (!roleError && userData.role) {
          router.push(userData.role === 'admin' ? '/jefe' : '/trabajador');
        }
      }
    };
    checkSession();
  }, [router]);

  // Manejar inicio de sesión
  const handleLogin = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
      if (signInError) throw new Error('Error de autenticación. Verifica tus credenciales.');

      const { data: userData, error: roleError } = await supabase
        .from('users')
        .select('role')
        .eq('email', email)
        .single();

      if (roleError) throw new Error('No se pudo determinar el rol del usuario.');

      // Almacenar información del usuario en localStorage
      localStorage.setItem('userEmail', email);
      localStorage.setItem('userRole', userData.role);

      // Redirigir según el rol del usuario
      router.push(userData.role === 'admin' ? '/jefe' : '/trabajador');
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Manejar la recuperación de contraseña
  const handlePasswordRecovery = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const response = await fetch('/api/send-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      if (!response.ok) throw new Error('Error al enviar el correo de recuperación.');

      alert('Se ha enviado un correo para restablecer tu contraseña. Revisa tu bandeja de entrada y carpeta de spam.');
      setIsRecoveringPassword(false);
    } catch (err) {
      console.error('Error:', err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-100 to-indigo-100 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <Image
            src="/Imagen1.png"
            alt="Logo de Angeles"
            width={100}
            height={100}
            className="rounded-full border-4 border-white shadow-lg"
          />
        </div>
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
          {isRecoveringPassword ? 'Recuperar Contraseña' : 'Iniciar Sesión'}
        </h2>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow-lg sm:rounded-lg sm:px-10">
          {error && (
            <div className="mb-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
              <span className="block sm:inline">{error}</span>
            </div>
          )}

          {!isRecoveringPassword ? (
            <form className="space-y-6" onSubmit={handleLogin}>
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                  Correo electrónico
                </label>
                <div className="mt-1">
                  <input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-purple-500 focus:border-purple-500 sm:text-sm"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                  Contraseña
                </label>
                <div className="mt-1">
                  <input
                    id="password"
                    name="password"
                    type="password"
                    autoComplete="current-password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-purple-500 focus:border-purple-500 sm:text-sm"
                  />
                </div>
              </div>

              <div>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 disabled:opacity-50 disabled:cursor-not-allowed transition duration-300 ease-in-out"
                >
                  {isLoading ? 'Iniciando sesión...' : 'Iniciar Sesión'}
                </button>
              </div>
            </form>
          ) : (
            <form className="space-y-6" onSubmit={handlePasswordRecovery}>
              <div>
                <label htmlFor="recovery-email" className="block text-sm font-medium text-gray-700">
                  Correo electrónico
                </label>
                <div className="mt-1">
                  <input
                    id="recovery-email"
                    name="recovery-email"
                    type="email"
                    autoComplete="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-purple-500 focus:border-purple-500 sm:text-sm"
                  />
                </div>
              </div>

              <div>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 disabled:opacity-50 disabled:cursor-not-allowed transition duration-300 ease-in-out"
                >
                  {isLoading ? 'Enviando...' : 'Enviar Correo de Recuperación'}
                </button>
              </div>
              <div className="text-center">
                <button
                  type="button"
                  onClick={() => setIsRecoveringPassword(false)}
                  className="text-purple-600 hover:text-purple-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
                >
                  Volver a Iniciar Sesión
                </button>
              </div>
            </form>
          )}

          <div className="mt-6 text-center">
            {!isRecoveringPassword && (
              <button
                type="button"
                onClick={() => setIsRecoveringPassword(true)}
                className="text-purple-600 hover:text-purple-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
              >
                Olvidé mi contraseña
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
