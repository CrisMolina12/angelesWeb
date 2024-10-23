"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import supabase from '../../../lib/supabaseClient';

export default function ResetPassword() {
  const [password, setPassword] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [message, setMessage] = useState<string>('');
  const router = useRouter();

  useEffect(() => {
    // Extraer el hash de la URL
    const hash = window.location.hash;

    // Asegurarse de que la URL contenga un hash
    if (!hash) {
      setError('No se encontró el token en la URL.');
      return;
    }

    // Crear un objeto URLSearchParams a partir del hash
    const params = new URLSearchParams(hash.replace('#', '?'));

    // Obtener los tokens de acceso y actualización
    const accessToken = params.get('access_token');
    const refreshToken = params.get('refresh_token');

    // Verifica que los tokens estén presentes
    if (!accessToken || !refreshToken) {
      setError('Access token o refresh token no están disponibles.');
      return;
    }

    // Establecer la sesión con los tokens
    supabase.auth.setSession({
      access_token: accessToken,
      refresh_token: refreshToken,
    }).then(({ error }) => {
      if (error) {
        console.error('Error al establecer la sesión:', error);
        setError('No se pudo establecer la sesión.');
      } else {
        console.log('Sesión establecida con éxito');
      }
    }).catch(err => {
      console.error('Error en la promesa:', err);
      setError('Error al intentar establecer la sesión.');
    });
  }, []);

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setMessage('');

    try {
      const { data: { user }, error: sessionError } = await supabase.auth.getUser();

      if (sessionError || !user) {
        throw new Error('No hay sesión activa. Asegúrate de que el token sea válido.');
      }

      const { error: resetError } = await supabase.auth.updateUser({ password });

      if (resetError) {
        throw new Error(resetError.message || 'Error al restablecer la contraseña.');
      }

      setMessage('Contraseña restablecida con éxito.');
      setTimeout(() => {
        router.push('/login'); // Redirige al usuario a la página de inicio de sesión después de 2 segundos
      }, 2000);
    } catch (err: any) {
      console.error('Error al restablecer la contraseña:', err);
      setError(err.message);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
          Restablecer Contraseña
        </h2>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          {message && (
            <div className="mb-4 bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative" role="alert">
              <span className="block sm:inline">{message}</span>
            </div>
          )}
          {error && (
            <div className="mb-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
              <span className="block sm:inline">{error}</span>
            </div>
          )}
          <form className="space-y-6" onSubmit={handleResetPassword}>
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Nueva Contraseña
              </label>
              <div className="mt-1">
                <input
                  id="password"
                  name="password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                />
              </div>
            </div>

            <div>
              <button
                type="submit"
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Restablecer Contraseña
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
