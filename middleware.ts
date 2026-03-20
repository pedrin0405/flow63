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
    data: { user },
  } = await supabase.auth.getUser()

  const path = request.nextUrl.pathname
  const isAuthRoute =
    path.startsWith('/login') ||
    path.startsWith('/register') ||
    path.startsWith('/auth') ||
    path.startsWith('/forgot-password')
  const isPublicFormRoute = path.startsWith('/forms/') && path !== '/forms'
  const isPublicBioRoute = path.startsWith('/bio/')

  // 1. Proteção básica: Usuário não logado
  if (!user && !isAuthRoute && !isPublicFormRoute && !isPublicBioRoute) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  // 2. Proteção para usuários Logados
  if (user) {
    const isPendingRoute = path === '/auth/pending'
    const isRootRoute = path === '/'

    try {
      // Cliente admin para checar status sem restrições de RLS
      const supabaseAdmin = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        { 
          cookies: { 
            getAll: () => request.cookies.getAll(), 
            setAll: (cookiesToSet) => {
              cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
            } 
          } 
        }
      )

      const { data: profile } = await supabaseAdmin
        .from('profiles')
        .select('role, status')
        .eq('id', user.id)
        .maybeSingle()

      // A. BLOQUEIO GLOBAL DE PENDENTES (Não acessa nada além de auth e pendência)
      const isPending = !profile || profile.status === 'pendente'

      if (isPending && !isPendingRoute && !isAuthRoute && !path.startsWith('/auth/callback')) {
        return NextResponse.redirect(new URL('/auth/pending', request.url))
      }

      // Se liberado, não pode ficar na página de pendência
      if (!isPending && isPendingRoute) {
        return NextResponse.redirect(new URL('/', request.url))
      }

      // B. REGRAS DE RBAC (Dinâmicas via Banco de Dados)
      const { data: permissions } = await supabaseAdmin
        .from('role_permissions')
        .select('route')
        .eq('role', profile?.role || '')

      const allowedRoutes = permissions?.map(p => p.route) || []
      
      // Rotas que são sempre permitidas se autenticado
      const alwaysAllowed = ['/auth/callback', '/auth/pending', '/login']
      if (alwaysAllowed.some(r => path.startsWith(r))) {
        return response
      }

      // Redireciona logados que tentam ir para o login
      if (path === '/login') {
        const canAccessHome = allowedRoutes.includes('/')
        return NextResponse.redirect(new URL(canAccessHome ? '/' : '/brokers/my-card', request.url))
      }

      // Verifica se a rota atual ou um prefixo dela está permitida
      // Exceção: Rotas de formulários públicos e bio já foram tratadas acima
      const isAllowed = allowedRoutes.some(route => {
        if (route === '/') return path === '/'
        return path.startsWith(route)
      })

      // Se não for permitido e for uma rota que deveria ser protegida
      const restrictedPrefixes = [
        '/services', '/homes', '/units', '/brokers', '/admin', 
        '/indicators', '/forms', '/spreadsheets', '/custom-dashboard', 
        '/chat-support', '/support', '/campaigns', '/editor'
      ]

      const isRestrictedPath = restrictedPrefixes.some(p => path.startsWith(p)) || path === '/'

      if (isRestrictedPath && !isAllowed && !isPublicFormRoute && !isPublicBioRoute) {
        return NextResponse.redirect(new URL('/brokers/my-card', request.url))
      }

    } catch (error) {
      console.error("Erro crítico no middleware:", error)
    }
  }

  return response
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
