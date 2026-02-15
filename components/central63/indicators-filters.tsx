'use client';

import React, { useEffect, useState, useCallback, useRef } from 'react';
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { 
  Filter, 
  ChevronDown, 
  Users, 
  Tag, 
  CalendarDays, 
  MapPin, 
  Target,
  RotateCcw,
  Search
} from "lucide-react";
import { cn } from "@/lib/utils";
import { format, parse } from "date-fns";
import { ptBR } from "date-fns/locale";

interface Option { Codigo: number; Nome: string; Cor?: string; }

export function IndicatorsFilters({ onFilterChange }: { onFilterChange: (filters: string) => void }) {
  const [equipes, setEquipes] = useState<Option[]>([]);
  const [corretores, setCorretores] = useState<Option[]>([]);
  const [etiquetas, setEtiquetas] = useState<Option[]>([]);
  const [loading, setLoading] = useState<{ [key: string]: boolean }>({});
  
  // Estados para busca interna nos filtros (Otimização para listas grandes)
  const [searchTerms, setSearchTerms] = useState({ equipes: "", corretores: "", etiquetas: "" });

  const currentMonth = (new Date().getMonth() + 1).toString();
  
  const initialFilters = {
    Finalidade: "2",
    CodigoUnidade: "1048",
    CodigoEquipe: [] as number[],
    Corretores: [] as number[],
    Etiquetas: [] as number[],
    Mes: currentMonth,
    Ano: new Date().getFullYear().toString(),
    DataInicial: "",
    DataFinal: "",
    ConsiderarNosDemaisIndicadores: "true",
    Situacao: "undefined",
    Funil: "0"
  };

  const [filters, setFilters] = useState(initialFilters);

  const handleClearFilters = () => setFilters(initialFilters);

  const handleDateSelect = (date: Date | undefined, field: 'DataInicial' | 'DataFinal') => {
    if (!date) return;
    setFilters(prev => ({ ...prev, [field]: format(date, "dd/MM/yyyy") }));
  };

  /**
   * CARREGAMENTO OTIMIZADO: Dispara todas as requisições em paralelo.
   * Se uma API falhar, as outras continuam funcionando.
   */
  const loadFilterOptions = useCallback(async () => {
    setLoading({ getEquipes: true, getCorretores: true, getEtiquetas: true });

    const payload = {
      filters: {
        Finalidade: filters.Finalidade,
        CodigoUnidade: filters.CodigoUnidade,
        CodigoEquipe: filters.CodigoEquipe.join(',')
      }
    };

    // Função auxiliar para dar um pequeno intervalo entre chamadas
    const delay = (ms: number) => new Promise(res => setTimeout(res, ms));

    try {
      // 1. Carrega Equipes Primeiro
      const resEquipes = await fetch('/api/imoview/indicators', { 
          method: 'POST', 
          body: JSON.stringify({ action: "getEquipes", ...payload }) 
      });
      if (resEquipes.ok) setEquipes(await resEquipes.ok ? await resEquipes.json() : []);
      setLoading(prev => ({ ...prev, getEquipes: false }));

      await delay(2000); // Respiro para o servidor

      // 2. Carrega Corretores
      const resCorretores = await fetch('/api/imoview/indicators', { 
          method: 'POST', 
          body: JSON.stringify({ action: "getCorretores", ...payload }) 
      });
      if (resCorretores.ok) setCorretores(await resCorretores.json());
      setLoading(prev => ({ ...prev, getCorretores: false }));

      await delay(300); // Respiro para o servidor

      // 3. Carrega Etiquetas
      const resEtiquetas = await fetch('/api/imoview/indicators', { 
          method: 'POST', 
          body: JSON.stringify({ action: "getEtiquetas", ...payload }) 
      });
      if (resEtiquetas.ok) setEtiquetas(await resEtiquetas.json());
      
    } catch (e) {
      console.error("Erro na sequência de filtros:", e);
    } finally {
      setLoading({ getEquipes: false, getCorretores: false, getEtiquetas: false });
    }
  }, [filters.Finalidade, filters.CodigoUnidade, filters.CodigoEquipe.join(',')]);

  useEffect(() => {
    loadFilterOptions();
  }, [loadFilterOptions]);

  const handleApply = () => {
    const params = new URLSearchParams({
      Finalidade: filters.Finalidade,
      CodigoUnidade: filters.CodigoUnidade,
      CodigoEquipe: filters.CodigoEquipe.join(','),
      Corretores: filters.Corretores.join(','),
      Etiquetas: filters.Etiquetas.join(','),
      Mes: filters.Mes,
      Ano: filters.Ano,
      ConsiderarNosDemaisIndicadores: filters.ConsiderarNosDemaisIndicadores,
      Situacao: filters.Situacao,
      Funil: filters.Funil
    });

    if (filters.Mes === "customizado") {
      params.append("PeriodoCustomizado", "true");
      params.append("DataInicial", filters.DataInicial);
      params.append("DataFinal", filters.DataFinal);
    }
    onFilterChange(params.toString());
  };

  const toggleSelection = (list: number[], id: number) => 
    list.includes(id) ? list.filter(item => item !== id) : [...list, id];

  const meses = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];

  // Renderizador de lista com busca interna
  const renderFilterList = (options: Option[], key: keyof typeof filters, searchKey: keyof typeof searchTerms) => {
    const filtered = options.filter(opt => 
        opt.Nome.toLowerCase().includes(searchTerms[searchKey].toLowerCase())
    );

    return (
      <div className="space-y-2">
        <div className="sticky top-0 bg-white/95 backdrop-blur-sm pb-2 z-10">
            <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                <input 
                    className="w-full pl-9 pr-3 py-2 bg-gray-50 border border-gray-100 rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    placeholder="Buscar..."
                    value={searchTerms[searchKey]}
                    onChange={(e) => setSearchTerms({...searchTerms, [searchKey]: e.target.value})}
                />
            </div>
        </div>
        <div className="max-h-[250px] overflow-y-auto custom-scrollbar space-y-0.5">
          {filtered.length > 0 ? filtered.map((opt) => (
            <div 
              key={opt.Codigo} 
              className={cn(
                "flex items-center space-x-3 p-2.5 rounded-xl cursor-pointer transition-all", 
                /* @ts-ignore */
                filters[key].includes(opt.Codigo) ? "bg-indigo-600 text-white shadow-md font-bold" : "hover:bg-gray-100 text-gray-700"
              )} 
              onClick={() => setFilters({...filters, [key]: toggleSelection(filters[key] as any, opt.Codigo)})}
            >
              <span className="text-[13px] truncate flex-1">{opt.Nome}</span>
              {/* @ts-ignore */}
              {filters[key].includes(opt.Codigo) && <div className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />}
            </div>
          )) : <div className="p-4 text-center text-xs text-gray-400">Nenhum resultado</div>}
        </div>
      </div>
    );
  };

  return (
    <div className="bg-white/90 backdrop-blur-md p-4 rounded-3xl border border-gray-200 shadow-[0_20px_50px_rgba(0,0,0,0.12)] mb-8 transition-all">
      <div className="flex flex-wrap items-center gap-3">
        
        {/* UNIDADE */}
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" className="h-10 rounded-2xl border-gray-200 bg-white hover:bg-gray-50 flex items-center gap-2 px-4 shadow-sm flex-1 sm:flex-none min-w-[130px]">
              <MapPin className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
              <span className="text-[12px] font-bold text-gray-700 uppercase truncate">
                {filters.CodigoUnidade === "1048" ? "Palmas" : "Agro"}
              </span>
              <ChevronDown className="w-3 h-3 text-gray-400 ml-auto shrink-0" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-[180px] p-1 rounded-xl shadow-2xl border-gray-100" align="start">
            {[{ label: "Palmas", value: "1048" }, { label: "Agro", value: "8027" }].map((item) => (
              <div key={item.value} className={cn("flex items-center p-2.5 rounded-xl cursor-pointer text-sm transition-all", filters.CodigoUnidade === item.value ? "bg-indigo-600 text-white font-bold" : "hover:bg-gray-100 text-gray-600")} onClick={() => setFilters({...filters, CodigoUnidade: item.value})}>
                {item.label}
              </div>
            ))}
          </PopoverContent>
        </Popover>

        {/* FINALIDADE */}
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" className="h-10 rounded-2xl border-gray-200 bg-white hover:bg-gray-50 flex items-center gap-2 px-4 shadow-sm flex-1 sm:flex-none min-w-[110px]">
              <Target className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
              <span className="text-[12px] font-bold text-gray-700 uppercase truncate">
                {filters.Finalidade === "2" ? "Venda" : "Aluguel"}
              </span>
              <ChevronDown className="w-3 h-3 text-gray-400 ml-auto shrink-0" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-[150px] p-1 rounded-xl shadow-2xl border-gray-100" align="start">
            {[{ label: "Venda", value: "2" }, { label: "Aluguel", value: "1" }].map((item) => (
              <div key={item.value} className={cn("flex items-center p-2.5 rounded-xl cursor-pointer text-sm transition-all", filters.Finalidade === item.value ? "bg-indigo-600 text-white font-bold" : "hover:bg-gray-100 text-gray-600")} onClick={() => setFilters({...filters, Finalidade: item.value})}>
                {item.label}
              </div>
            ))}
          </PopoverContent>
        </Popover>

        {/* PERÍODO */}
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" className={cn(
              "h-10 rounded-2xl border-gray-200 bg-white hover:bg-gray-50 flex items-center gap-2 px-4 shadow-sm flex-1 sm:flex-none min-w-[160px]",
              filters.Mes === "customizado" && "border-indigo-200 bg-indigo-50/30 ring-1 ring-indigo-200"
            )}>
              <CalendarDays className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
              <span className="text-[12px] font-bold text-gray-700 uppercase truncate">
                {filters.Mes === "customizado" ? "Personalizado" : meses[parseInt(filters.Mes)-1]}
              </span>
              <ChevronDown className="w-3 h-3 text-gray-400 ml-auto shrink-0" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-[280px] p-4 rounded-3xl shadow-2xl border-gray-100 backdrop-blur-xl bg-white/95" align="start">
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-1.5">
                <Button 
                  variant="ghost" 
                  className={cn("col-span-3 h-8 rounded-xl text-xs font-bold transition-all", filters.Mes === "customizado" ? "bg-indigo-600 text-white" : "bg-indigo-50 text-indigo-700 hover:bg-indigo-100")} 
                  onClick={() => setFilters({...filters, Mes: "customizado"})}
                >
                  Intervalo Personalizado
                </Button>
                {meses.map((m, i) => (
                  <div key={i} className={cn("p-2 rounded-xl cursor-pointer text-[11px] text-center transition-all", filters.Mes === (i+1).toString() ? "bg-indigo-600 text-white font-bold" : "hover:bg-gray-100 text-gray-600")} onClick={() => setFilters({...filters, Mes: (i+1).toString()})}>
                    {m}
                  </div>
                ))}
              </div>

              {filters.Mes === "customizado" && (
                <div className="pt-3 border-t border-gray-100 space-y-2 animate-in fade-in slide-in-from-top-1">
                  <div className="flex items-center justify-between gap-2">
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="outline" className="h-9 flex-1 text-[10px] font-bold rounded-xl border-indigo-100 bg-white">
                          {filters.DataInicial || "Início"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="p-0 border-none shadow-2xl" side="bottom">
                        <Calendar mode="single" locale={ptBR} selected={filters.DataInicial ? parse(filters.DataInicial, "dd/MM/yyyy", new Date()) : undefined} onSelect={(d) => handleDateSelect(d, 'DataInicial')} initialFocus />
                      </PopoverContent>
                    </Popover>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="outline" className="h-9 flex-1 text-[10px] font-bold rounded-xl border-indigo-100 bg-white">
                          {filters.DataFinal || "Fim"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="p-0 border-none shadow-2xl" side="bottom">
                        <Calendar mode="single" locale={ptBR} selected={filters.DataFinal ? parse(filters.DataFinal, "dd/MM/yyyy", new Date()) : undefined} onSelect={(d) => handleDateSelect(d, 'DataFinal')} initialFocus />
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>
              )}
              
              <div className="pt-3 border-t border-gray-100 flex items-center justify-between">
                <span className="text-[10px] font-bold text-gray-400 uppercase">Ano</span>
                <input className="w-16 bg-gray-50 rounded-lg px-2 py-1 text-xs font-bold focus:outline-none border border-gray-100 text-center" type="number" value={filters.Ano} onChange={(e) => setFilters({...filters, Ano: e.target.value})} />
              </div>
            </div>
          </PopoverContent>
        </Popover>

        {/* MULTI-SELECTS (Equipes, Corretores, Etiquetas) */}
        <div className="flex flex-wrap gap-2 md:gap-3 flex-1">
          {[
            { label: "Equipes", options: equipes, key: "CodigoEquipe", icon: Users, loadingKey: "getEquipes", searchKey: "equipes" as const },
            { label: "Corretores", options: corretores, key: "Corretores", icon: Users, loadingKey: "getCorretores", searchKey: "corretores" as const },
            { label: "Etiquetas", options: etiquetas, key: "Etiquetas", icon: Tag, loadingKey: "getEtiquetas", searchKey: "etiquetas" as const }
          ].map((col) => (
            <Popover key={col.key}>
              <PopoverTrigger asChild>
                <Button variant="outline" className={cn(
                  "h-10 rounded-2xl border-gray-200 bg-white hover:bg-gray-50 flex items-center gap-2 px-3 shadow-sm flex-1 min-w-[135px] transition-all",
                  /* @ts-ignore */
                  filters[col.key].length > 0 && "border-indigo-200 bg-indigo-50/30 ring-1 ring-indigo-200"
                )}>
                  <div className="flex items-center gap-2 overflow-hidden w-full">
                    {loading[col.loadingKey] ? (
                      <RotateCcw className="w-3.5 h-3.5 text-indigo-400 animate-spin shrink-0" />
                    ) : (
                      /* @ts-ignore */
                      filters[col.key].length > 0 ? (
                        <span className="bg-indigo-600 text-white text-[10px] font-black h-5 w-5 shrink-0 rounded-full flex items-center justify-center animate-in zoom-in">
                          {/* @ts-ignore */}
                          {filters[col.key].length}
                        </span>
                      ) : <col.icon className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                    )}
                    <span className="text-[12px] font-bold text-gray-600 uppercase tracking-tight truncate flex-1 text-left">
                      {col.label}
                    </span>
                    <ChevronDown className="w-3 h-3 text-gray-400 ml-auto shrink-0" />
                  </div>
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[300px] p-2 rounded-2xl shadow-2xl border-gray-100 backdrop-blur-xl bg-white/95" align="start">
                {loading[col.loadingKey] && col.options.length === 0 ? (
                    <div className="p-8 text-center space-y-2">
                        <RotateCcw className="w-6 h-6 text-indigo-500 animate-spin mx-auto" />
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Sincronizando Imoview</p>
                    </div>
                ) : renderFilterList(col.options, col.key as any, col.searchKey)}
              </PopoverContent>
            </Popover>
          ))}
        </div>

        {/* AÇÃO */}
        <div className="flex items-center gap-2 ml-auto w-full lg:w-auto">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={handleClearFilters}
            className="h-11 w-11 rounded-2xl text-gray-400 hover:text-red-500 hover:bg-red-50 transition-all shrink-0"
            title="Limpar Filtros"
          >
            <RotateCcw className="w-4 h-4" />
          </Button>

          <Button 
            onClick={handleApply} 
            className="h-11 px-8 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-2xl shadow-[0_10px_25px_rgba(79,70,229,0.3)] transition-all active:scale-95 gap-2 flex-1 lg:flex-none"
          >
            <Filter className="w-4 h-4" />
            <span>Sincronizar</span>
          </Button>
        </div>

      </div>
    </div>
  );
}