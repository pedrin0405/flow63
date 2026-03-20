"use client"

import { MapPin, Home, Ruler, DollarSign, Calendar } from "lucide-react"
import { Separator } from "@/components/ui/separator"
import { Button } from "@/components/ui/button"

interface PropertyDetailsContentProps {
  property: any
  formatCurrency: (val: number) => string
  onClose?: () => void
  isInline?: boolean
}

export function PropertyDetailsContent({ property, formatCurrency, onClose, isInline = false }: PropertyDetailsContentProps) {
  if (!property) return null

  return (
    <div className="flex flex-col h-full bg-card">
      <div className="flex-1 overflow-y-auto">
        <div className="flex flex-col">
          {/* Imagem de Capa */}
          <div className="relative h-72 w-full bg-muted shrink-0">
            <img 
              src={property.image} 
              alt="Foto Principal" 
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
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
