"use client"

import { Search, X } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"

interface FiltersProps {
  filters: any
  onFilterChange: (key: string, value: string) => void
  cities: string[]
  types: string[]
}

export function PropertyFilters({ filters, onFilterChange, cities, types }: FiltersProps) {
  
  return (
    <div className="space-y-4">
      <div className="flex flex-col xl:flex-row gap-3">
        
        {/* Busca Principal */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input 
            placeholder="Buscar por código, endereço ou condomínio..." 
            className="pl-9 bg-card border-input"
            value={filters.search}
            onChange={(e) => onFilterChange("search", e.target.value)}
          />
        </div>

        {/* Grupo de Selects */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 xl:w-auto">
            {/* Cidade */}
            <Select value={filters.city} onValueChange={(val) => onFilterChange("city", val)}>
            <SelectTrigger className="w-full bg-card"><SelectValue placeholder="Cidade" /></SelectTrigger>
            <SelectContent>
                {cities.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
            </SelectContent>
            </Select>

             {/* Status (Situação) */}
            <Select value={filters.status} onValueChange={(val) => onFilterChange("status", val)}>
            <SelectTrigger className="w-full bg-card"><SelectValue placeholder="Situação" /></SelectTrigger>
            <SelectContent>
                <SelectItem value="Todos">Todos Status</SelectItem>
                <SelectItem value="Vago/Disponível">Disponíveis</SelectItem>
                <SelectItem value="Vendido">Vendidos</SelectItem>
                <SelectItem value="Desativado">Desativados</SelectItem>
            </SelectContent>
            </Select>

            {/* Tipo */}
            <Select value={filters.type} onValueChange={(val) => onFilterChange("type", val)}>
            <SelectTrigger className="w-full bg-card"><SelectValue placeholder="Tipo" /></SelectTrigger>
            <SelectContent>
                <SelectItem value="Todos">Todos Tipos</SelectItem>
                {types.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
            </SelectContent>
            </Select>

            {/* Bairro (Input Simples por enquanto) */}
            <Input 
                placeholder="Bairro..." 
                className="bg-card"
                value={filters.neighborhood}
                onChange={(e) => onFilterChange("neighborhood", e.target.value)}
            />
        </div>
      </div>

      {/* Linha de Preço (Opcional) */}
      <div className="flex items-center gap-2 text-sm">
         <span className="text-muted-foreground font-medium">Faixa de Preço:</span>
         <Input 
            type="number" placeholder="Mín" className="w-24 h-8 text-xs" 
            value={filters.minPrice} onChange={(e) => onFilterChange("minPrice", e.target.value)}
         />
         <span className="text-muted-foreground">-</span>
         <Input 
            type="number" placeholder="Máx" className="w-24 h-8 text-xs" 
            value={filters.maxPrice} onChange={(e) => onFilterChange("maxPrice", e.target.value)}
         />
         {(filters.minPrice || filters.maxPrice || filters.search || filters.neighborhood) && (
             <Button variant="ghost" size="sm" onClick={() => {
                 onFilterChange("minPrice", "")
                 onFilterChange("maxPrice", "")
                 onFilterChange("search", "")
                 onFilterChange("neighborhood", "")
             }} className="h-8 ml-2 text-red-500 hover:text-red-600 hover:bg-red-50">
                <X size={12} className="mr-1"/> Limpar
             </Button>
         )}
      </div>
    </div>
  )
}