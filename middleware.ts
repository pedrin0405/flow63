import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  // 1. Configuração inicial da resposta e cookies
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
          cookiesToSet.forEach(({ name, value, options }) => request.cookies.set(name, value))
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

  // 2. Verificar a sessão
  const {
    data: { session },
  } = await supabase.auth.getSession()

  const path = request.nextUrl.pathname
  const isAuthRoute = path.startsWith('/login') || path.startsWith('/auth') || path.startsWith('/forgot-password')
  const isPublicFormRoute = path.startsWith('/forms/') && path !== '/forms'

  // 3. Proteção básica de rotas não logadas
  if (!session && !isAuthRoute && !isPublicFormRoute) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  // 4. Lógica de Redirecionamento por Role (Apenas se logado)
  if (session) {
    // Busca a Role (perfil) do usuário no banco
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', session.user.id)
      .single()

    const role = profile?.role
    // Verifica se o usuário pertence à alta gestão/admin
    const isHighLevelUser = ['Diretor', 'Gestor', 'Marketing', 'Secretaria', 'Admin'].includes(role)

    // Se o usuário acessar /login estando logado
    if (path === '/login') {
      if (isHighLevelUser) {
        return NextResponse.redirect(new URL('/', request.url)) // Vai pra Home (Dashboard)
      } else {
        return NextResponse.redirect(new URL('/brokers/my-card', request.url)) // Vai pro Cartão
      }
    }

    // Se for Corretor e tentar acessar a Home (Dashboard)
    if (path === '/' && !isHighLevelUser) {
      return NextResponse.redirect(new URL('/brokers/my-card', request.url))
    }

    // Bloqueio de segurança extra: Se for Corretor, não deixa acessar via URL direta outras páginas
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

    // Se a rota acessada começar com alguma das restritas e não for HighLevelUser
    if (!isHighLevelUser && restrictedRoutes.some(route => path.startsWith(route))) {
      // Exceção do isPublicFormRoute já foi tratada acima para não logados, mas aqui garantimos pros logados
      if (!isPublicFormRoute) {
        return NextResponse.redirect(new URL('/brokers/my-card', request.url))
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