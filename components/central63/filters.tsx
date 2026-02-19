"use client"

import { useState, useEffect } from "react"
import { Search, X, Filter, CalendarDays, ChevronDown, Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"

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
  // Estado local para o input de busca não disparar requests a cada letra
  const [localSearch, setLocalSearch] = useState(filters.search)

  // Sincroniza o estado local caso os filtros sejam limpos externamente
  useEffect(() => {
    setLocalSearch(filters.search)
  }, [filters.search])

  const handleSearchTrigger = () => {
    onFilterChange("search", localSearch)
  }

  // Verifica se há filtros ativos (exceto busca e finalidade, que são "padrão")
  const activeFiltersCount = [
    filters.city,
    filters.team,
    filters.status,
    filters.phase,
    filters.brokerId,
    filters.dateStart,
    filters.dateEnd
  ].filter(Boolean).length

  const formatDateDisplay = (dateString: string) => {
    if (!dateString) return null
    const date = new Date(dateString + "T12:00:00")
    return format(date, "dd MMM", { locale: ptBR })
  }

  // Componente reutilizável para itens de seleção dentro do Popover
  const FilterSection = ({ title, children }: { title: string, children: React.ReactNode }) => (
    <div className="space-y-1.5">
      <h4 className="font-medium text-xs text-muted-foreground px-2 uppercase tracking-wider">{title}</h4>
      {children}
    </div>
  )

  const SelectItemCustom = ({ 
    label, 
    isSelected, 
    onClick 
  }: { 
    label: string, 
    isSelected: boolean, 
    onClick: () => void 
  }) => (
    <div 
      onClick={onClick}
      className={cn(
        "flex items-center justify-between px-2 py-1.5 text-sm rounded-md cursor-pointer transition-colors",
        isSelected ? "bg-primary/10 text-primary font-medium" : "hover:bg-muted text-foreground"
      )}
    >
      <span>{label}</span>
      {isSelected && <Check className="h-3.5 w-3.5" />}
    </div>
  )

  return (
    <div className="w-full space-y-4">
      <div className="flex flex-col md:flex-row gap-3 items-center justify-between bg-card border border-border p-1.5 rounded-4xl shadow-sm">
        
        {/* Área Principal: Busca + Finalidade */}
        <div className="flex flex-1 items-center gap-2 w-full">
          <div className="relative flex-1 min-w-[200px]">
            <button 
              onClick={handleSearchTrigger}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-primary transition-colors cursor-pointer p-1 rounded-md"
              title="Buscar"
            >
              <Search className="h-4 w-4" />
            </button>
            <Input
              type="text"
              placeholder="Buscar atendimentos (Aperte Enter)..."
              className="pl-10 h-10 w-full bg-background/50 border-transparent focus:bg-background transition-all rounded-xl"
              value={localSearch}
              onChange={e => setLocalSearch(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter') {
                  handleSearchTrigger()
                }
              }}
            />
          </div>

          <div className="hidden sm:flex bg-muted/30 p-1 rounded-xl border border-border/20">
            <button
              onClick={() => onFilterChange("purpose", "Todos")}
              className={cn(
                "px-3 py-1.5 text-xs font-medium rounded-lg transition-all",
                filters.purpose === "Todos"
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground hover:bg-background/50"
              )}
            >
              Todos
            </button>
            {purposes.map(p => (
              <button
                key={p}
                onClick={() => onFilterChange("purpose", p)}
                className={cn(
                  "px-3 py-1.5 text-xs font-medium rounded-lg transition-all",
                  filters.purpose === p
                    ? "bg-background text-primary shadow-sm font-semibold"
                    : "text-muted-foreground hover:text-foreground hover:bg-background/50"
                )}
              >
                {p}
              </button>
            ))}
          </div>
        </div>

        {/* Botões de Filtro e Data */}
        <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto pb-1 md:pb-0 no-scrollbar">
          
          {/* Botão Principal de Filtros (Popover) */}
          <Popover>
            <PopoverTrigger asChild>
              <Button 
                variant="outline" 
                className={cn(
                  "h-10 rounded-xl border-dashed border-border px-3 gap-2 hover:bg-muted/50",
                  activeFiltersCount > 0 && "border-solid border-primary/20 bg-primary/5 text-primary hover:bg-primary/10"
                )}
              >
                <Filter className="h-4 w-4" />
                <span className="hidden sm:inline">Filtros</span>
                {activeFiltersCount > 0 && (
                  <Badge variant="secondary" className="h-5 px-1.5 text-[10px] min-w-[1.25rem] justify-center ml-0.5 bg-primary text-primary-foreground rounded-md">
                    {activeFiltersCount}
                  </Badge>
                )}
                <ChevronDown className="h-3 w-3 opacity-50 ml-1" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[320px] p-4 rounded-xl shadow-lg border-border/60" align="end">
              <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold text-sm">Filtros Avançados</h3>
                  {activeFiltersCount > 0 && (
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={onClearFilters} 
                      className="h-6 px-2 text-xs text-muted-foreground hover:text-destructive"
                    >
                      Limpar
                    </Button>
                  )}
                </div>

                <FilterSection title="Localização">
                  <div className="grid grid-cols-2 gap-2">
                    {cities.map(c => (
                      <SelectItemCustom 
                        key={c} 
                        label={c} 
                        isSelected={filters.city === c} 
                        onClick={() => onFilterChange("city", c)} 
                      />
                    ))}
                  </div>
                </FilterSection>

                <Separator className="bg-border/60" />

                <FilterSection title="Equipe">
                    <select 
                        className="w-full h-10 px-3 text-sm bg-background rounded-lg border border-border focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all cursor-pointer"
                        value={filters.team}
                        onChange={(e) => onFilterChange("team", e.target.value)}
                     >
                       <option value="">Todas as Equipes</option>
                       {teams.map(t => <option key={t} value={t}>{t}</option>)}
                     </select>
                </FilterSection>

                <FilterSection title="Corretor">
                     <select 
                        className="w-full p-2 text-sm bg-muted/30 rounded-md border border-border outline-none focus:ring-2 focus:ring-primary/20"
                        value={filters.brokerId}
                        onChange={(e) => onFilterChange("brokerId", e.target.value)}
                     >
                       <option value="">Todos os Corretores</option>
                       {brokers.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                     </select>
                </FilterSection>
                
                 <FilterSection title="Situação">
                    <div className="flex flex-wrap gap-2">
                      {statuses.map(s => (
                         <div
                            key={s}
                            onClick={() => onFilterChange("status", filters.status === s ? "" : s)}
                            className={cn(
                              "text-xs px-2.5 py-1 rounded-full border cursor-pointer transition-all",
                              filters.status === s 
                                ? "bg-primary/10 border-primary text-primary font-medium" 
                                : "bg-background border-border text-muted-foreground hover:bg-muted"
                            )}
                         >
                            {s}
                         </div>
                      ))}
                    </div>
                </FilterSection>

              </div>
            </PopoverContent>
          </Popover>

          {/* Seletor de Data (Compacto) */}
          <Popover>
             <PopoverTrigger asChild>
                <Button 
                   variant="outline" 
                   className={cn(
                     "h-10 rounded-xl border-dashed border-border px-3 gap-2 min-w-[40px] hover:bg-muted/50",
                     (filters.dateStart || filters.dateEnd) && "border-solid border-primary/20 bg-primary/5 text-primary"
                   )}
                >
                   <CalendarDays className="h-4 w-4" />
                   {(filters.dateStart || filters.dateEnd) ? (
                      <span className="text-xs font-medium hidden sm:inline">
                         {filters.dateStart ? formatDateDisplay(filters.dateStart) : "..."} 
                         {" - "} 
                         {filters.dateEnd ? formatDateDisplay(filters.dateEnd) : "..."}
                      </span>
                   ) : (
                      <span className="text-xs hidden sm:inline text-muted-foreground">Período</span>
                   )}
                </Button>
             </PopoverTrigger>
             <PopoverContent className="w-auto p-0" align="end">
                <div className="p-3 border-b border-border/50 bg-muted/20">
                    <h4 className="text-xs font-medium text-muted-foreground mb-2 uppercase">Selecione o Intervalo</h4>
                    <div className="flex gap-2">
                        <div className="space-y-1">
                            <span className="text-[10px] text-muted-foreground ml-1">Início</span>
                            <Input 
                                type="date" 
                                className="h-8 text-xs w-[130px]"
                                value={filters.dateStart}
                                onChange={(e) => onFilterChange("dateStart", e.target.value)}
                            />
                        </div>
                        <div className="space-y-1">
                            <span className="text-[10px] text-muted-foreground ml-1">Fim</span>
                            <Input 
                                type="date" 
                                className="h-8 text-xs w-[130px]"
                                value={filters.dateEnd}
                                onChange={(e) => onFilterChange("dateEnd", e.target.value)}
                            />
                        </div>
                    </div>
                </div>
             </PopoverContent>
          </Popover>

          {activeFiltersCount > 0 && (
             <Button
                variant="ghost"
                size="icon"
                onClick={onClearFilters}
                className="h-10 w-10 rounded-xl hover:bg-destructive/10 hover:text-destructive shrink-0"
                title="Limpar todos os filtros"
             >
                <X className="h-4 w-4" />
             </Button>
          )}

        </div>
      </div>
      
      {/* Badges de Filtros Ativos (Feedback Visual Rápido) */}
      {activeFiltersCount > 0 && (
         <div className="flex flex-wrap gap-2 px-1">
            {filters.city && (
               <Badge variant="secondary" className="bg-background border border-border/60 text-muted-foreground font-normal gap-1 hover:bg-muted pl-2">
                  Cidade: <span className="text-foreground font-medium">{filters.city}</span>
                  <X className="h-3 w-3 ml-1 cursor-pointer hover:text-foreground" onClick={() => onFilterChange("city", "")} />
               </Badge>
            )}
            {filters.team && (
               <Badge variant="secondary" className="bg-background border border-border/60 text-muted-foreground font-normal gap-1 hover:bg-muted pl-2">
                  Equipe: <span className="text-foreground font-medium">{filters.team}</span>
                  <X className="h-3 w-3 ml-1 cursor-pointer hover:text-foreground" onClick={() => onFilterChange("team", "")} />
               </Badge>
            )}
            {filters.phase && (
                <Badge variant="secondary" className="bg-background border border-border/60 text-muted-foreground font-normal gap-1 hover:bg-muted pl-2">
                  Fase: <span className="text-foreground font-medium">{phases.find(p => p.id.toString() === filters.phase)?.label}</span>
                  <X className="h-3 w-3 ml-1 cursor-pointer hover:text-foreground" onClick={() => onFilterChange("phase", "")} />
               </Badge>
            )}
             {filters.status && (
                <Badge variant="secondary" className="bg-background border border-border/60 text-muted-foreground font-normal gap-1 hover:bg-muted pl-2">
                  Status: <span className="text-foreground font-medium">{filters.status}</span>
                  <X className="h-3 w-3 ml-1 cursor-pointer hover:text-foreground" onClick={() => onFilterChange("status", "")} />
               </Badge>
            )}
            {filters.brokerId && (
                <Badge variant="secondary" className="bg-background border border-border/60 text-muted-foreground font-normal gap-1 hover:bg-muted pl-2">
                  Corretor: <span className="text-foreground font-medium truncate max-w-[100px]">{brokers.find(b => b.id.toString() === filters.brokerId)?.name}</span>
                  <X className="h-3 w-3 ml-1 cursor-pointer hover:text-foreground" onClick={() => onFilterChange("brokerId", "")} />
               </Badge>
            )}
            {filters.search && (
                <Badge variant="secondary" className="bg-background border border-border/60 text-muted-foreground font-normal gap-1 hover:bg-muted pl-2">
                  Busca: <span className="text-foreground font-medium truncate max-w-[150px]">{filters.search}</span>
                  <X className="h-3 w-3 ml-1 cursor-pointer hover:text-foreground" onClick={() => onFilterChange("search", "")} />
               </Badge>
            )}
         </div>
      )}
    </div>
  )
}