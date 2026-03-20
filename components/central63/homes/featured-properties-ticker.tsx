"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Star, MapPin, Building2, ChevronRight } from "lucide-react"
import { supabase } from "@/lib/supabase"
import { cn } from "@/lib/utils"

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

  if (isLoading || featuredProperties.length === 0) return null

  // Duplicamos a lista para criar o efeito infinito
  const tickerItems = [...featuredProperties, ...featuredProperties, ...featuredProperties]

  return (
    <div className="w-full bg-primary/5 border-y border-primary/10 py-3 relative overflow-hidden group">
      <div className="absolute left-0 top-0 bottom-0 w-20 bg-gradient-to-r from-background to-transparent z-10" />
      <div className="absolute right-0 top-0 bottom-0 w-20 bg-gradient-to-l from-background to-transparent z-10" />
      
      <div className="flex items-center gap-4 mb-0 px-6 absolute left-0 top-1/2 -translate-y-1/2 z-20 pointer-events-none">
        <div className="bg-primary p-1.5 rounded-lg shadow-lg shadow-primary/20">
          <Star className="text-white h-3 w-3 fill-white" />
        </div>
        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-primary whitespace-nowrap hidden sm:block">Destaques</span>
      </div>

      <motion.div 
        className="flex gap-6 pl-40"
        animate={{
          x: [0, -1000],
        }}
        transition={{
          x: {
            repeat: Infinity,
            repeatType: "loop",
            duration: 30,
            ease: "linear",
          },
        }}
        style={{ width: "fit-content" }}
      >
        {tickerItems.map((prop, idx) => (
          <button
            key={`${prop.code}-${idx}`}
            onClick={() => onPropertyClick(prop)}
            className="flex items-center gap-4 bg-card/50 backdrop-blur-sm border border-border/50 rounded-2xl p-2 pr-6 hover:bg-card hover:border-primary/30 transition-all group/item whitespace-nowrap"
          >
            <div className="h-10 w-14 rounded-xl overflow-hidden shrink-0 border border-border/50">
              <img src={prop.image} alt="" className="w-full h-full object-cover group-hover/item:scale-110 transition-transform duration-500" />
            </div>
            <div className="flex flex-col items-start">
              <div className="flex items-center gap-2">
                <span className="text-xs font-black text-foreground">{formatCurrency(prop.value)}</span>
                <span className="text-[9px] font-bold text-muted-foreground/60">• {prop.neighborhood}</span>
              </div>
              <div className="flex items-center gap-1.5 mt-0.5">
                <MapPin size={10} className="text-primary/60" />
                <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/40">{prop.type} em {prop.city}</span>
              </div>
            </div>
            <ChevronRight size={14} className="text-muted-foreground/20 group-hover/item:text-primary transition-colors ml-2" />
          </button>
        ))}
      </motion.div>
    </div>
  )
}
