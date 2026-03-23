"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Star, MapPin, ChevronRight, Sparkles } from "lucide-react"
import { supabase } from "@/lib/supabase"

interface FeaturedPropertiesTickerProps {
  onPropertyClick: (property: any) => void
  formatCurrency: (val: number) => string
}

export function FeaturedPropertiesTicker({ onPropertyClick, formatCurrency }: FeaturedPropertiesTickerProps) {
  const [featuredProperties, setFeaturedProperties] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchFeatured = async () => {
      setIsLoading(true)
      try {
        const { data: featuredRefs, error: refsError } = await supabase
          .from('featured_properties')
          .select('property_code, city')
          .order('created_at', { ascending: false })

        if (refsError) throw refsError
        if (!featuredRefs || featuredRefs.length === 0) {
          setFeaturedProperties([])
          return
        }

        // Busca os detalhes de cada imóvel (agrupando por cidade para otimizar)
        const pmwCodes = featuredRefs.filter(r => r.city?.toLowerCase() === 'palmas').map(r => r.property_code)
        const auxCodes = featuredRefs.filter(r => r.city?.toLowerCase() === 'araguaina').map(r => r.property_code)

        let allDetails: any[] = []

        if (pmwCodes.length > 0) {
          const { data: pmwDetails } = await supabase
            .from('imovel_pmw')
            .select('*')
            .in('codigo', pmwCodes)
          
          if (pmwDetails) {
            allDetails = [...allDetails, ...pmwDetails.map(item => mapProperty(item, 'Palmas'))]
          }
        }

        if (auxCodes.length > 0) {
          const { data: auxDetails } = await supabase
            .from('imovel_aux')
            .select('*')
            .in('codigo', auxCodes)
          
          if (auxDetails) {
            allDetails = [...allDetails, ...auxDetails.map(item => mapProperty(item, 'Araguaina'))]
          }
        }

        setFeaturedProperties(allDetails)
      } catch (error: any) {
        console.error("Erro ao buscar imóveis em destaque:", error?.message || error)
        if (error?.code === '42P01' || error?.code === 'PGRST205') {
          console.warn("Tabela 'featured_properties' não encontrada. Verifique se o SQL foi executado.")
        }
      } finally {
        setIsLoading(false)
      }
    }

    fetchFeatured()

    // Realtime update
    const channel = supabase
      .channel('featured_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'featured_properties' }, () => {
        fetchFeatured()
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  const mapProperty = (item: any, city: string) => ({
    code: item.codigo || "S/C",
    image: item.urlfotoprincipal || "https://app.imoview.com.br//Front/img/house1.png",
    value: normalizeCurrency(item.valor),
    address: item.endereco || "Endereço não informado",
    neighborhood: item.bairro || "Bairro não inf.",
    city: item.cidade || city,
    state: item.estado,
    status: item.situacao || "Indefinido",
    area: item.areaprincipal,
    pricePerM2: item.valor_m2,
    description: item.descricao,
    type: item.tipo || "Imóvel",
    createdAt: item.created_at,
    latitude: item.latitude ? parseFloat(item.latitude) : null,
    longitude: item.longitude ? parseFloat(item.longitude) : null
  })

  const normalizeCurrency = (value: any): number => {
    if (!value) return 0;
    if (typeof value === 'number') return value;
    try {
      let str = value.toString().replace(/[^\d,.-]/g, '');
      if (str.includes(',')) {
        str = str.replace(/\./g, '').replace(',', '.');
      }
      const parsed = parseFloat(str);
      return isNaN(parsed) ? 0 : parsed;
    } catch (e) { return 0; }
  }

  const formatArea = (value: any) => {
    const parsed = typeof value === "number" ? value : parseFloat(String(value || 0).replace(",", "."))
    if (!parsed || Number.isNaN(parsed)) return "Area n/d"
    return `${parsed.toLocaleString("pt-BR", { maximumFractionDigits: 0 })} m2`
  }

  if (isLoading || featuredProperties.length === 0) return null

  // Duplicamos a lista para criar o efeito infinito
  const tickerItems = [...featuredProperties, ...featuredProperties, ...featuredProperties]
  const tickerDistance = Math.max(1000, featuredProperties.length * 330)
  const tickerDuration = Math.max(20, featuredProperties.length * 4)

  return (
    <div className="relative overflow-hidden rounded-[1.8rem] border border-white/35 dark:border-white/[0.08] bg-gradient-to-br from-white/70 via-white/45 to-white/30 dark:from-white/[0.05] dark:via-white/[0.03] dark:to-white/[0.01] backdrop-blur-2xl shadow-[0_20px_50px_rgba(15,23,42,0.08)]">
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/80 dark:via-white/20 to-transparent" />
      <div className="pointer-events-none absolute -top-20 right-8 h-32 w-32 rounded-full bg-amber-400/20 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-20 left-12 h-28 w-28 rounded-full bg-sky-400/15 blur-3xl" />

      <div className="px-5 pt-4 pb-3 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 min-w-0">
          <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center shadow-lg shadow-amber-500/20 shrink-0">
            <Star className="text-white h-4 w-4 fill-white" />
          </div>
          <div className="min-w-0">
            <h4 className="text-[11px] font-black uppercase tracking-[0.2em] text-foreground truncate">Destaques Premium</h4>
            <p className="text-[10px] font-bold text-muted-foreground/60 truncate">Imoveis em alta na vitrine comercial</p>
          </div>
        </div>

        <div className="hidden sm:flex items-center gap-2 shrink-0">
          <div className="h-7 px-3 rounded-full border border-primary/20 bg-primary/10 flex items-center gap-1.5">
            <Sparkles size={11} className="text-primary" />
            <span className="text-[9px] font-black uppercase tracking-widest text-primary">Curadoria</span>
          </div>
          <div className="h-7 px-3 rounded-full border border-black/[0.08] dark:border-white/[0.08] bg-black/[0.03] dark:bg-white/[0.04]">
            <span className="text-[9px] leading-7 font-black uppercase tracking-widest text-foreground/70">{featuredProperties.length} ativos</span>
          </div>
        </div>
      </div>

      <div className="relative py-3 overflow-hidden">
        <div className="absolute left-0 top-0 bottom-0 w-20 bg-gradient-to-r from-white dark:from-zinc-900 to-transparent z-10" />
        <div className="absolute right-0 top-0 bottom-0 w-20 bg-gradient-to-l from-white dark:from-zinc-900 to-transparent z-10" />

        <motion.div 
          className="flex gap-4 px-4"
        animate={{
            x: [0, -tickerDistance],
        }}
        transition={{
          x: {
            repeat: Infinity,
            repeatType: "loop",
              duration: tickerDuration,
            ease: "linear",
          },
        }}
        style={{ width: "fit-content" }}
      >
        {tickerItems.map((prop, idx) => (
          <button
            key={`${prop.code}-${idx}`}
            onClick={() => onPropertyClick(prop)}
              className="relative flex items-center gap-3 bg-white/85 dark:bg-white/[0.05] backdrop-blur-xl border border-white/40 dark:border-white/[0.09] rounded-[1.35rem] py-2.5 pl-2.5 pr-4 hover:bg-white dark:hover:bg-white/[0.08] hover:border-primary/35 hover:-translate-y-0.5 transition-all duration-300 group/item whitespace-nowrap shadow-[0_10px_30px_rgba(15,23,42,0.08)] min-w-[390px]"
          >
              <div className="h-[72px] w-[112px] rounded-[0.95rem] overflow-hidden shrink-0 border border-white/50 dark:border-white/[0.1] shadow-md relative">
                <img src={prop.image} alt="Imóvel em destaque" className="w-full h-full object-cover group-hover/item:scale-110 transition-transform duration-500" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent" />
                <div className="absolute inset-x-0 top-0 h-px bg-white/70" />
            </div>
              <div className="flex flex-col items-start min-w-0">
                <div className="flex items-center gap-2 w-full">
                  <span className="text-[13px] font-black text-foreground tracking-tight">{formatCurrency(prop.value)}</span>
                  <span className="text-[9px] font-bold text-muted-foreground/60 truncate">• {prop.neighborhood}</span>
                </div>
                <div className="flex items-center gap-1.5 mt-0.5 w-full">
                  <MapPin size={10} className="text-primary/60 shrink-0" />
                  <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/40">{prop.type} em {prop.city}</span>
                </div>
                <div className="mt-1 flex items-center gap-2 w-full">
                  <span className="text-[9px] px-1.5 py-0.5 rounded-md bg-primary/10 text-primary font-black uppercase tracking-widest">#{prop.code}</span>
                  <span className="text-[9px] px-1.5 py-0.5 rounded-md bg-black/[0.04] dark:bg-white/[0.06] text-foreground/70 font-bold uppercase tracking-widest">{formatArea(prop.area)}</span>
                </div>
                <p className="text-[9px] text-muted-foreground/55 mt-1 max-w-[180px] truncate">{prop.address}</p>
              </div>
              <ChevronRight size={14} className="text-muted-foreground/20 group-hover/item:text-primary transition-colors ml-2" />
          </button>
        ))}
      </motion.div>
      </div>
    </div>
  )
}
