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

  // 2. Verificar o usuário
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // 3. Definição de Rotas
  const path = request.nextUrl.pathname

  // Rotas de Autenticação (Login, Recuperação de senha, Callback)
  const isAuthRoute = 
    path.startsWith('/login') || 
    path.startsWith('/auth') || 
    path.startsWith('/forgot-password')

  // Rotas Públicas Específicas (Formulários Individuais)
  // Lógica: Permite "/forms/123" mas bloqueia "/forms" (que é a lista administrativa)
  const isPublicFormRoute = path.startsWith('/forms/') && path !== '/forms'

  // 4. Lógica de Proteção
  
  // Se NÃO estiver logado e tentar acessar rota protegida (que não seja auth ou form público)
  if (!user && !isAuthRoute && !isPublicFormRoute) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  // Se ESTIVER logado e tentar acessar login, manda para home
  if (user && path === '/login') {
    return NextResponse.redirect(new URL('/', request.url))
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