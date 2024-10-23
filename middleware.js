// middleware.js
import { NextResponse } from 'next/server';
import supabase from './lib/supabaseClient';

export async function middleware(request) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get('supabase-auth-token')?.value;

  // Rutas públicas
  if (pathname.startsWith('/login') || pathname.startsWith('/api/')) {
    return NextResponse.next();
  }

  // Si no hay token, redirige a login
  if (!token) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // Verifica el token y obtiene el usuario
  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return NextResponse.redirect(new URL('/login', request.url));
    }

    // Obtén el rol del usuario desde la base de datos
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('role')
      .eq('email', user.email)
      .single();

    if (userError || !userData) {
      return NextResponse.redirect(new URL('/login', request.url));
    }

    const userRole = userData.role;

    // Verifica el rol según la ruta
    if (pathname.startsWith('/dashboard') && userRole !== 'admin') {
      return NextResponse.redirect(new URL('/page', request.url));
    }

    if (pathname.startsWith('/jefe') && userRole !== 'admin') {
      return NextResponse.redirect(new URL('/page', request.url));
    }

    if (pathname.startsWith('/trabajador') && userRole !== 'worker' && userRole !== 'admin') {
      return NextResponse.redirect(new URL('/page', request.url));
    }

    return NextResponse.next();

  } catch (error) {
    console.error('Error en el middleware:', error.message);
    return NextResponse.redirect(new URL('/login', request.url));
  }
}

export const config = {
  matcher: ['/dashboard/:path*', '/jefe/:path*', '/trabajador/:path*'],
};
