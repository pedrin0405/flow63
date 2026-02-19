import { useState } from "react"
import { Search, Filter, X, ChevronDown } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { cn } from "@/lib/utils"

interface BrokerFiltersProps {
  searchTerm: string
  onSearchChange: (value: string) => void
  cityFilter: string
  onCityChange: (value: string) => void
  statusFilter: string
  onStatusChange: (value: string) => void
  cities: string[]
  onClearFilters: () => void
  hasActiveFilters: boolean
}

export function BrokerFilters({
  searchTerm,
  onSearchChange,
  cityFilter,
  onCityChange,
  statusFilter,
  onStatusChange,
  cities,
  onClearFilters,
  hasActiveFilters
}: BrokerFiltersProps) {
  const [localSearch, setLocalSearch] = useState(searchTerm)

  const handleSearchTrigger = () => {
    onSearchChange(localSearch)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSearchTrigger()
  }

  return (
    <div className="bg-card/50 backdrop-blur-sm p-2 rounded-3xl border border-border shadow-lg space-y-3 md:space-y-0 md:flex md:items-center md:gap-3">
      {/* Campo de Busca Principal */}
      <div className="flex-1 flex items-center gap-2 pl-2">
        <div className="relative flex-1 group">
          <Search 
            size={18} 
            className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors" 
          />
          <Input 
            placeholder="Nome ou ID do corretor..." 
            className="pl-10 h-11 border-none bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 text-sm font-medium placeholder:text-muted-foreground/60"
            value={localSearch}
            onChange={(e) => setLocalSearch(e.target.value)}
            onKeyDown={handleKeyDown}
          />
        </div>
        
        <Button 
          onClick={handleSearchTrigger}
          size="sm"
          className="h-10 px-5 rounded-2xl font-bold bg-primary hover:bg-primary/90 text-primary-foreground shadow-sm transition-all active:scale-95"
        >
          Pesquisar
        </Button>
      </div>

      <div className="hidden md:block h-6 w-[1px] bg-border/60" />

      {/* Controles de Filtro Avançados */}
      <div className="flex items-center gap-2 px-2 pb-2 md:pb-0">
        <Select value={cityFilter} onValueChange={onCityChange}>
          <SelectTrigger className="w-full md:w-[160px] h-10 rounded-2xl bg-muted/50 border-none hover:bg-muted transition-colors text-xs font-semibold">
            <div className="flex items-center gap-2">
              <Filter size={14} className="text-primary" />
              <SelectValue placeholder="Cidade" />
            </div>
          </SelectTrigger>
          <SelectContent className="rounded-2xl">
            <SelectItem value="all">Todas as Cidades</SelectItem>
            {cities.map(city => (
              <SelectItem key={city} value={city}>{city}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={statusFilter} onValueChange={onStatusChange}>
          <SelectTrigger className="w-full md:w-[150px] h-10 rounded-2xl bg-muted/50 border-none hover:bg-muted transition-colors text-xs font-semibold">
            <div className="flex items-center gap-2">
              <span className={cn(
                "w-2 h-2 rounded-full",
                statusFilter === 'active' ? "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" : 
                statusFilter === 'inactive' ? "bg-rose-500" : "bg-slate-400"
              )} />
              <SelectValue placeholder="Status" />
            </div>
          </SelectTrigger>
          <SelectContent className="rounded-2xl">
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="active">Ativos</SelectItem>
            <SelectItem value="inactive">Inativos</SelectItem>
          </SelectContent>
        </Select>

        {hasActiveFilters && (
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => { setLocalSearch(""); onClearFilters(); }}
            className="h-10 w-10 rounded-2xl text-muted-foreground hover:bg-rose-50 hover:text-rose-600 transition-all"
          >
            <X size={18} />
          </Button>
        )}
      </div>
    </div>
  )
}