import { X, Edit, Phone, Mail, Calendar, User, MapPin, Building, Info, FileText, Clock } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetClose } from "@/components/ui/sheet"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"

interface DetailsDrawerProps {
  lead: any
  onClose: () => void
  formatCurrency: (val: number) => string
  onEditClick: () => void
}

export function DetailsDrawer({ lead, onClose, formatCurrency, onEditClick }: DetailsDrawerProps) {
  if (!lead) return null

  return (
    <Sheet open={!!lead} onOpenChange={(open) => !open && onClose()}>
      <SheetContent className="w-full sm:max-w-md md:max-w-lg overflow-hidden flex flex-col p-0 border-l shadow-2xl">
        
        {/* Header com Imagem de Fundo */}
        <div className="relative h-48 bg-muted">
          <img 
            src={lead.image || "/placeholder.jpg"} 
            alt="Imóvel" 
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
          
          <SheetHeader className="absolute bottom-0 left-0 right-0 p-6 text-left">
            <div className="flex items-center gap-2 mb-2">
              <Badge variant="outline" className="bg-black/40 text-white border-white/20 backdrop-blur-sm">
                {lead.purpose}
              </Badge>
              <Badge variant="secondary" className="bg-white/90 text-black">
                {lead.status}
              </Badge>
            </div>
            <SheetTitle className="text-white text-2xl font-bold tracking-tight">
              {lead.clientName}
            </SheetTitle>
            <p className="text-white/80 text-sm flex items-center gap-1">
              <User size={14} /> Atendimento #{lead.raw_codigo || lead.id}
            </p>
          </SheetHeader>

          <SheetClose className="absolute top-4 right-4 bg-black/20 hover:bg-black/40 text-white p-2 rounded-full backdrop-blur-sm transition-colors border border-white/10">
            <X size={18} />
          </SheetClose>
        </div>

        <ScrollArea className="flex-1">
          <div className="p-6 space-y-8">
            
            {/* Informações Principais do Imóvel */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
                    <Building size={18} className="text-primary" />
                    Detalhes do Imóvel
                  </h3>
                </div>
                <div className="text-right">
                  <p className="text-sm text-muted-foreground">Valor Proposto</p>
                  <p className="text-xl font-bold text-emerald-600">
                    {formatCurrency(lead.value)}
                  </p>
                </div>
              </div>

              <div className="bg-muted/40 p-4 rounded-xl border border-border space-y-3">
                <div className="flex items-start gap-3">
                  <MapPin className="text-muted-foreground mt-0.5 shrink-0" size={18} />
                  <div>
                    <p className="font-medium text-foreground">
                       {lead.propertyAddress}
                    </p>
                    <p className="text-sm text-muted-foreground">
                       {lead.propertyTitle}
                    </p>
                  </div>
                </div>
                
                {lead.propertyLocation && lead.propertyLocation !== "----" && (
                    <div className="flex items-center gap-3 text-sm text-muted-foreground pl-0.5">
                        <Info size={16} />
                        <span>Código do Imóvel: {lead.propertyLocation}</span>
                    </div>
                )}
              </div>
            </div>

            <Separator />

            {/* --- NOVA SEÇÃO: TIMELINE DE ATENDIMENTO --- */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
                <Clock size={18} className="text-primary" />
                Histórico de Atendimento
              </h3>

              <div className="relative border-l border-border ml-3 space-y-6">
                {lead.history && lead.history.length > 0 ? (
                  lead.history.map((item: any, i: number) => (
                    <div key={i} className="ml-6 relative">
                      {/* Bolinha na linha do tempo */}
                      <span className={`absolute -left-[31px] top-1 w-4 h-4 rounded-full border-2 border-background ${
                        i === 0 ? "bg-primary" : "bg-muted-foreground/30"
                      }`} />
                      
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                          <span className="font-medium">{item.date}</span>
                          <span>{item.user}</span>
                        </div>
                        <p className="text-sm font-medium text-foreground">
                          {item.action}
                        </p>
                        {item.desc && (
                            <p className="text-sm text-muted-foreground leading-relaxed bg-muted/30 p-2 rounded-md">
                              {item.desc}
                            </p>
                        )}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="ml-6 text-sm text-muted-foreground italic">
                    Nenhuma interação registrada.
                  </div>
                )}
              </div>
            </div>

            <Separator />

            {/* Dados de Contato */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
                  <User size={18} className="text-primary" />
                  Contato
                </h3>
                <Button variant="outline" size="sm" onClick={onEditClick} className="gap-2 h-8">
                  <Edit size={14} /> Editar
                </Button>
              </div>

              <div className="grid grid-cols-1 gap-3">
                <div className="flex items-center gap-3 p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                    <Phone size={16} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-muted-foreground font-medium">Telefone</p>
                    <p className="text-sm font-medium truncate">{lead.leadData?.phone || "Não informado"}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                    <Mail size={16} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-muted-foreground font-medium">Email</p>
                    <p className="text-sm font-medium truncate">{lead.leadData?.email || "Não informado"}</p>
                  </div>
                </div>

                 <div className="flex items-center gap-3 p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                    <Calendar size={16} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-muted-foreground font-medium">Data de Criação</p>
                    <p className="text-sm font-medium truncate">{lead.leadData?.createdAt}</p>
                  </div>
                </div>
              </div>
            </div>

            <Separator />
            
            {/* Histórico / Observações */}
            <div>
               <h3 className="text-lg font-semibold text-foreground flex items-center gap-2 mb-4">
                  <FileText size={18} className="text-primary" />
                  Origem
               </h3>
               <div className="bg-accent/30 p-4 rounded-lg text-sm text-muted-foreground">
                  <p>Midia de Origem: <span className="font-medium text-foreground">{lead.raw_midia || "Orgânico"}</span></p>
               </div>
            </div>

          </div>
        </ScrollArea>

        <div className="p-4 border-t bg-background">
          <Button className="w-full" size="lg" onClick={onClose}>
            Fechar Detalhes
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  )
}