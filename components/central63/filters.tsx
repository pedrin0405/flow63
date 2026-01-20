"use client"

import { Filter, Search, X, SlidersHorizontal } from "lucide-react"
import { Button } from "@/components/ui/button"

interface FiltersProps {
  filters: {
    city: string
    team: string
    purpose: string
    status: string
    phase: string
    brokerId: string
    dateStart: string
    dateEnd: string
    search: string
  }
  onFilterChange: (key: string, value: string) => void
  onClearFilters: () => void
  teams: string[]
  cities: string[]
  brokers: { id: number; name: string; avatar: string }[]
  phases: { id: number; label: string; percent: number }[]
  statuses: string[]
  purposes: string[]
}

export function Filters({ 
  filters, 
  onFilterChange, 
  onClearFilters,
  teams,
  cities,
  brokers,
  phases,
  statuses,
  purposes
}: FiltersProps) {
  const hasActiveFilters = filters.city || filters.team || filters.status || filters.phase || filters.brokerId || filters.search || filters.dateStart || filters.dateEnd

  return (
    <div className="bg-card rounded-2xl border border-border p-5 shadow-sm space-y-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-foreground font-bold text-sm uppercase tracking-wide">
          <Filter size={16} /> Filtros Avancados
        </div>
        
        {/* Purpose Toggle */}
        <div className="flex bg-accent p-1 rounded-lg">
          <button 
            onClick={() => onFilterChange("purpose", "Todos")}
            className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${
              filters.purpose === "Todos" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground"
            }`}
          >
            Todos
          </button>
          {purposes.map(p => (
            <button 
              key={p}
              onClick={() => onFilterChange("purpose", p)}
              className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${
                filters.purpose === p ? "bg-card text-primary shadow-sm" : "text-muted-foreground"
              }`}
            >
              {p}
            </button>
          ))}
        </div>
      </div>
      
      {/* Primary Filters Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-4">
        {/* Search */}
        <div className="relative xl:col-span-1">
          <Search className="absolute left-3 top-2.5 text-muted-foreground" size={16} />
          <input 
            type="text" 
            placeholder="Nome do Cliente ou ID" 
            className="w-full pl-9 pr-4 py-2 rounded-lg border border-border focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none text-sm bg-accent/50"
            value={filters.search}
            onChange={e => onFilterChange("search", e.target.value)}
          />
        </div>

        {/* City */}
        <select 
          className="w-full px-3 py-2 rounded-lg border border-border focus:ring-2 focus:ring-primary/50 outline-none text-sm bg-accent/50 text-muted-foreground"
          value={filters.city}
          onChange={e => onFilterChange("city", e.target.value)}
        >
          <option value="">Todas as Cidades</option>
          {cities.map(c => <option key={c} value={c}>{c}</option>)}
        </select>

        {/* Team */}
        <select 
          className="w-full px-3 py-2 rounded-lg border border-border focus:ring-2 focus:ring-primary/50 outline-none text-sm bg-accent/50 text-muted-foreground"
          value={filters.team}
          onChange={e => onFilterChange("team", e.target.value)}
        >
          <option value="">Todas as Equipes</option>
          {teams.map(t => <option key={t} value={t}>{t}</option>)}
        </select>

        {/* Status */}
        <select 
          className="w-full px-3 py-2 rounded-lg border border-border focus:ring-2 focus:ring-primary/50 outline-none text-sm bg-accent/50 text-muted-foreground"
          value={filters.status}
          onChange={e => onFilterChange("status", e.target.value)}
        >
          <option value="">Qualquer Situacao</option>
          {statuses.map(s => <option key={s} value={s}>{s}</option>)}
        </select>

        {/* Search Button */}
        <div className="flex gap-2 sm:col-span-2 lg:col-span-4 xl:col-span-1">
          <button 
            className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground px-4 py-2 rounded-lg text-sm font-medium transition flex items-center justify-center gap-2"
          >
            <Search size={16}/> Buscar
          </button>
        </div>
      </div>

      {/* Secondary Filters Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 border-t border-border pt-4">
        {/* Broker */}
        <select 
          className="w-full px-3 py-2 rounded-lg border border-border outline-none text-sm text-muted-foreground"
          value={filters.brokerId}
          onChange={e => onFilterChange("brokerId", e.target.value)}
        >
          <option value="">Filtrar por Corretor</option>
          {brokers.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
        </select>

        {/* Phase */}
        <select 
          className="w-full px-3 py-2 rounded-lg border border-border outline-none text-sm text-muted-foreground"
          value={filters.phase}
          onChange={e => onFilterChange("phase", e.target.value)}
        >
          <option value="">Qualquer Fase do Funil</option>
          {phases.map(p => <option key={p.id} value={p.id}>{p.id} - {p.label}</option>)}
        </select>

        {/* Date Range */}
        <div className="flex gap-2 col-span-2">
          <div className="relative flex-1">
            <span className="absolute left-3 top-2.5 text-muted-foreground text-xs font-bold">DE</span>
            <input 
              type="date" 
              className="w-full pl-10 pr-2 py-2 rounded-lg border border-border text-sm text-muted-foreground outline-none" 
              value={filters.dateStart} 
              onChange={e => onFilterChange("dateStart", e.target.value)}
            />
          </div>
          <div className="relative flex-1">
            <span className="absolute left-3 top-2.5 text-muted-foreground text-xs font-bold">ATE</span>
            <input 
              type="date" 
              className="w-full pl-10 pr-2 py-2 rounded-lg border border-border text-sm text-muted-foreground outline-none" 
              value={filters.dateEnd} 
              onChange={e => onFilterChange("dateEnd", e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Clear Filters */}
      {hasActiveFilters && (
        <div className="flex justify-end">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={onClearFilters}
            className="text-muted-foreground hover:text-destructive"
          >
            <X size={16} className="mr-1" />
            Limpar filtros
          </Button>
        </div>
      )}
    </div>
  )
}
