import { Search, Filter, X } from "lucide-react"
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
  return (
    <div className="bg-card p-4 rounded-2xl border border-border shadow-sm space-y-4 md:space-y-0 md:flex md:items-center md:gap-4">
      {/* Área de Busca */}
      <div className="relative flex-1">
        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground bg-card/50 p-0.5 rounded-md">
          <Search size={16} strokeWidth={2.5} />
        </div>
        <Input 
          placeholder="Buscar por nome ou ID..." 
          className="pl-10 h-12 rounded-xl bg-muted/30 border-muted-foreground/20 focus-visible:bg-background focus-visible:border-primary transition-all font-medium"
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
        />
      </div>

      {/* Separador Mobile */}
      <div className="md:hidden">
        <Separator />
      </div>

      {/* Filtros Dropdown */}
      <div className="flex flex-col sm:flex-row gap-3">
        <Select value={cityFilter} onValueChange={onCityChange}>
          <SelectTrigger className="w-full sm:w-[180px] h-12 rounded-xl bg-muted/30 border-muted-foreground/20 font-medium">
            <div className="flex items-center gap-2 truncate">
              <Filter size={14} className="text-muted-foreground" />
              <SelectValue placeholder="Cidade" />
            </div>
          </SelectTrigger>
          <SelectContent className="rounded-xl shadow-lg border-border/50">
            <SelectItem value="all" className="font-medium">Todas as Cidades</SelectItem>
            {cities.map(city => (
              <SelectItem key={city} value={city} className="font-medium">{city}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={statusFilter} onValueChange={onStatusChange}>
          <SelectTrigger className="w-full sm:w-[180px] h-12 rounded-xl bg-muted/30 border-muted-foreground/20 font-medium">
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${statusFilter === 'active' ? 'bg-emerald-500' : statusFilter === 'inactive' ? 'bg-red-500' : 'bg-slate-400'}`} />
              <SelectValue placeholder="Status" />
            </div>
          </SelectTrigger>
          <SelectContent className="rounded-xl shadow-lg border-border/50">
            <SelectItem value="all" className="font-medium">Todos os Status</SelectItem>
            <SelectItem value="active" className="font-medium text-emerald-600">Ativos</SelectItem>
            <SelectItem value="inactive" className="font-medium text-red-600">Inativos</SelectItem>
          </SelectContent>
        </Select>

        {/* Botão Limpar Filtros */}
        {hasActiveFilters && (
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={onClearFilters}
            className="h-12 w-12 rounded-xl text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors shrink-0"
            title="Limpar filtros"
          >
            <X size={20} />
          </Button>
        )}
      </div>
    </div>
  )
}