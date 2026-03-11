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

  // ATUALIZAÇÃO: getUser() no lugar de getSession() valida o token de verdade
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const path = request.nextUrl.pathname
  const isAuthRoute = path.startsWith('/login') || path.startsWith('/auth') || path.startsWith('/forgot-password')
  const isPublicFormRoute = path.startsWith('/forms/') && path !== '/forms'
  const isPublicBioRoute = path.startsWith('/bio/')

  // Proteção básica de rotas não logadas usando 'user'
  if (!user && !isAuthRoute && !isPublicFormRoute && !isPublicBioRoute) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  if (user) {
    const isRootRoute = path === '/'
    
    // Lista de rotas proibidas para corretores
    const restrictedRoutes = [
      '/services', 
      '/homes', 
      '/units', 
      '/brokers', // Cuidado com essa rota base
      '/admin', 
      '/indicators', 
      '/forms', 
      '/spreadsheets', 
      '/custom-dashboard', 
      '/chat-support', 
      '/support',
      '/campaigns'
    ]

    // CORREÇÃO DO LOOP: Exclui expressamente a rota para a qual você redireciona quem não tem permissão
    const isRestrictedRoute = 
      restrictedRoutes.some(route => path.startsWith(route)) && 
      !path.startsWith('/brokers/my-card')

    if (isRootRoute || isRestrictedRoute || path === '/login' || path === '/auth/pending') {
      try {
        // Criar um cliente admin temporário para checagem de status (bypass RLS)
        const supabaseAdmin = createServerClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
          { cookies: { getAll: () => request.cookies.getAll(), setAll: () => {} } }
        )

        const { data: profile } = await supabaseAdmin
          .from('profiles')
          .select('role, status')
          .eq('id', user.id)
          .maybeSingle()

        // 1. Tratamento para novos usuários ou pendentes
        const isPending = !profile || profile.status === 'pendente'
        const isPendingRoute = path === '/auth/pending'

        if (isPending && !isPendingRoute && !isAuthRoute && !path.startsWith('/auth/callback')) {
          return NextResponse.redirect(new URL('/auth/pending', request.url))
        }

        if (!isPending && isPendingRoute) {
          return NextResponse.redirect(new URL('/', request.url))
        }

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
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}