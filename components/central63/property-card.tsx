"use client"

import { MapPin, Expand, TrendingUp } from "lucide-react"
import { Badge } from "@/components/ui/badge"

interface PropertyCardProps {
  property: any
  formatCurrency: (val: number) => string
  onClick: () => void
}

export function PropertyCard({ property, formatCurrency, onClick }: PropertyCardProps) {
  return (
    <div 
      className="bg-card rounded-xl border border-border overflow-hidden cursor-pointer hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group"
      onClick={onClick}
    >
      {/* Imagem + Badge Status */}
      <div className="relative aspect-[4/3] bg-muted overflow-hidden">
        <img 
            src={property.image} 
            alt="Imóvel" 
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />
        <div className="absolute top-3 right-3">
             <Badge variant={property.status.includes("Vendido") ? "destructive" : "default"} className="shadow-sm">
                {property.status}
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
                <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                    <Expand size={10} /> Área
                </span>
                <span className="text-xs font-medium">{property.area || "--"} m²</span>
            </div>
            <div className="flex flex-col text-right">
                 <span className="text-[10px] text-muted-foreground flex items-center gap-1 justify-end">
                    <TrendingUp size={10} /> Valor m²
                </span>
                <span className="text-xs font-medium">
                    {property.pricePerM2 ? `R$ ${property.pricePerM2}` : "--"}
                </span>
            </div>
        </div>
        
        <div className="pt-2">
            <Badge variant="outline" className="text-[10px] w-full justify-center bg-muted/50">
                Cód: {property.code}
            </Badge>
        </div>
      </div>
    </div>
  )
}