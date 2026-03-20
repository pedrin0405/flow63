"use client"

import { MapPin, Expand, TrendingUp, Star } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

interface PropertyCardProps {
  property: any
  formatCurrency: (val: number) => string
  onClick: () => void
  isFeatured?: boolean
}

export function PropertyCard({ property, formatCurrency, onClick, isFeatured = false }: PropertyCardProps) {
  return (
    <div 
      className={cn(
        "bg-card rounded-xl border border-border overflow-hidden cursor-pointer hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group relative",
        isFeatured && "border-amber-500/30 shadow-md shadow-amber-500/5"
      )}
      onClick={onClick}
    >
      {/* Imagem + Badge Status */}
      <div className="relative aspect-[4/3] bg-muted overflow-hidden">
        <img 
            src={property.image} 
            alt="Imóvel" 
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />
        
        {isFeatured && (
          <div className="absolute top-3 left-3 z-30 animate-in fade-in zoom-in duration-500">
            <div className="bg-amber-500/90 text-white p-1 rounded-lg backdrop-blur-sm border border-amber-400/50 shadow-lg shadow-amber-500/20">
              <Star className="h-3 w-3 fill-white" />
            </div>
          </div>
        )}

        <div>
             <Badge variant={property.status.includes("Desativado") ? "destructive" : "default"} className={cn("shadow-sm absolute top-3 z-20 animate-in fade-in zoom-in duration-300", isFeatured ? "left-10" : "left-3")}>
                {property.status}
             </Badge>
             <Badge variant="outline" className="text-[12px] bg-muted/100 absolute top-3 right-3">
                Cód: {property.code}
            </Badge>
        </div>
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-3 pt-8">
            <span className="text-white font-bold text-lg">{formatCurrency(property.value)}</span>
        </div>
      </div>

      {/* Conteúdo */}
      <div className="p-4 space-y-3">
        <div>
            <h3 className="font-semibold text-foreground truncate text-sm" title={property.address}>
                {property.address}
            </h3>
            <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                <MapPin size={10} /> {property.neighborhood} - {property.city}
            </p>
        </div>

        {/* Tags de Detalhes (Grid) */}
        <div className="grid grid-cols-2 gap-2 pt-2 border-t border-border">
            <div className="flex flex-col">
                <span className="text-[12px] text-muted-foreground flex items-center gap-1">
                    <Expand size={10} /> Área
                </span>
                <span className="text-xs font-medium">{property.area || "--"} m²</span>
            </div>
            <div className="flex flex-col text-right">
                 <span className="text-[12px] text-muted-foreground flex items-center gap-1 justify-end">
                    <TrendingUp size={10} /> Valor m²
                </span>
                <span className="text-xs font-medium">
                    {property.pricePerM2 ? `R$ ${property.pricePerM2}` : "--"}
                </span>
            </div>
        </div>
      </div>
    </div>
  )
}