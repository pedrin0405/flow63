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
  const isAuthRoute = path.startsWith('/login') || path.startsWith('/auth') || path.startsWith('/forgot-password')
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

      // B. REGRAS DE RBAC (Apenas se já estiver ativo)
      const restrictedRoutes = [
        '/services', '/homes', '/units', '/brokers', '/admin', 
        '/indicators', '/forms', '/spreadsheets', '/custom-dashboard', 
        '/chat-support', '/support', '/campaigns'
      ]

      const isRestrictedRoute = 
        restrictedRoutes.some(route => path.startsWith(route)) && 
        !path.startsWith('/brokers/my-card')

      const role = profile?.role
      const isHighLevelUser = ['Diretor', 'Gestor', 'Marketing', 'Secretária', 'Admin'].includes(role || '')

      // Redireciona logados que tentam ir para o login
      if (path === '/login') {
        return NextResponse.redirect(new URL(isHighLevelUser ? '/' : '/brokers/my-card', request.url))
      }

      // Trava para Home e Rotas Restritas (Corretores vão para my-card)
      if (!isHighLevelUser && (isRootRoute || (isRestrictedRoute && !isPublicFormRoute))) {
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
