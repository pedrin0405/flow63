"use client"

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
// Removido o import do ScrollArea pois já existe um scroll nativo no pai
import { MapPin, Home, Ruler, DollarSign, Calendar } from "lucide-react"
import { Separator } from "@/components/ui/separator"

interface PropertyDetailsDrawerProps {
  property: any | null
  onClose: () => void
  formatCurrency: (val: number) => string
}

export function PropertyDetailsDrawer({ property, onClose, formatCurrency }: PropertyDetailsDrawerProps) {
  if (!property) return null

  return (
    <Sheet open={!!property} onOpenChange={(open) => !open && onClose()}>
      <SheetContent className="w-full sm:max-w-xl p-0 flex flex-col bg-card border-l border-border h-full">
        
        {/* Acessibilidade: Título e Descrição ocultos visualmente (sr-only) para evitar erro de Missing DialogTitle */}
        <SheetHeader className="sr-only">
          <SheetTitle>Detalhes do Imóvel</SheetTitle>
          <SheetDescription>
            Visualização detalhada do imóvel localizado em {property.address}
          </SheetDescription>
        </SheetHeader>

        {/* Scroll Geral Nativo - O container principal cuida da rolagem */}
        <div className="flex-1 overflow-y-auto w-full">
          <div className="flex flex-col">
            {/* Imagem de Capa no Topo */}
            <div className="relative h-64 w-full bg-muted shrink-0">
                <img 
                    src={property.image} 
                    alt="Foto Principal" 
                    className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
                <div className="absolute bottom-4 left-6">
                    <Badge className="bg-black/40 text-white border-white/20 backdrop-blur-sm">{property.type}</Badge>
                    <h2 className="text-white text-2xl font-bold tracking-tight">{formatCurrency(property.value)}</h2>
                    <p className="text-white/80 text-sm flex items-center gap-1">{property.address}, {property.neighborhood}</p>
                </div>
            </div>

            {/* Conteúdo - Trocado ScrollArea por div simples para evitar conflito de DOM */}
            <div className="flex-1 px-6">
                <div className="py-6 space-y-6">
                    
                    {/* Grid de Informações Rápidas */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="p-3 rounded-lg border bg-muted/30 space-y-1">
                            <span className="text-xs text-muted-foreground flex items-center gap-1"><Ruler size={12}/> Área Total</span>
                            <p className="font-semibold">{property.area || "N/A"} m²</p>
                        </div>
                        <div className="p-3 rounded-lg border bg-muted/30 space-y-1">
                             <span className="text-xs text-muted-foreground flex items-center gap-1"><DollarSign size={12}/> Valor m²</span>
                            <p className="font-semibold">{property.pricePerM2 ? `R$ ${property.pricePerM2}` : "N/A"}</p>
                        </div>
                        <div className="p-3 rounded-lg border bg-muted/30 space-y-1 col-span-2">
                             <span className="text-xs text-muted-foreground flex items-center gap-1"><MapPin size={12}/> Localização</span>
                            <p className="font-medium text-sm">{property.city} - {property.state}</p>
                            <p className="text-xs text-muted-foreground">{property.neighborhood}</p>
                        </div>
                    </div>

                    <Separator />

                    {/* Descrição */}
                    <div className="space-y-3">
                        <h3 className="font-semibold flex items-center gap-2">
                            <Home size={16} /> Sobre o Imóvel
                        </h3>
                        <div className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">
                            {property.description || "Nenhuma descrição fornecida para este imóvel."}
                        </div>
                    </div>
                    
                     <Separator />
                     
                     <div className="text-xs text-muted-foreground flex items-center justify-between">
                        <span className="flex items-center gap-1"><Calendar size={12}/> Cadastrado em:</span>
                        <span>{new Date(property.createdAt).toLocaleDateString('pt-BR')}</span>
                     </div>

                </div>
            </div>
          </div>
        </div>

        <div className="p-4 border-t bg-background shrink-0 z-10">
          <Button className="w-full shadow-md" size="lg" onClick={onClose}>
            Fechar Detalhes
          </Button>
        </div>
        
      </SheetContent>
    </Sheet>
  )
}

function Badge({ children, className, variant = "default" }: any) {
    const variants: any = {
        default: "bg-primary text-primary-foreground",
        destructive: "bg-red-500 text-white",
        outline: "border border-input bg-background hover:bg-accent hover:text-accent-foreground"
    }
    return <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 ${variants[variant]} ${className}`}>{children}</span>
}