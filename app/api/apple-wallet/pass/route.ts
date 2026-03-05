import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const cardId = searchParams.get('id')

  if (!cardId) {
    return NextResponse.json({ error: 'ID do cartão não fornecido' }, { status: 400 })
  }

  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch (error) {
            // Se chamado de um Route Handler, o setAll pode falhar dependendo da versão do Next.js
          }
        },
      },
    }
  )

  try {
    // 1. Buscar dados do cartão e do corretor no banco
    const { data: card, error } = await supabase
      .from('benefit_cards')
      .select(`
        *,
        profiles:user_id (full_name, email)
      `)
      .eq('id', cardId)
      .maybeSingle()

    if (error || !card) {
      console.error('Erro ao buscar cartão:', error)
      return NextResponse.json({ error: 'Cartão não encontrado' }, { status: 404 })
    }

    // 2. Estrutura do Pass (PKPass JSON)
    const passData = {
      formatVersion: 1,
      passTypeIdentifier: "pass.com.central63.benefits",
      serialNumber: card.apple_pass_serial,
      teamIdentifier: "ABC123XYZ",
      organizationName: "Central63",
      description: "Cartão de Benefícios Central63",
      logoText: "Central63",
      foregroundColor: "rgb(255, 255, 255)",
      backgroundColor: "rgb(28, 28, 30)",
      generic: {
        primaryFields: [
          {
            key: "member",
            label: "CORRETOR",
            value: card.profiles?.full_name || "Membro"
          }
        ],
        secondaryFields: [
          {
            key: "level",
            label: "NÍVEL",
            value: `Nível ${card.nivel_beneficio}`
          }
        ],
        auxiliaryFields: [
          {
            key: "expires",
            label: "VALIDADE",
            value: new Date(card.data_validade).toLocaleDateString('pt-BR')
          }
        ],
        backFields: [
          {
            key: "info",
            label: "SOBRE O BENEFÍCIO",
            value: "Este cartão concede acesso a benefícios exclusivos da rede Central63."
          }
        ]
      },
      barcode: {
        message: card.id,
        format: "PKBarcodeFormatQR",
        messageEncoding: "iso-8859-1"
      }
    }

    return NextResponse.json({ 
      message: "Estrutura do pass gerada. Para download do .pkpass, configure os certificados Apple (.p12) no servidor.",
      data: passData 
    })

  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Erro interno ao gerar pass' }, { status: 500 })
  }
}
