"use client"

import React from "react"
import { MapPin, LayoutDashboard, PlusCircle, RefreshCw, UserCheck, CheckCircle2, Eye } from "lucide-react"
import { Button } from "@/components/ui/button"

interface Lead {
  id: number
  sourceTable: string 
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
  history: Array<{
    date: string
    action: string
    user: string
    desc: string
    status?: string
    type: "action" | "visit" | "system"
  }>
  visibleOnDashboard?: boolean
  valueLaunched: number
}

interface LeadCardProps {
  lead: Lead
  formatCurrency: (val: number) => string
  onClick: () => void // Agora usada apenas pelo ícone de olho
  onAddToDashboard: (e: React.MouseEvent) => void
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
    <span className={`px-2 py-1 rounded-full text-[10px] uppercase font-bold border tracking-wide ${colors[status] || "bg-muted text-muted-foreground"}`}>
      {status}
    </span>
  )
}

export function LeadCard({ lead, formatCurrency, onClick, onAddToDashboard }: LeadCardProps) {
  
  // Define se o card está "ativo" no dashboard para estilização
  const isActive = lead.visibleOnDashboard;

  return (
    <div 
      className={`
        bg-card rounded-2xl border transition-all duration-300 overflow-hidden group relative
        ${isActive 
            ? "border-emerald-500 ring-1 ring-emerald-500/50 shadow-lg shadow-emerald-500/10" // Estilo quando está no Dashboard
            : "border-border shadow-sm hover:shadow-xl hover:-translate-y-1 hover:border-primary/30" // Estilo padrão
        }
      `}
      // REMOVIDO: onClick={onClick} do elemento pai para evitar cliques acidentais
    >
      
      {/* --- CABEÇALHO: DADOS DO CORRETOR E BOTÃO DE DETALHES À DIREITA --- */}
      <div className="p-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="relative">
            <img 
              src={lead.broker.avatar || "/placeholder.svg"} 
              className="relative w-9 h-9 rounded-full border-2 border-card object-cover bg-muted" 
              alt="Corretor" 
            />
          </div>
          <div className="leading-tight">
            <p className="font-bold text-sm text-foreground truncate w-32">{lead.broker.name}</p>
            <p className="text-[10px] text-muted-foreground flex items-center gap-1">
              <UserCheck size={10} /> Corretor
            </p>
          </div>
        </div>

        {/* Botão de Ver Detalhes (Posicionado à Direita) */}
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 rounded-full text-muted-foreground hover:text-primary hover:bg-primary/10"
          onClick={(e) => {
            e.stopPropagation();
            onClick(); // Chama a função de ver detalhes
          }}
          title="Ver Detalhes do Lead"
        >
          <Eye size={18} />
        </Button>
      </div>

      {/* --- IMAGEM DO IMÓVEL --- */}
      <div className="relative aspect-3/2 bg-accent group-hover:opacity-95 transition-opacity">
        <img src={lead.image || "/placeholder.svg"} alt="Imóvel" className="w-full h-full object-cover" />
        
        {/* BADGE "NO DASHBOARD" */}
        {isActive && (
          <div className="absolute top-3 left-3 z-20 animate-in fade-in zoom-in duration-300">
             <span className="flex items-center gap-1.5 bg-emerald-600/90 text-white text-[10px] uppercase font-bold px-2.5 py-1 rounded-full shadow-lg backdrop-blur-sm border border-emerald-400/30">
               <LayoutDashboard size={12} className="text-white" />
               No Dashboard
             </span>
          </div>
        )}

        {/* Rodapé da Imagem (Data) */}
        <div className="absolute bottom-3 left-3 right-3 flex justify-between items-end">
          <span className="bg-black/60 backdrop-blur-sm text-white px-2 py-1 rounded-full text-[10px] font-medium border border-white/10">
            {lead.history[0]?.date || lead.updatedAt}
          </span>
          <StatusBadge status={lead.status} />
        </div>
      </div>

      {/* --- RODAPÉ DO CARD --- */}
      <div className="p-4 space-y-3">
        <div className="flex items-center justify-between">
          <span className={`font-bold text-lg ${isActive ? "text-emerald-700" : "text-foreground"}`}>
            {formatCurrency(lead.value)}
          </span>
        </div>

        {/* Valor Lançado no Dashboard */}
        <div className={`flex items-center justify-between text-sm px-3 py-2 rounded-md border ${
          lead.visibleOnDashboard && lead.valueLaunched > 0 
            ? "bg-emerald-50 border-emerald-200" 
            : "bg-slate-50 border-slate-200"
        }`}>
          <span className={`${lead.visibleOnDashboard && lead.valueLaunched > 0 ? "text-emerald-600" : "text-slate-500"} font-medium`}>
            No Dashboard:
          </span>
          <span className={`${lead.visibleOnDashboard && lead.valueLaunched > 0 ? "text-emerald-800" : "text-slate-400"} font-semibold`}>
            {lead.visibleOnDashboard && lead.valueLaunched > 0 
              ? formatCurrency(lead.valueLaunched) 
              : "Valor pendente"}
          </span>
        </div>

        <div className="pt-3 border-t border-border flex items-center justify-between gap-2">
          
          {/* Dados do Cliente */}
          <div className="flex items-center gap-2 min-w-0">
            <div className="relative shrink-0">
               <div className={`absolute -inset-0.5 rounded-full bg-gradient-to-tr ${
                 lead.status === "Negócio Realizado" 
                   ? "from-emerald-400 to-emerald-600" 
                   : "from-primary to-violet-500"
               } p-[1px]`} />
               <img src={lead.clientAvatar || "/placeholder.svg"} className="relative w-6 h-6 rounded-full border border-card object-cover" alt="Cliente" />
            </div>
            
            <div className="flex flex-col overflow-hidden">
               <span className="text-xs font-semibold text-foreground truncate block w-24">
                 {lead.clientName}
               </span>
               <span className="text-[9px] text-muted-foreground flex items-center gap-0.5 truncate">
                 <MapPin size={8} /> {lead.city}
               </span>
            </div>
          </div>

          {/* Botão de Ação */}
          <div 
            className="relative z-10"
            onClick={(e) => {
              // Bloqueia a propagação na div container para garantir
              e.preventDefault();
              e.stopPropagation();
            }}
            onMouseDown={(e) => {
              // Previne comportamentos de arrastar/seleção que podem disparar eventos indesejados
              e.stopPropagation();
            }}
          >
            <Button 
              type="button"
              size="sm" 
              variant={isActive ? "outline" : "default"}
              className={`h-7 text-xs px-3 gap-1.5 transition-all shadow-sm ${
                isActive 
                  ? "border-emerald-200 text-emerald-700 bg-emerald-50 hover:bg-emerald-100 hover:text-emerald-800 hover:border-emerald-300" 
                  : "bg-primary hover:bg-primary/90"
              }`}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation(); 
                onAddToDashboard(e); 
              }}
            >
              {isActive ? (
                <>
                  <RefreshCw size={12} /> Atualizar
                </>
              ) : (
                <>
                  <PlusCircle size={12} /> Add ao Dashboard
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}