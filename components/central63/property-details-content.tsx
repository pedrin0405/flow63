"use client"

import { useState, useEffect } from "react"
import { MapPin, Home, Ruler, DollarSign, Calendar, Star, Loader2, ChevronLeft, ChevronRight, BedDouble, Bath, Car, Landmark, Wallet, ShieldCheck, ArrowRightLeft, Building2, Sparkles, MessageCircle, Mail, Phone } from "lucide-react"
import { Separator } from "@/components/ui/separator"
import { Button } from "@/components/ui/button"
import { supabase } from "@/lib/supabase"
import { useToast } from "@/hooks/use-toast"
import { cn } from "@/lib/utils"

interface PropertyDetailsContentProps {
  property: any
  formatCurrency: (val: number) => string
  onClose?: () => void
  isInline?: boolean
}

export function PropertyDetailsContent({ property, formatCurrency, onClose, isInline = false }: PropertyDetailsContentProps) {
  const { toast } = useToast()
  const [isFeatured, setIsFeatured] = useState(false)
  const [isFeatureLoading, setIsFeatureLoading] = useState(false)
  const [userRole, setUserRole] = useState<string | null>(null)
  const [fullDetails, setFullDetails] = useState<any>(null)
  const [images, setImages] = useState<string[]>([])
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const [captadores, setCaptadores] = useState<any[]>([])
  const [captadoresLoading, setCaptadoresLoading] = useState(false)
  const [captadoresComFoto, setCaptadoresComFoto] = useState<Map<string, { foto: string | null }>>(new Map())

  useEffect(() => {
    const checkRoleAndFeatured = async () => {
      if (!property) return

      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .single()
        setUserRole(profile?.role || null)
      }

      // Verifica se o imóvel já está em destaque
      const { data } = await supabase
        .from('featured_properties')
        .select('*')
        .eq('property_code', property.code)
        .eq('city', property.city || 'Palmas')
        .maybeSingle()
      
      setIsFeatured(!!data)
    }

    checkRoleAndFeatured()
  }, [property])

  useEffect(() => {
    const fetchFullDetails = async () => {
      if (!property) return

      const propertyCode = property.code || property.codigo || property.id
      if (!propertyCode) {
        setFullDetails(null)
        return
      }

      const codeValue = /^\d+$/.test(String(propertyCode)) ? parseInt(String(propertyCode), 10) : propertyCode
      const isAuxCity = String(property.city || "").toLowerCase().includes("aragua")
      const primaryTable = isAuxCity ? "imovel_aux" : "imovel_pmw"
      const fallbackTable = isAuxCity ? "imovel_pmw" : "imovel_aux"

      try {
        const { data: primaryData } = await supabase
          .from(primaryTable)
          .select("*")
          .eq("codigo", codeValue)
          .maybeSingle()

        if (primaryData) {
          setFullDetails(primaryData)
          return
        }

        const { data: fallbackData } = await supabase
          .from(fallbackTable)
          .select("*")
          .eq("codigo", codeValue)
          .maybeSingle()

        setFullDetails(fallbackData || null)
      } catch {
        setFullDetails(null)
      }
    }

    fetchFullDetails()
  }, [property])

  useEffect(() => {
    const fetchPropertyImages = async () => {
      if (!property) return

      const baseImages = [property.image, property.imagem, property.urlfotoprincipal].filter(Boolean)
      const propertyCode = property.code || property.codigo || property.id

      if (!propertyCode) {
        setImages(Array.from(new Set(baseImages)))
        setCurrentImageIndex(0)
        return
      }

      const codeValue = /^\d+$/.test(String(propertyCode)) ? parseInt(String(propertyCode), 10) : propertyCode

      try {
        const [pmwFotosRes, auxFotosRes] = await Promise.all([
          supabase.from('fotos_imoveis_pmw').select('url').eq('imovel_codigo', codeValue),
          supabase.from('fotos_imoveis_aux').select('url').eq('imovel_codigo', codeValue),
        ])

        const extraImages = [
          ...(pmwFotosRes.data?.map((f: any) => f.url) || []),
          ...(auxFotosRes.data?.map((f: any) => f.url) || []),
        ].filter(Boolean)

        const merged = Array.from(new Set([...baseImages, ...extraImages]))
        setImages(merged.length > 0 ? merged : baseImages)
      } catch (error) {
        setImages(Array.from(new Set(baseImages)))
      } finally {
        setCurrentImageIndex(0)
      }
    }

    fetchPropertyImages()
  }, [property])

  useEffect(() => {
    const fetchCaptadores = async () => {
      if (!property) return

      const code = property.code || property.codigo || property.id
      if (!code) {
        setCaptadores([])
        return
      }

      const normalizeText = (value: string) =>
        value
          .normalize('NFD')
          .replace(/[\u0300-\u036f]/g, '')
          .toLowerCase()

      const cityText = normalizeText(String(property.city || ""))
      const isAuxCity = cityText.includes("aragua")
      const tableName = isAuxCity ? "imovel_aux" : "imovel_pmw"

      try {
        setCaptadoresLoading(true)

        // 1. Tentar buscar dados dos captadores já armazenados na tabela
        const { data: imovelData } = await supabase
          .from(tableName)
          .select('captador_Nome, captador_Email, captador_Telefone, captador_Json')
          .eq('codigo', code)
          .maybeSingle()

        if (imovelData?.captador_Json && Array.isArray(imovelData.captador_Json) && imovelData.captador_Json.length > 0) {
          setCaptadores(imovelData.captador_Json)
          return
        }

        // 2. Se não houver dados armazenados, buscar pela API
        const { data: settings, error: settingsError } = await supabase
          .from('company_settings')
          .select('instance_name')
          .neq('instance_name', 'GLOBAL_BROADCAST')
          .order('created_at', { ascending: true })

        if (settingsError || !settings || settings.length === 0) {
          setCaptadores([])
          return
        }

        const preferredKeywords = isAuxCity ? ['aux', 'aragua'] : ['pmw', 'palmas']
        const matchedInstance = settings.find((item: any) => {
          const normalized = normalizeText(String(item.instance_name || ''))
          return preferredKeywords.some((keyword) => normalized.includes(keyword))
        })

        const instanceName = matchedInstance?.instance_name || settings[0].instance_name

        const response = await fetch('/api/imoview/indicators', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'getCaptadores',
            instanceName,
            codigoImovel: code,
          }),
        })

        if (!response.ok) {
          setCaptadores([])
          return
        }

        const result = await response.json()
        const list = Array.isArray(result)
          ? result
          : Array.isArray(result?.data)
            ? result.data
            : Array.isArray(result?.body)
              ? result.body
              : result
                ? [result]
                : []

        setCaptadores(list)

        // 3. Armazenar dados na tabela para futuras consultas (cache)
        if (list.length > 0) {
          const nomes = list.map((item: any) => 
            item.nome || item.Nome || item.captador || item.Captador || item.corretor || item.Corretor || item.usuario || item.Usuario || ""
          ).filter(Boolean)

          const emails = list.map((item: any) =>
            item.email || item.Email || item.eMail || item.corretorEmail || item.CorretorEmail || item.usuarioEmail || item.UsuarioEmail || ""
          ).filter(Boolean)

          const telefones = list.map((item: any) =>
            item.telefone || item.Telefone || item.celular || item.Celular || item.numero || item.Numero || item.fone || item.Fone || ""
          ).filter(Boolean)

          await supabase
            .from(tableName)
            .update({
              captador_Nome: nomes.length > 0 ? nomes : null,
              captador_Email: emails.length > 0 ? emails : null,
              captador_Telefone: telefones.length > 0 ? telefones : null,
              captador_Json: list,
              updated_at: new Date().toISOString(),
            })
            .eq('codigo', code)
            .maybeSingle()
        }
      } catch (error) {
        console.error("Erro ao carregar captadores do imóvel:", error)
        setCaptadores([])
      } finally {
        setCaptadoresLoading(false)
      }
    }

    fetchCaptadores()
  }, [property])

  useEffect(() => {
    const fetchFotosCaptadores = async () => {
      if (captadores.length === 0) {
        setCaptadoresComFoto(new Map())
        return
      }

      try {
        const fotoMap = new Map<string, { foto: string | null }>()

        for (const captador of captadores) {
          const nome = captadorLabel(captador)
          if (!nome) continue

          const { data: corretor } = await supabase
            .from('todos_corretores')
            .select('imagem_url')
            .ilike('nome', `%${nome}%`)
            .maybeSingle()

          const foto = corretor?.imagem_url || null
          fotoMap.set(nome, { foto })
        }

        setCaptadoresComFoto(fotoMap)
      } catch (error) {
        console.error("Erro ao carregar fotos dos corretores:", error)
        setCaptadoresComFoto(new Map())
      }
    }

    fetchFotosCaptadores()
  }, [captadores])

  const nextImage = () => {
    if (currentImageIndex < images.length - 1) setCurrentImageIndex((prev) => prev + 1)
  }

  const prevImage = () => {
    if (currentImageIndex > 0) setCurrentImageIndex((prev) => prev - 1)
  }

  const toggleFeatured = async () => {
    setIsFeatureLoading(true)
    try {
      if (isFeatured) {
        const { error } = await supabase
          .from('featured_properties')
          .delete()
          .eq('property_code', property.code)
          .eq('city', property.city || 'Palmas')
        
        if (error) throw error
        setIsFeatured(false)
        toast({ title: "Removido", description: "Imóvel removido dos destaques." })
      } else {
        const { error } = await supabase
          .from('featured_properties')
          .insert({
            property_code: property.code,
            city: property.city || 'Palmas'
          })
        
        if (error) throw error
        setIsFeatured(true)
        toast({ title: "Destaque", description: "Imóvel adicionado aos destaques com sucesso!" })
      }
    } catch (error: any) {
      console.error("Erro ao gerenciar destaque:", error)
      toast({ title: "Erro", description: "Falha ao processar o destaque.", variant: "destructive" })
    } finally {
      setIsFeatureLoading(false)
    }
  }

  if (!property) return null

  const canManageFeatured = ['Diretor', 'Gestor', 'Admin'].includes(userRole || '')
  const details = fullDetails || {}

  const pick = (...values: any[]) => {
    for (const value of values) {
      if (value !== null && value !== undefined && String(value).trim() !== "") return value
    }
    return null
  }

  const propertyCode = pick(details.codigo, property.code, property.codigo, property.id, "N/A")

  const fullAddress = [
    pick(details.endereco, property.address),
    details.numero ? `Nº ${details.numero}` : null,
    details.complemento,
    details.bloco ? `Bloco ${details.bloco}` : null,
    details.edificio,
  ].filter(Boolean).join(", ")

  const featureList = [
    { label: "Piscina", active: details.possui_piscina },
    { label: "Churrasqueira", active: details.possui_churrasqueira },
    { label: "Ar-condicionado", active: details.possui_ar_condicionado },
    { label: "Quintal", active: details.possui_quintal },
    { label: "Mobiliado", active: details.esta_mobiliado },
    { label: "Varanda gourmet", active: details.possui_varanda_gourmet },
  ].filter((item) => !!item.active)

  const detailCards = [
    { icon: Ruler, label: "Área principal", value: pick(details.areaprincipal, property.area) ? `${pick(details.areaprincipal, property.area)} m²` : "N/A" },
    { icon: Landmark, label: "Área lote", value: details.area_lote ? `${details.area_lote} m²` : "N/A" },
    { icon: Sparkles, label: "Área externa", value: details.area_externa ? `${details.area_externa} m²` : "N/A" },
    { icon: BedDouble, label: "Quartos", value: pick(details.numeroquartos, "N/A") },
    { icon: Bath, label: "Banheiros", value: pick(details.numerobanhos, "N/A") },
    { icon: Car, label: "Vagas", value: pick(details.numerovagas, "N/A") },
  ]

  const captadorLabel = (captador: any) =>
    pick(
      captador?.nome,
      captador?.Nome,
      captador?.captador,
      captador?.Captador,
      captador?.corretor,
      captador?.Corretor,
      captador?.usuario,
      captador?.Usuario,
      captador?.descricao,
      captador?.Descricao
    )

  const captadorEmail = (captador: any) =>
    pick(
      captador?.email,
      captador?.Email,
      captador?.eMail,
      captador?.corretorEmail,
      captador?.CorretorEmail,
      captador?.usuarioEmail,
      captador?.UsuarioEmail
    )

  const captadorTelefone = (captador: any) =>
    pick(
      captador?.telefone,
      captador?.Telefone,
      captador?.celular,
      captador?.Celular,
      captador?.numero,
      captador?.Numero,
      captador?.fone,
      captador?.Fone,
      captador?.telefone1,
      captador?.Telefone1,
      captador?.telefone2,
      captador?.Telefone2,
      captador?.corretorTelefone,
      captador?.CorretorTelefone,
      captador?.usuarioTelefone,
      captador?.UsuarioTelefone
    )

  const normalizePhoneForWhatsapp = (phone: string | null) => {
    if (!phone) return null

    const digits = String(phone).replace(/\D/g, "")
    if (!digits) return null

    if (digits.length === 10 || digits.length === 11) return `55${digits}`
    if (digits.length >= 12 && digits.startsWith("55")) return digits
    return digits
  }

  const buildCaptadorMessage = () => {
    const tipo = pick(details.tipo, property.type, "Imóvel")
    const valor = pick(details.valor, details.valor_venda)
    const valorTexto = valor ? String(valor) : formatCurrency(property.value || 0)
    const endereco = fullAddress || property.address || "Endereço não informado"
    const bairro = pick(details.bairro, property.neighborhood, "Não informado")
    const cidade = pick(details.cidade, property.city, "Não informada")
    const situacao = pick(details.situacao, property.status, "Não informada")

    return [
      "Olá! Tudo bem?",
      "",
      "Estou consultando este imóvel e gostaria de mais informações:",
      `• Código: ${propertyCode}`,
      `• Tipo: ${tipo}`,
      `• Valor: ${valorTexto}`,
      `• Endereço: ${endereco}`,
      `• Bairro/Cidade: ${bairro} - ${cidade}`,
      `• Situação: ${situacao}`,
      "",
      "Pode me ajudar, por favor?"
    ].join("\n")
  }

  const handleContactCaptador = (captador: any) => {
    const phoneRaw = captadorTelefone(captador)
    const phone = normalizePhoneForWhatsapp(phoneRaw)

    if (!phone) {
      toast({
        title: "Número indisponível",
        description: "Este captador não possui número válido para contato.",
        variant: "destructive"
      })
      return
    }

    const message = buildCaptadorMessage()
    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(message)}`, "_blank")
  }

  const getInitials = (name: string) =>
    name
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join("") || "CP"

  return (
    <div className="flex flex-col h-full bg-card">
      <div className="flex-1 overflow-y-auto">
        <div className="flex flex-col">
          {/* Imagem de Capa */}
          <div className="relative h-72 w-full bg-muted shrink-0">
            <div
              className="flex h-full w-full transition-transform duration-500 ease-out"
              style={{ transform: `translateX(-${currentImageIndex * 100}%)` }}
            >
              {(images.length > 0 ? images : [property.image]).filter(Boolean).map((src, index) => (
                <div key={index} className="w-full h-full flex-shrink-0">
                  <img
                    src={src}
                    alt={`Foto ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                </div>
              ))}
            </div>
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

            {images.length > 0 && (
              <div className="absolute top-4 left-4 px-3 py-1.5 rounded-full bg-black/50 backdrop-blur-md text-white text-[11px] font-black z-10 border border-white/10">
                {currentImageIndex + 1} / {images.length}
              </div>
            )}

            {images.length > 1 && (
              <>
                <button
                  onClick={(e) => { e.stopPropagation(); prevImage() }}
                  disabled={currentImageIndex === 0}
                  className="absolute left-4 top-1/2 -translate-y-1/2 p-2.5 rounded-full bg-white/10 hover:bg-white/20 text-white backdrop-blur-md transition-all z-20 disabled:opacity-40"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); nextImage() }}
                  disabled={currentImageIndex === images.length - 1}
                  className="absolute right-4 top-1/2 -translate-y-1/2 p-2.5 rounded-full bg-white/10 hover:bg-white/20 text-white backdrop-blur-md transition-all z-20 disabled:opacity-40"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>

                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 z-10">
                  {images.map((_, idx) => (
                    <button
                      key={idx}
                      onClick={(e) => { e.stopPropagation(); setCurrentImageIndex(idx) }}
                      className={cn(
                        "h-1.5 rounded-full transition-all duration-300",
                        idx === currentImageIndex ? "w-6 bg-white" : "w-1.5 bg-white/40 hover:bg-white/70"
                      )}
                      aria-label={`Ir para foto ${idx + 1}`}
                    />
                  ))}
                </div>
              </>
            )}

            <div className="absolute top-4 right-4 flex gap-2">
                {canManageFeatured && (
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={toggleFeatured}
                        disabled={isFeatureLoading}
                        className={cn(
                            "h-9 w-9 rounded-xl backdrop-blur-lg border transition-all duration-300 group/star",
                            isFeatured 
                              ? "bg-amber-500/85 border-amber-300/70 text-white shadow-[0_0_10px_rgba(245,158,11,0.25)]" 
                              : "bg-black/35 border-white/20 text-white/70 hover:bg-black/50"
                        )}
                        title={isFeatured ? "Remover dos Destaques" : "Adicionar aos Destaques"}
                    >
                        {isFeatureLoading ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Star className={cn(
                            "h-4 w-4 transition-transform duration-300", 
                            isFeatured ? "fill-white" : "group-hover/star:scale-110"
                          )} />
                        )}
                    </Button>
                )}
            </div>
            <div className="absolute bottom-6 left-6 right-6">
              <div className="flex flex-wrap gap-2 mb-2">
                <Badge className="bg-primary text-white border-none">{property.type}</Badge>
                <Badge className="bg-white/20 text-white border border-white/30">Código: {propertyCode}</Badge>
              </div>
              <h2 className="text-white text-3xl font-black tracking-tight drop-shadow-md">
                {pick(details.valor, details.valor_venda) || formatCurrency(property.value)}
              </h2>
              <p className="text-white/90 text-sm font-medium flex items-center gap-1">
                <MapPin size={14} className="text-primary-foreground" /> {fullAddress || property.address}
              </p>
            </div>
          </div>

          <div className="p-6 space-y-8">
            {/* Grid de Informações Rápidas */}
            <div className="grid grid-cols-2 gap-4">
              {detailCards.map((item, idx) => (
                <div key={idx} className="p-4 rounded-2xl border bg-muted/30 space-y-1">
                  <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                    <item.icon size={12} className="text-primary" /> {item.label}
                  </span>
                  <p className="text-lg font-bold">{item.value}</p>
                </div>
              ))}

              <div className="p-4 rounded-2xl border bg-muted/30 space-y-1 col-span-2">
                <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                  <MapPin size={12} className="text-primary"/> Localização
                </span>
                <p className="font-bold text-sm">{pick(details.cidade, property.city)} - {pick(details.estado, property.state)}</p>
                <p className="text-xs text-muted-foreground font-medium">{pick(details.bairro, property.neighborhood)}</p>
                {details.cep && <p className="text-xs text-muted-foreground font-medium">CEP: {details.cep}</p>}
              </div>
            </div>

            <Separator className="opacity-50" />

            <div className="space-y-4">
              <h3 className="text-xs font-black uppercase tracking-[0.2em] text-muted-foreground flex items-center gap-2">
                <DollarSign size={14} className="text-primary" /> Captação
              </h3>
              <div className="rounded-2xl border bg-gradient-to-br from-primary/[0.06] via-background to-emerald-500/[0.05] p-4 sm:p-5 shadow-sm">
                <div className="flex items-center justify-between gap-3 mb-3">
                  <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Dados do Captador</p>
                  {!captadoresLoading && captadores.length > 0 && (
                    <span className="text-[10px] px-2.5 py-1 rounded-full border bg-background/80 font-black uppercase tracking-wider text-foreground/80">
                      {captadores.length} {captadores.length > 1 ? "contatos" : "contato"}
                    </span>
                  )}
                </div>
                {captadoresLoading ? (
                  <div className="rounded-xl border bg-background/70 p-4">
                    <p className="text-sm font-bold">Carregando captador...</p>
                    <p className="text-xs text-muted-foreground mt-1">Buscando os dados de contato da captação.</p>
                  </div>
                ) : captadores.length > 0 ? (
                  <div className="mt-3 grid grid-cols-1 gap-3">
                    {captadores.map((item, index) => {
                      const nome = captadorLabel(item) || "Captador não informado"
                      const email = captadorEmail(item) || "Email não informado"
                      const telefone = captadorTelefone(item) || "Número não informado"
                      const hasValidPhone = !!normalizePhoneForWhatsapp(captadorTelefone(item))

                      return (
                        <div key={index} className="rounded-xl border bg-background/85 backdrop-blur-sm p-3 sm:p-4">
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex items-start gap-3 min-w-0">
                              <div className="h-10 w-10 shrink-0 rounded-full bg-primary/15 text-primary flex items-center justify-center text-xs font-black tracking-wider border-2 border-primary/20 overflow-hidden">
                                {captadoresComFoto.get(nome)?.foto ? (
                                  <img
                                    src={captadoresComFoto.get(nome)?.foto as string}
                                    alt={nome}
                                    className="h-full w-full object-cover"
                                  />
                                ) : (
                                  getInitials(nome)
                                )}
                              </div>
                              <div className="min-w-0">
                                <p className="text-sm font-black leading-tight truncate">{nome}</p>
                                <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold mt-1">Captador responsável</p>
                              </div>
                            </div>
                          </div>

                          <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2">
                            <div className="rounded-lg border bg-muted/30 px-2.5 py-2">
                              <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-black flex items-center gap-1">
                                <Mail size={11} className="text-primary" /> Email
                              </p>
                              <p className="text-xs font-semibold mt-1 break-all">{email}</p>
                            </div>
                            <div className="rounded-lg border bg-muted/30 px-2.5 py-2">
                              <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-black flex items-center gap-1">
                                <Phone size={11} className="text-primary" /> Número
                              </p>
                              <p className="text-xs font-semibold mt-1">{telefone}</p>
                            </div>
                          </div>

                          <Button
                            type="button"
                            size="sm"
                            onClick={() => handleContactCaptador(item)}
                            disabled={!hasValidPhone}
                            className="mt-3 h-8 rounded-lg text-[10px] font-black uppercase tracking-widest w-full sm:w-auto"
                          >
                            <MessageCircle size={12} className="mr-1.5" /> Enviar Mensagem
                          </Button>
                        </div>
                      )
                    })}
                  </div>
                ) : (
                  <div className="rounded-xl border border-dashed bg-background/70 p-4">
                    <p className="text-sm font-bold">Captador não informado</p>
                    <p className="text-xs text-muted-foreground mt-1">Não encontramos dados de captação para este imóvel.</p>
                  </div>
                )}
              </div>
            </div>

            <Separator className="opacity-50" />

            <div className="space-y-4">
              <h3 className="text-xs font-black uppercase tracking-[0.2em] text-muted-foreground flex items-center gap-2">
                <Wallet size={14} className="text-primary" /> Financeiro e Negociação
              </h3>
              <div className="grid grid-cols-2 gap-3">
                <div className="p-4 rounded-2xl border bg-muted/30">
                  <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2"><DollarSign size={12} className="text-primary" /> Valor m²</p>
                  <p className="text-sm font-black mt-1">{pick(details.valor_m2, property.pricePerM2) ? `${pick(details.valor_m2, property.pricePerM2)}` : "N/A"}</p>
                </div>
                <div className="p-4 rounded-2xl border bg-muted/30">
                  <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2"><Building2 size={12} className="text-primary" /> Condomínio</p>
                  <p className="text-sm font-black mt-1">{pick(details.valorcondominio, "N/A")}</p>
                </div>
                <div className="p-4 rounded-2xl border bg-muted/30">
                  <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2"><Landmark size={12} className="text-primary" /> IPTU</p>
                  <p className="text-sm font-black mt-1">{pick(details.valoriptu, "N/A")}</p>
                </div>
                <div className="p-4 rounded-2xl border bg-muted/30">
                  <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2"><ArrowRightLeft size={12} className="text-primary" /> Permuta</p>
                  <p className="text-sm font-black mt-1">{details.aceita_permuta ? "Aceita" : "Nao informado"}</p>
                </div>
                <div className="p-4 rounded-2xl border bg-muted/30 col-span-2">
                  <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2"><ShieldCheck size={12} className="text-primary" /> Financiamento</p>
                  <p className="text-sm font-black mt-1">{details.aceita_financiamento ? "Aceita financiamento" : "Nao informado"}</p>
                </div>
              </div>
            </div>

            <Separator className="opacity-50" />

            {featureList.length > 0 && (
              <div className="space-y-4">
                <h3 className="text-xs font-black uppercase tracking-[0.2em] text-muted-foreground flex items-center gap-2">
                  <Sparkles size={14} className="text-primary" /> Infraestrutura e Diferenciais
                </h3>
                <div className="flex flex-wrap gap-2">
                  {featureList.map((item) => (
                    <span key={item.label} className="px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border bg-primary/10 text-primary border-primary/20">
                      {item.label}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <Separator className="opacity-50" />

            {/* Descrição */}
            <div className="space-y-4">
              <h3 className="text-xs font-black uppercase tracking-[0.2em] text-muted-foreground flex items-center gap-2">
                <Home size={14} className="text-primary" /> Sobre o Imóvel
              </h3>
              <div className="text-[15px] text-foreground/80 leading-relaxed whitespace-pre-wrap font-medium">
                {pick(details.descricao, property.description) || "Nenhuma descrição detalhada disponível para este imóvel."}
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                <div className="rounded-xl border bg-muted/30 p-3">
                  <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Finalidade</p>
                  <p className="text-sm font-bold mt-1">{pick(details.finalidade, "N/A")}</p>
                </div>
                <div className="rounded-xl border bg-muted/30 p-3">
                  <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Situação</p>
                  <p className="text-sm font-bold mt-1">{pick(details.situacao, property.status, "N/A")}</p>
                </div>
                <div className="rounded-xl border bg-muted/30 p-3 sm:col-span-2">
                  <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Endereço completo</p>
                  <p className="text-sm font-bold mt-1">{fullAddress || "N/A"}</p>
                </div>
              </div>
            </div>
            
            <Separator className="opacity-50" />
            
            <div className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center justify-between bg-muted/20 p-4 rounded-xl">
              <span className="flex items-center gap-2"><Calendar size={12} className="text-primary"/> Cadastrado em:</span>
              <span>{new Date(pick(details.created_at, property.createdAt)).toLocaleDateString('pt-BR')}</span>
            </div>
          </div>
        </div>
      </div>

      {onClose && (
        <div className="p-6 border-t bg-card shrink-0 shadow-[0_-4px_20px_rgba(0,0,0,0.05)]">
          <Button className="w-full h-12 rounded-xl font-black uppercase tracking-widest text-[10px] shadow-lg shadow-primary/20" onClick={onClose}>
            Fechar Detalhes
          </Button>
        </div>
      )}
    </div>
  )
}

function Badge({ children, className }: any) {
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-black uppercase tracking-widest ${className}`}>
      {children}
    </span>
  )
}
