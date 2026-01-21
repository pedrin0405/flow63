"use client"

import React from "react"
import { MapPin, Phone, Mail, Check, LayoutDashboard } from "lucide-react"


interface Lead {
  id: number
  visibleOnDashboard?: boolean;
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
}

interface LeadCardProps {
  lead: Lead
  formatCurrency: (val: number) => string
  onClick: () => void
  isSelected?: boolean
  onSelect?: (id: number, selected: boolean) => void
  selectionMode?: boolean
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

export function LeadCard({ lead, formatCurrency, onClick, isSelected, onSelect, selectionMode }: LeadCardProps) {
  const handleCheckboxClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    onSelect?.(lead.id, !isSelected)
  }

  const handleCardClick = () => {
    if (selectionMode && onSelect) {
      onSelect(lead.id, !isSelected)
    } else {
      onClick()
    }
  }

  return (
    <div 
      className={`bg-card rounded-2xl border shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 cursor-pointer overflow-hidden group relative ${
        isSelected ? "border-primary ring-2 ring-primary/20" : "border-border"
      }`}
      onClick={handleCardClick}
    >
      {/* --- NOVO: Etiqueta "No Dashboard" --- */}
      {lead.visibleOnDashboard && (
        <div className="absolute top-0 right-0 bg-emerald-500 text-white text-[10px] font-bold px-2 py-1 rounded-bl-lg z-10 flex items-center gap-1 shadow-sm">
          <LayoutDashboard size={10} />
          No Dashboard
        </div>
      )}
      {/* Card Header: Client Info (Instagram Style) */}
      <div className="p-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="relative">
            {/* Story ring indicator */}
            <div className={`absolute -inset-0.5 rounded-full bg-gradient-to-tr ${
              lead.status === "Negócio Realizado" 
                ? "from-emerald-400 to-emerald-600" 
                : "from-primary to-violet-500"
            } p-0.5`} />
            <img 
              src={lead.clientAvatar || "/placeholder.svg"} 
              className="relative w-9 h-9 rounded-full border-2 border-card object-cover" 
              alt="Avatar" 
            />
          </div>
          <div className="leading-tight">
            <p className="font-bold text-sm text-foreground truncate w-32">{lead.clientName}</p>
            <p className="text-[10px] text-muted-foreground flex items-center gap-1">
              <MapPin size={10} /> {lead.city}
            </p>
          </div>
        </div>
        <button
          onClick={handleCheckboxClick}
          className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
            isSelected 
              ? "bg-primary border-primary text-primary-foreground" 
              : "border-muted-foreground/30 hover:border-primary"
          }`}
        >
          {isSelected && <Check size={14} strokeWidth={3} />}
        </button>
      </div>

      {/* Card Image: Property */}
      <div className="relative aspect-square bg-accent">
        <img src={lead.image || "/placeholder.svg"} alt="Imóvel" className="w-full h-full object-cover" />
        
        {/* Badges */}
        <div className="absolute top-3 right-3">
          <span className={`px-2 py-1 rounded-md text-xs font-bold shadow-sm backdrop-blur-md 
            ${lead.purpose === "Venda" ? "bg-card/90 text-primary" : "bg-card/90 text-amber-600"}`}>
            {lead.purpose}
          </span>
        </div>
        <div className="absolute bottom-3 left-3 right-3 flex justify-between items-end">
          <span className="bg-foreground/60 backdrop-blur-sm text-card px-2 py-1 rounded text-xs font-medium">
            Atualizado: {lead.updatedAt}
          </span>
        </div>
      </div>

      {/* Card Footer: Details & Actions */}
      <div className="p-4 space-y-3">
        {/* Price & Status */}
        <div className="flex items-center justify-between">
          <span className="font-bold text-lg text-foreground">{formatCurrency(lead.value)}</span>
          <StatusBadge status={lead.status} />
        </div>

        {/* Description */}
        <div className="text-sm text-muted-foreground leading-snug">
          <span className="font-bold text-foreground mr-1">{lead.broker.name.split(" ")[0]}:</span> 
          Atendimento na fase de <span className="font-medium text-primary">{lead.phase.label}</span>.
        </div>

        {/* Funnel Progress Bar */}
        <div className="space-y-1 pt-1">
          <div className="flex justify-between text-[10px] text-muted-foreground uppercase font-bold">
            <span>Progresso</span>
            <span>{lead.phase.percent}%</span>
          </div>
          <div className="w-full bg-accent rounded-full h-1.5 overflow-hidden">
            <div 
              className={`h-full rounded-full ${
                lead.status === "Negócio Realizado" 
                  ? "bg-emerald-500" 
                  : "bg-gradient-to-r from-primary to-violet-500"
              }`} 
              style={{ width: `${lead.phase.percent}%` }}
            />
          </div>
        </div>
        
        {/* Broker Mini Footer */}
        <div className="pt-3 border-t border-border flex items-center justify-between">
          <div className="flex items-center gap-2">
            <img src={lead.broker.avatar || "/placeholder.svg"} className="w-5 h-5 rounded-full" alt="Corretor" />
            <span className="text-xs text-muted-foreground truncate max-w-[100px]">{lead.broker.name}</span>
          </div>
          <div className="flex gap-2">
            <button 
              className="p-1.5 bg-emerald-50 text-emerald-600 rounded hover:bg-emerald-100 transition"
              onClick={(e) => e.stopPropagation()}
            >
              <Phone size={14}/>
            </button>
            <button 
              className="p-1.5 bg-blue-50 text-blue-600 rounded hover:bg-blue-100 transition"
              onClick={(e) => e.stopPropagation()}
            >
              <Mail size={14}/>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
