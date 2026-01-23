import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import { getPagePermission, isRoleAllowed } from '@/lib/auth/page-permissions'

export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            request.cookies.set(name, value)
            response.cookies.set(name, value, options)
          })
        },
      },
    }
  )

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const pathname = request.nextUrl.pathname

  // === AUTHENTICATION CHECK ===
  // Redirect to login if not authenticated
  if (
    !user &&
    !pathname.startsWith('/login') &&
    !pathname.startsWith('/register') &&
    !pathname.startsWith('/auth') &&
    pathname !== '/'
  ) {
    const url = request.nextUrl.clone()
    url.pathname = '/auth/login'
    url.searchParams.set('redirect', pathname)
    return NextResponse.redirect(url)
  }

  // === AUTHORIZATION CHECK ===
  // Check role-based access for authenticated users
  if (user && pathname.startsWith('/admin')) {
    try {
      // Get user's organizations and roles
      const { data: memberships, error } = await supabase
        .from('config_organizacion_miembros')
        .select('organization_id, role')
        .eq('user_id', user.id)
        .is('eliminado_en', null)

      if (!error && memberships && memberships.length > 0) {
        // Get page permission requirements
        const pagePermission = getPagePermission(pathname)

        if (pagePermission && pagePermission.roles) {
          // Check if any of the user's roles allow access
          const hasAllowedRole = memberships.some(m =>
            isRoleAllowed(m.role as any, pagePermission.roles)
          )

          if (!hasAllowedRole) {
            // User doesn't have required role - redirect to access denied
            const url = request.nextUrl.clone()
            url.pathname = '/admin/access-denied'
            return NextResponse.redirect(url)
          }
        }
      }
    } catch (error) {
      // If permission check fails, allow access (fail open)
      // Database RLS will still enforce data security
      console.error('Permission check failed:', error)
    }
  }

  return response
}
