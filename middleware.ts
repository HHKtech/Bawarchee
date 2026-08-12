import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import type { Database } from './lib/supabase/types';

function isCatalogApi(pathname: string) {
  return pathname === '/api/catalog' || pathname.startsWith('/api/catalog/');
}

function isProfileApi(pathname: string) {
  return pathname === '/api/profile' || pathname.startsWith('/api/profile/');
}

function isProtectedPath(pathname: string) {
  return (
    pathname.startsWith('/dashboard') ||
    pathname.startsWith('/profile') ||
    (pathname.startsWith('/api') && !isCatalogApi(pathname))
  );
}

function redirectTo(request: NextRequest, path: string) {
  return NextResponse.redirect(new URL(path, request.url));
}

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    return response;
  }

  const supabase = createServerClient<Database>(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet: { name: string; value: string; options: CookieOptions }[]) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
      }
    }
  });

  const pathname = request.nextUrl.pathname;
  const isAuthPage = pathname === '/login' || pathname === '/signup';
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    if (isProtectedPath(pathname)) {
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('next', pathname);
      return NextResponse.redirect(loginUrl);
    }

    return response;
  }

  const { data: profile, error: profileError } = await (supabase
    .from('profiles') as any)
    .select('is_onboarded')
    .eq('id', user.id)
    .maybeSingle();

  // If we can't read the profile at all (table missing, network error, etc.)
  // let the user through rather than looping.
  if (profileError) {
    return response;
  }

  const isOnboarded = profile?.is_onboarded === true;

  if (isOnboarded && isAuthPage) {
    return redirectTo(request, '/dashboard');
  }

  if (isOnboarded && pathname === '/profile/setup') {
    return redirectTo(request, '/dashboard');
  }

  // Only redirect to /profile/setup if the user is NOT already going there
  // and NOT hitting an auth page (avoids infinite loop).
  if (
    !isOnboarded &&
    pathname !== '/profile/setup' &&
    !isProfileApi(pathname) &&
    isProtectedPath(pathname)
  ) {
    return redirectTo(request, '/profile/setup');
  }

  return response;
}

export const config = {
  matcher: [
    '/login',
    '/signup',
    '/dashboard/:path*',
    '/profile/:path*',
    '/api/:path*'
  ]
};
