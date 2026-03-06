import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
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
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const {
    data: { session },
  } = await supabase.auth.getSession()

  const path = request.nextUrl.pathname
  const isAuthRoute = path.startsWith('/login') || path.startsWith('/auth') || path.startsWith('/forgot-password')
  const isPublicFormRoute = path.startsWith('/forms/') && path !== '/forms'

  // Proteção básica de rotas não logadas
  if (!session && !isAuthRoute && !isPublicFormRoute) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  if (session) {
    const isRootRoute = path === '/'
    
    // Lista de rotas proibidas para corretores
    const restrictedRoutes = [
      '/services', 
      '/homes', 
      '/units', 
      '/brokers',
      '/admin', 
      '/indicators', 
      '/forms', 
      '/spreadsheets', 
      '/custom-dashboard', 
      '/chat-support', 
      '/support'
    ]

    const isRestrictedRoute = restrictedRoutes.some(route => path.startsWith(route))

    // Só consulta o banco de dados se for acessar a Home, o Login ou uma Rota Restrita
    // (Isso deixa o sistema mais rápido e evita bugs de Edge Runtime)
    if (isRootRoute || isRestrictedRoute || path === '/login') {
      try {
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', session.user.id)
          .single()

        const role = profile?.role
        const isHighLevelUser = ['Diretor', 'Gestor', 'Marketing', 'Secretária', 'Admin'].includes(role)

        // Lógica para a página de Login
        if (path === '/login') {
          return NextResponse.redirect(new URL(isHighLevelUser ? '/' : '/brokers/my-card', request.url))
        }

        // Lógica de TRAVA para a Home (/) e Rotas Restritas
        if (!isHighLevelUser && (isRootRoute || (isRestrictedRoute && !isPublicFormRoute))) {
          return NextResponse.redirect(new URL('/brokers/my-card', request.url))
        }
      } catch (error) {
        console.error("Erro no middleware:", error)
        // Se a consulta falhar, bloqueia por segurança
        if (isRootRoute || isRestrictedRoute) {
          return NextResponse.redirect(new URL('/brokers/my-card', request.url))
        }
      }
    }
  }

  return response
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public assets (images, etc)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}