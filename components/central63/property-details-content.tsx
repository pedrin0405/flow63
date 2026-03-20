"use client"

import { useState, useEffect } from "react"
import { MapPin, Home, Ruler, DollarSign, Calendar, Star, Loader2, ChevronLeft, ChevronRight } from "lucide-react"
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
  const [images, setImages] = useState<string[]>([])
  const [currentImageIndex, setCurrentImageIndex] = useState(0)

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
                            "h-12 w-12 rounded-2xl backdrop-blur-xl border-2 transition-all duration-500 group/star",
                            isFeatured 
                              ? "bg-amber-500 border-amber-400 text-white shadow-[0_0_20px_rgba(245,158,11,0.4)] scale-110" 
                              : "bg-black/40 border-white/20 text-white/70 hover:bg-black/60 hover:scale-105"
                        )}
                        title={isFeatured ? "Remover dos Destaques" : "Adicionar aos Destaques"}
                    >
                        {isFeatureLoading ? (
                          <Loader2 className="h-5 w-5 animate-spin" />
                        ) : (
                          <Star className={cn(
                            "h-6 w-6 transition-transform duration-500", 
                            isFeatured ? "fill-white animate-pulse scale-110" : "group-hover/star:scale-125"
                          )} />
                        )}
                    </Button>
                )}
            </div>
            <div className="absolute bottom-6 left-6 right-6">
              <Badge className="bg-primary text-white border-none mb-2">{property.type}</Badge>
              <h2 className="text-white text-3xl font-black tracking-tight drop-shadow-md">
                {formatCurrency(property.value)}
              </h2>
              <p className="text-white/90 text-sm font-medium flex items-center gap-1">
                <MapPin size={14} className="text-primary-foreground" /> {property.address}
              </p>
            </div>
          </div>

          <div className="p-6 space-y-8">
            {/* Grid de Informações Rápidas */}
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 rounded-2xl border bg-muted/30 space-y-1">
                <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                  <Ruler size={12} className="text-primary"/> Área Total
                </span>
                <p className="text-lg font-bold">{property.area || "N/A"} m²</p>
              </div>
              <div className="p-4 rounded-2xl border bg-muted/30 space-y-1">
                <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                  <DollarSign size={12} className="text-primary"/> Valor m²
                </span>
                <p className="text-lg font-bold">{property.pricePerM2 ? `R$ ${property.pricePerM2}` : "N/A"}</p>
              </div>
              <div className="p-4 rounded-2xl border bg-muted/30 space-y-1 col-span-2">
                <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                  <MapPin size={12} className="text-primary"/> Localização
                </span>
                <p className="font-bold text-sm">{property.city} - {property.state}</p>
                <p className="text-xs text-muted-foreground font-medium">{property.neighborhood}</p>
              </div>
            </div>

            <Separator className="opacity-50" />

            {/* Descrição */}
            <div className="space-y-4">
              <h3 className="text-xs font-black uppercase tracking-[0.2em] text-muted-foreground flex items-center gap-2">
                <Home size={14} className="text-primary" /> Sobre o Imóvel
              </h3>
              <div className="text-[15px] text-foreground/80 leading-relaxed whitespace-pre-wrap font-medium">
                {property.description || "Nenhuma descrição detalhada disponível para este imóvel."}
              </div>
            </div>
            
            <Separator className="opacity-50" />
            
            <div className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center justify-between bg-muted/20 p-4 rounded-xl">
              <span className="flex items-center gap-2"><Calendar size={12} className="text-primary"/> Cadastrado em:</span>
              <span>{new Date(property.createdAt).toLocaleDateString('pt-BR')}</span>
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
