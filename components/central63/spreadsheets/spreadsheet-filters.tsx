"use client";

import React from "react";
import { Search, Plus, Filter } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface SpreadsheetFiltersProps {
  onSearch: (query: string) => void;
}

export function SpreadsheetFilters({ onSearch }: SpreadsheetFiltersProps) {
  return (
    <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
      <div className="relative flex-1 max-w-sm">
        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Pesquisar planilhas..."
          className="pl-8 bg-background"
          onChange={(e) => onSearch(e.target.value)}
        />
      </div>
      
      <div className="flex items-center gap-2">
        <Button variant="outline" size="sm" className="h-10 gap-1 text-xs">
          <Filter className="h-3.5 w-3.5" />
          Filtros
        </Button>
        <Button size="sm" className="h-10 gap-1 text-xs bg-primary">
          <Plus className="h-3.5 w-3.5" />
          Nova Planilha
        </Button>
      </div>
    </div>
  );
}