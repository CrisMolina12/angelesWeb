import { redirect } from 'next/navigation';

export default function Home() {
  // Redirige automáticamente a /login
  redirect('/login');
  return null; // No se renderiza nada aquí porque se redirige
}
