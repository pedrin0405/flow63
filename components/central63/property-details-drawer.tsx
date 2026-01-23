"use client"

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
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
        
        {/* Imagem de Capa no Topo */}
        <div className="relative h-64 w-full bg-muted shrink-0">
            <img 
                src={property.image} 
                alt="Foto Principal" 
                className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-background/90 to-transparent" />
            <div className="absolute bottom-4 left-6">
                <Badge className="mb-2 bg-primary text-primary-foreground hover:bg-primary">{property.type}</Badge>
                <h2 className="text-2xl font-bold text-foreground">{formatCurrency(property.value)}</h2>
                <p className="text-sm text-muted-foreground">{property.address}, {property.neighborhood}</p>
            </div>
        </div>

        {/* Conteúdo Rolável */}
        <ScrollArea className="flex-1 px-6">
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
        </ScrollArea>

        {/* Rodapé Fixo */}
        <SheetFooter className="p-6 border-t bg-background shrink-0 gap-2 sm:gap-0">
          <Button variant="outline" onClick={onClose} className="w-full sm:w-1/3">Fechar</Button>
          <Button className="w-full sm:w-2/3 bg-emerald-600 hover:bg-emerald-700 text-white">
             Entrar em Contato / Compartilhar
          </Button>
        </SheetFooter>
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