"use client"

import { MapPin, Expand, TrendingUp, Star } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

interface PropertyCardProps {
  property: any
  formatCurrency: (val: number) => string
  onClick: () => void
  isFeatured?: boolean
  isHighlighted?: boolean
}

export function PropertyCard({ property, formatCurrency, onClick, isFeatured = false, isHighlighted = false }: PropertyCardProps) {
  return (
    <div 
      className={cn(
        "relative overflow-hidden rounded-2xl border bg-white/95 dark:bg-zinc-900/55 backdrop-blur-xl cursor-pointer transition-all duration-500 group",
        "shadow-md shadow-zinc-900/8 dark:shadow-none hover:-translate-y-1 hover:shadow-2xl hover:shadow-black/12 dark:hover:shadow-black/30",
        isFeatured ? "border-amber-400/55 shadow-lg shadow-amber-500/12" : "border-zinc-200/90 dark:border-white/10",
        isHighlighted && "ring-2 ring-primary/50 border-primary/35 scale-[1.01]"
      )}
      onClick={onClick}
    >
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-zinc-200/80 dark:via-white/25 to-transparent" />

      <div className="relative aspect-[16/11] bg-muted overflow-hidden">
        <img 
            src={property.image} 
            alt="Imóvel" 
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-transparent" />
        
        {isFeatured && (
          <div className="absolute top-3 left-3 z-30 animate-in fade-in zoom-in duration-500">
            <div className="bg-amber-500/95 text-white p-1.5 rounded-lg backdrop-blur-sm border border-amber-300/50 shadow-lg shadow-amber-500/30">
              <Star className="h-3 w-3 fill-white" />
            </div>
          </div>
        )}

        <div className="absolute top-3 right-3 flex items-center gap-2">
             <Badge variant={property.status.includes("Desativado") ? "destructive" : "default"} className={cn("shadow-sm z-20 animate-in fade-in zoom-in duration-300", isFeatured ? "ml-9" : "") }>
                {property.status}
             </Badge>
             <Badge variant="outline" className="text-[11px] bg-white/85 dark:bg-zinc-900/85 border-white/60 dark:border-white/10">
                Cód: {property.code}
            </Badge>
        </div>

        <div className="absolute bottom-0 left-0 right-0 p-4 pt-10">
            <p className="text-[10px] uppercase tracking-[0.22em] font-black text-white/75 mb-1">Preco</p>
            <span className="text-white font-black text-2xl leading-none drop-shadow-lg">{formatCurrency(property.value)}</span>
        </div>
      </div>

      <div className="p-4 space-y-3">
        <div>
            <h3 className="font-bold text-foreground truncate text-sm" title={property.address}>
                {property.address}
            </h3>
            <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1 font-medium">
                <MapPin size={10} /> {property.neighborhood} - {property.city}
            </p>
        </div>

        <div className="grid grid-cols-2 gap-2 pt-3 border-t border-zinc-200/90 dark:border-white/10">
          <div className="flex flex-col rounded-lg bg-zinc-100/80 dark:bg-zinc-900/45 px-2.5 py-2 border border-zinc-200/75 dark:border-white/10">
                <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                    <Expand size={10} /> Área
                </span>
                <span className="text-xs font-bold">{property.area || "--"} m²</span>
            </div>
          <div className="flex flex-col text-right rounded-lg bg-zinc-100/80 dark:bg-zinc-900/45 px-2.5 py-2 border border-zinc-200/75 dark:border-white/10">
                 <span className="text-[11px] text-muted-foreground flex items-center gap-1 justify-end">
                    <TrendingUp size={10} /> Valor m²
                </span>
                <span className="text-xs font-bold">
                    {property.pricePerM2 ? `R$ ${property.pricePerM2}` : "--"}
                </span>
            </div>
        </div>
      </div>
    </div>
  )
}