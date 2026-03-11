import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { PKPass } from 'passkit-generator'
import fs from 'fs'
import path from 'path'

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
            // Silently ignore failures in Route Handlers
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
        profiles:user_id (*)
      `)
      .eq('id', cardId)
      .maybeSingle()

    if (error || !card) {
      console.error('Erro ao buscar cartão:', error)
      return NextResponse.json({ error: 'Cartão não encontrado' }, { status: 404 })
    }

    const userName = card.card_display_name || 
                     (card.profiles?.full_name && card.profiles.full_name !== "Pendente" 
                        ? card.profiles.full_name 
                        : card.profiles?.email?.split('@')[0] || "Membro");

    // 2. Verificar certificados
    const appleWwdr = process.env.APPLE_WWDR_CERTIFICATE; // Base64 encoded
    const appleSignerCert = process.env.APPLE_SIGNER_CERTIFICATE; // Base64 encoded .p12
    const appleSignerPass = process.env.APPLE_SIGNER_PASSWORD;

    if (!appleWwdr || !appleSignerCert) {
      return NextResponse.json({ 
        error: 'Configuração incompleta',
        message: 'Para gerar o cartão Apple Wallet real, é necessário configurar os certificados Apple (WWDR e Signer .p12) como variáveis de ambiente em Base64.',
        instructions: {
          step1: 'Obtenha o certificado WWDR da Apple e o seu certificado de "Pass Type ID" (.p12).',
          step2: 'Converta-os para Base64.',
          step3: 'Adicione as variáveis APPLE_WWDR_CERTIFICATE, APPLE_SIGNER_CERTIFICATE e APPLE_SIGNER_PASSWORD ao seu arquivo .env ou painel da Vercel.'
        },
        debug_data: {
          serialNumber: card.apple_pass_serial,
          userName: userName
        }
      }, { status: 501 })
    }

    // 3. Gerar o Pass
    const wwdrBuffer = Buffer.from(appleWwdr, 'base64');
    const signerBuffer = Buffer.from(appleSignerCert, 'base64');

    const pass = new PKPass({
      model: path.resolve('public/apple-wallet-model'), // Opcional: pasta com imagens base
      certificates: {
        wwdr: wwdrBuffer,
        signerCert: signerBuffer,
        password: appleSignerPass,
      },
    });

    // Configurações básicas
    pass.setStandardKeys({
      formatVersion: 1,
      passTypeIdentifier: process.env.APPLE_PASS_TYPE_ID || "pass.com.central63.benefits",
      serialNumber: card.apple_pass_serial,
      teamIdentifier: process.env.APPLE_TEAM_ID || "ABC123XYZ",
      organizationName: "Central63",
      description: "Cartão de Benefícios Central63",
      logoText: "Central63",
      foregroundColor: "rgb(255, 255, 255)",
      backgroundColor: "rgb(28, 28, 30)",
      labelColor: "rgb(233, 28, 116)", // Cor #e91c74
    });

    // Adicionar imagens se existirem
    try {
      const iconPath = path.resolve('public/apple-icon.png');
      if (fs.existsSync(iconPath)) {
        pass.addBuffer('icon.png', fs.readFileSync(iconPath));
        pass.addBuffer('icon@2x.png', fs.readFileSync(iconPath));
      }
      
      const logoPath = path.resolve('public/logo-horizontal.png');
      if (fs.existsSync(logoPath)) {
        pass.addBuffer('logo.png', fs.readFileSync(logoPath));
      }
    } catch (imgErr) {
      console.warn('Erro ao carregar imagens para o pass:', imgErr);
    }

    // Estrutura de campos
    pass.generic.addPrimaryFields({
      key: "member",
      label: "CORRETOR",
      value: userName
    });

    pass.generic.addSecondaryFields({
      key: "level",
      label: "NÍVEL",
      value: `Nível ${card.nivel_beneficio}`
    });

    pass.generic.addAuxiliaryFields({
      key: "expires",
      label: "VALIDADE",
      value: new Date(card.data_validade).toLocaleDateString('pt-BR')
    });

    pass.generic.addBackFields({
      key: "info",
      label: "SOBRE O BENEFÍCIO",
      value: "Este cartão concede acesso a benefícios exclusivos da rede Central63."
    });

    // Barcode
    pass.setBarcodes({
      message: card.id,
      format: "PKBarcodeFormatQR",
      messageEncoding: "iso-8859-1"
    });

    // Gerar o buffer final
    const buf = pass.getAsBuffer();

    return new NextResponse(buf, {
      headers: {
        'Content-Type': 'application/vnd.apple.pkpass',
        'Content-Disposition': `attachment; filename="central63-benefits.pkpass"`,
      },
    });

  } catch (err) {
    console.error('Erro ao gerar pass:', err)
    return NextResponse.json({ error: 'Erro interno ao gerar pass' }, { status: 500 })
  }
}
