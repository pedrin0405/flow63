"use client"

import { X, Mail, Phone, Calendar, MapPin, Clock, User } from "lucide-react"

interface HistoryEntry {
  date: string
  action: string
  user: string
  desc: string
  status?: string
  type: "action" | "visit" | "system"
}

interface Lead {
  id: number
  clientName: string
  clientAvatar: string
  broker: { id: number; name: string; avatar: string }
  team: string
  city: string
  purpose: string
  status: string
  phase: { id: number; label: string; percent: number }
  propertyTitle: string
  propertyLocation: string
  propertyAddress: string
  value: number
  image: string
  updatedAt: string
  leadData: {
    email: string
    phone: string
    origin: string
    createdAt: string
  }
  history: HistoryEntry[]
}

interface DetailsDrawerProps {
  lead: Lead | null
  onClose: () => void
  formatCurrency: (value: number) => string
  onEditClick: () => void
}

function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    "Negócio Realizado": "bg-emerald-100 text-emerald-700 border-emerald-200",
    "Em Atendimento": "bg-blue-100 text-blue-700 border-blue-200",
    "Visita Agendada": "bg-amber-100 text-amber-700 border-amber-200",
    "Proposta Enviada": "bg-violet-100 text-violet-700 border-violet-200",
    "Descartado": "bg-red-100 text-red-700 border-red-200",
  }
  return (
    <span className={`px-2 py-0.5 rounded-full text-[10px] uppercase font-bold border tracking-wide ${colors[status] || "bg-muted text-muted-foreground"}`}>
      {status}
    </span>
  )
}

export function DetailsDrawer({ lead, onClose, formatCurrency, onEditClick }: DetailsDrawerProps) {
  if (!lead) return null

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-foreground/40 backdrop-blur-sm transition-opacity" 
        onClick={onClose}
      />
      
      {/* Drawer */}
      <div className="relative w-full max-w-lg bg-card h-full shadow-2xl overflow-y-auto transform transition-transform duration-300 flex flex-col">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-border sticky top-0 bg-card z-10 flex justify-between items-center shadow-sm">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-muted-foreground">COD: {lead.id}</span>
              <StatusBadge status={lead.status} />
            </div>
            <h2 className="text-lg font-bold text-foreground mt-1">{lead.clientName}</h2>
          </div>
          <button 
            onClick={onClose} 
            className="p-2 hover:bg-accent rounded-full text-muted-foreground transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-8 bg-accent/30">
          
          {/* Seção 1: Dados do Lead */}
          <section className="bg-card p-4 rounded-xl border border-border shadow-sm">
            <div className="flex items-center gap-4 mb-4 border-b border-border pb-4">
              <img 
                src={lead.clientAvatar || "/placeholder.svg"} 
                className="w-16 h-16 rounded-full object-cover border-2 border-primary/20" 
                alt="Cliente" 
              />
              <div>
                <h3 className="font-bold text-foreground">Dados de Contato</h3>
                <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded font-medium">
                  Origem: {lead.leadData.origin}
                </span>
              </div>
            </div>
            <div className="space-y-3">
              <div className="flex items-center gap-3 text-sm text-muted-foreground">
                <div className="w-8 h-8 rounded-full bg-accent flex items-center justify-center text-muted-foreground">
                  <Mail size={16}/>
                </div>
                {lead.leadData.email}
              </div>
              <div className="flex items-center gap-3 text-sm text-muted-foreground">
                <div className="w-8 h-8 rounded-full bg-accent flex items-center justify-center text-muted-foreground">
                  <Phone size={16}/>
                </div>
                {lead.leadData.phone}
              </div>
              <div className="flex items-center gap-3 text-sm text-muted-foreground">
                <div className="w-8 h-8 rounded-full bg-accent flex items-center justify-center text-muted-foreground">
                  <Calendar size={16}/>
                </div>
                Entrou em: {lead.leadData.createdAt}
              </div>
            </div>
          </section>

          {/* Seção 2: Imóvel */}
          <section className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
            <div className="h-32 bg-accent w-full relative">
              <img src={lead.image || "/placeholder.svg"} className="w-full h-full object-cover" alt="Imóvel" />
              <div className="absolute inset-0 bg-gradient-to-t from-foreground/60 to-transparent flex items-end p-4">
                <h4 className="text-card font-bold text-lg leading-tight">{lead.propertyTitle}</h4>
              </div>
            </div>
            <div className="p-4 space-y-3">
              <div className="flex justify-between items-start">
                <p className="text-muted-foreground text-sm flex items-start gap-2 leading-snug">
                  <MapPin size={16} className="mt-0.5 flex-shrink-0 text-primary" />
                  <span>
                    {lead.propertyAddress} <br/> 
                    <span className="text-muted-foreground/70">{lead.propertyLocation} - {lead.city}/TO</span>
                  </span>
                </p>
              </div>
              <div className="pt-2 border-t border-border flex justify-between items-center">
                <span className="text-xs font-bold text-muted-foreground uppercase">Valor do Imóvel</span>
                <p className="text-xl font-bold text-primary">{formatCurrency(lead.value)}</p>
              </div>
            </div>
          </section>

          {/* Seção 3: Timeline */}
          <section>
            <h3 className="text-sm font-bold uppercase text-muted-foreground mb-4 flex items-center gap-2">
              <Clock size={16} /> Timeline de Atendimento
            </h3>
            <div className="relative border-l-2 border-border ml-3 space-y-8 pb-2">
              {lead.history.map((log, idx) => (
                <div key={idx} className="relative pl-8 group">
                  <div className={`absolute -left-[9px] top-0 w-4 h-4 rounded-full border-4 border-card shadow-sm transition-transform group-hover:scale-125
                    ${log.type === "action" ? "bg-primary" : log.type === "visit" ? "bg-emerald-500" : "bg-muted-foreground"}`}>
                  </div>
                  <div className="flex flex-col bg-card p-3 rounded-lg border border-border shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">{log.date}</span>
                      {log.status && (
                        <span className="text-[10px] bg-emerald-50 text-emerald-600 px-1.5 rounded">{log.status}</span>
                      )}
                    </div>
                    <h4 className="font-bold text-foreground text-sm mb-1">{log.action}</h4>
                    <p className="text-muted-foreground text-xs italic">
                      &ldquo;{log.desc}&rdquo;
                    </p>
                    <div className="mt-2 pt-2 border-t border-border/50 flex items-center gap-1 text-[10px] text-muted-foreground">
                      <User size={10} /> Registrado por: <span className="font-medium text-foreground">{log.user}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>

        </div>
        
        {/* Footer Actions */}
        <div className="p-4 border-t border-border bg-card flex gap-2">
          <button className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground py-2.5 rounded-lg font-medium text-sm transition-colors shadow-sm shadow-primary/20">
            Adicionar Interacao
          </button>
          <button 
            className="flex-1 bg-card border border-border hover:bg-accent text-foreground py-2.5 rounded-lg font-medium text-sm transition-colors"
            onClick={onEditClick}
          >
            Editar Lead
          </button>
        </div>
      </div>
    </div>
  )
}
