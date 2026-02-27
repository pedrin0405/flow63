"use client";

import React, { useState, useEffect, useMemo } from "react";
import { Sidebar } from "@/components/central63/sidebar";
import { 
  LayoutDashboard, Search, Plus, BarChart3, Loader2, 
  MoreHorizontal, Trash2, Eye, Calendar, Database, 
  Layers, User, ArrowUpRight, LayoutGrid, List as ListIcon,
  Filter, Activity, TrendingUp, Briefcase
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger,
  DropdownMenuSeparator 
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { NewDashboardModal } from "@/components/central63/dashboards/new-dashboard-modal";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";

export default function DashboardsPage() {
  const router = useRouter();
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [searchQuery, setSearchQuery] = useState("");
  const [unitFilter, setUnitFilter] = useState("all");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [dashboards, setDashboards] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const fetchDashboards = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('dashboard_data')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setDashboards(data || []);
    } catch (error: any) {
      toast.error("Erro ao carregar dashboards: " + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboards();
  }, []);

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if(!confirm("Deseja excluir permanentemente este dashboard?")) return;
    try {
      const { error } = await supabase.from('dashboard_data').delete().eq('id', id);
      if (error) throw error;
      toast.success("Dashboard removido.");
      fetchDashboards();
    } catch (error) {
      toast.error("Erro ao excluir.");
    }
  };

  const filteredDashboards = useMemo(() => {
    return dashboards.filter(d => {
      const matchesSearch = d.nome?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          d.unidade?.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesUnit = unitFilter === "all" || d.unidade === unitFilter;
      return matchesSearch && matchesUnit;
    });
  }, [dashboards, searchQuery, unitFilter]);

  const units = useMemo(() => {
    return Array.from(new Set(dashboards.map(d => d.unidade).filter(Boolean)));
  }, [dashboards]);

  const stats = useMemo(() => {
    const total = dashboards.length;
    const configured = dashboards.filter(d => d.widgets_config?.length > 0).length;
    const unitsCount = new Set(dashboards.map(d => d.unidade)).size;
    return { total, configured, unitsCount };
  }, [dashboards]);

  return (
    <div className="flex h-screen bg-[#FAFAFA] dark:bg-background overflow-hidden font-sans text-foreground">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} activeTab="dashboards" onTabChange={() => {}} />
      
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
        <header className="bg-card border-b border-border px-6 py-4 flex items-center justify-between shadow-sm flex-shrink-0 z-20">
          <div className="flex items-center gap-4">
            <button className="lg:hidden p-2 text-muted-foreground hover:bg-accent rounded-lg" onClick={() => setSidebarOpen(true)}>
              <LayoutDashboard size={20} />
            </button>
            <div className="p-2 bg-indigo-50 rounded-xl text-indigo-600 hidden md:block">
                <BarChart3 size={24} />
            </div>
            <div>
                <h2 className="text-2xl font-bold text-foreground tracking-tight">Dashboards</h2>
                <p className="text-primary hidden sm:block">| Gerenciamento Analítico</p>
            </div>
          </div>
          
          <Button onClick={() => setIsModalOpen(true)} className="h-11 px-6 font-bold bg-primary text-white shadow-lg hover:bg-primary/90 rounded-xl transition-all active:scale-95">
            <Plus size={18} className="mr-2" /> 
            <span>Novo Painel</span>
          </Button>
        </header>

        <main className="flex-1 overflow-y-auto custom-scrollbar">
          <div className="max-w-[1600px] mx-auto p-6 md:p-8 space-y-8 pb-20">
            
            {/* Stats Header */}
            <div className="bg-white dark:bg-card rounded-2xl border shadow-sm p-1 grid grid-cols-2 md:grid-cols-4 divide-x divide-gray-100 dark:divide-gray-800">
              <div className="p-4 flex items-center gap-4">
                <div className="h-10 w-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center"><LayoutDashboard size={20} /></div>
                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Total</p>
                  <p className="text-xl font-bold tracking-tight">{stats.total}</p>
                </div>
              </div>
              <div className="p-4 flex items-center gap-4">
                <div className="h-10 w-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center"><Activity size={20} /></div>
                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Ativos</p>
                  <p className="text-xl font-bold tracking-tight">{stats.configured}</p>
                </div>
              </div>
              <div className="p-4 flex items-center gap-4">
                <div className="h-10 w-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center"><Briefcase size={20} /></div>
                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Setores</p>
                  <p className="text-xl font-bold tracking-tight">{stats.unitsCount}</p>
                </div>
              </div>
              <div className="p-4 flex items-center gap-4">
                <div className="h-10 w-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center"><TrendingUp size={20} /></div>
                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Status</p>
                  <span className="text-xs font-bold text-emerald-600">Sincronizado</span>
                </div>
              </div>
            </div>

            {/* Toolbar */}
            <div className="flex flex-col md:flex-row gap-4 justify-between items-center w-full">
              <div className="flex items-center gap-2 w-full md:flex-1 bg-white dark:bg-card p-1 rounded-xl border shadow-sm">
                 <div className="relative flex-1">
                   <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
                   <Input 
                     placeholder="Buscar por nome ou unidade..." 
                     className="pl-9 h-10 border-0 bg-transparent focus-visible:ring-0 w-full"
                     value={searchQuery}
                     onChange={(e) => setSearchQuery(e.target.value)}
                   />
                 </div>
                 
                 <div className="h-6 w-px bg-border mx-1" />
                 
                 <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                       <Button variant="ghost" size="sm" className="h-8 gap-2 text-muted-foreground">
                         <Filter size={14} />
                         <span className="text-xs font-medium hidden sm:inline-block">
                           {unitFilter === 'all' ? 'Unidades' : unitFilter}
                         </span>
                       </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-48">
                      <DropdownMenuItem onClick={() => setUnitFilter('all')}>Todas Unidades</DropdownMenuItem>
                      <DropdownMenuSeparator />
                      {units.map(unit => (
                        <DropdownMenuItem key={unit} onClick={() => setUnitFilter(unit)}>{unit}</DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                 </DropdownMenu>
              </div>

              <div className="flex items-center bg-white dark:bg-card border rounded-xl p-1 shadow-sm">
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={() => setViewMode('grid')}
                  className={`h-9 w-9 rounded-lg transition-all ${viewMode === 'grid' ? 'bg-gray-100 text-foreground' : 'text-muted-foreground'}`}
                >
                  <LayoutGrid size={18} />
                </Button>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={() => setViewMode('list')}
                  className={`h-9 w-9 rounded-lg transition-all ${viewMode === 'list' ? 'bg-gray-100 text-foreground' : 'text-muted-foreground'}`}
                >
                  <ListIcon size={18} />
                </Button>
              </div>
            </div>

            {isLoading ? (
              <div className="flex justify-center py-20"><Loader2 className="animate-spin text-primary" /></div>
            ) : filteredDashboards.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-24 text-center">
                <div className="bg-gray-50 p-4 rounded-full mb-3"><LayoutDashboard className="text-gray-300" size={32} /></div>
                <p className="text-muted-foreground font-medium">Nenhum painel encontrado.</p>
              </div>
            ) : (
              <>
                {/* --- MODO GRADE (PREMIUM CARDS) --- */}
                {viewMode === 'grid' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                    {filteredDashboards.map((item) => {
                      const hasWidgets = item.widgets_config?.length > 0;
                      
                      return (
                        <Card 
                          key={item.id} 
                          className="group relative border-0 shadow-sm hover:shadow-2xl transition-all duration-300 bg-white dark:bg-card overflow-hidden rounded-[1.5rem] ring-1 ring-slate-100 dark:ring-slate-800 hover:-translate-y-1"
                        >
                          {/* Efeito de Topo Colorido */}
                          <div className={`absolute top-0 left-0 right-0 h-24 opacity-30 bg-gradient-to-b ${
                            hasWidgets ? 'from-blue-100 to-transparent' : 'from-amber-100 to-transparent'
                          }`} />

                          <CardContent className="p-0 flex flex-col h-full relative z-10">
                            {/* Cabeçalho */}
                            <div className="p-6 pb-2 flex justify-between items-start">
                              <div className="flex gap-4">
                                <Avatar className={`h-14 w-14 ring-4 ring-white dark:ring-card shadow-sm ${hasWidgets ? 'bg-blue-50 text-blue-600' : 'bg-amber-50 text-amber-600'}`}>
                                  <AvatarFallback className="font-bold text-lg uppercase">
                                    {item.nome?.substring(0, 2)}
                                  </AvatarFallback>
                                </Avatar>
                                <div>
                                  <div className="flex items-center gap-2 mb-1">
                                    <Badge variant="secondary" className="font-mono text-[10px] px-1.5 h-5 bg-white/80 backdrop-blur border border-slate-200 text-slate-500 rounded-md">
                                      {item.id.substring(0,6).toUpperCase()}
                                    </Badge>
                                    <span className={`text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 ${hasWidgets ? 'text-blue-600' : 'text-amber-600'}`}>
                                      <span className={`w-1.5 h-1.5 rounded-full ${hasWidgets ? 'bg-blue-500' : 'bg-amber-500'}`} />
                                      {hasWidgets ? 'Configurado' : 'Pendente'}
                                    </span>
                                  </div>
                                  <h3 className="font-bold text-lg text-slate-800 dark:text-slate-100 leading-tight truncate w-60">
                                    {item.nome}
                                  </h3>
                                </div>
                              </div>

                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-slate-900 -mr-2 rounded-full">
                                    <MoreHorizontal size={18} />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="rounded-xl border-slate-100 shadow-xl w-48 p-1">
                                  <DropdownMenuItem onClick={() => router.push(`/custom-dashboard/${item.id}`)} className="rounded-lg py-2">
                                    <Eye size={16} className="mr-2 text-slate-500"/> Visualizar
                                  </DropdownMenuItem>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem onClick={(e) => handleDelete(item.id, e)} className="text-red-600 focus:text-red-700 rounded-lg py-2">
                                    <Trash2 size={16} className="mr-2"/> Excluir
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>

                            {/* Informações Centrais */}
                            <div className="px-6 py-4">
                              <div className="bg-slate-50 dark:bg-slate-900/50 rounded-2xl p-4 grid grid-cols-2 gap-4 border border-slate-100 dark:border-slate-800">
                                <div className="space-y-1">
                                  <p className="text-[10px] font-bold uppercase text-slate-400 tracking-wider flex items-center gap-1">
                                    <Activity size={10} /> Unidade
                                  </p>
                                  <p className="text-xs font-bold text-slate-700 dark:text-slate-300 truncate">
                                    {item.unidade || "Geral"}
                                  </p>
                                </div>
                                <div className="space-y-1">
                                  <p className="text-[10px] font-bold uppercase text-slate-400 tracking-wider flex items-center gap-1">
                                    <Layers size={10} /> Módulos
                                  </p>
                                  <p className="text-xs font-bold text-slate-700 dark:text-slate-300">
                                    {item.widgets_config?.length || 0} Widgets
                                  </p>
                                </div>
                                <div className="col-span-2 pt-2 border-t border-slate-200/50 flex items-center justify-between">
                                  <p className="text-[10px] font-medium text-slate-400 flex items-center gap-1.5">
                                    <Calendar size={10} /> 
                                    {new Date(item.created_at).toLocaleDateString('pt-BR')}
                                  </p>
                                  <p className="text-[10px] font-bold text-indigo-500 flex items-center gap-1">
                                    <User size={10} /> 
                                    {/* ALTERAÇÃO SOLICITADA: Nome do Criador */}
                                    {item.criado_por || "Anônimo"}
                                  </p>
                                </div>
                              </div>
                            </div>

                            <div className="mt-auto px-6 pb-6 pt-0 flex flex-col gap-3">
                              <Button 
                                onClick={() => router.push(`/custom-dashboard/${item.id}`)}
                                className="w-full h-11 rounded-xl font-bold text-xs bg-blue-600 text-white hover:bg-blue-800 shadow-lg transition-all group/btn"
                              >
                                VER DASHBOARD
                                <ArrowUpRight size={14} className="ml-2 group-hover/btn:translate-x-0.5 group-hover/btn:-translate-y-0.5 transition-transform" />
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      )
                    })}
                  </div>
                )}

                {/* --- MODO LISTA --- */}
                {viewMode === 'list' && (
                  <div className="bg-white dark:bg-card rounded-2xl border shadow-sm overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-gray-50/50 hover:bg-gray-50/50">
                          <TableHead>Painel</TableHead>
                          <TableHead>Unidade</TableHead>
                          <TableHead>Criado Por</TableHead>
                          <TableHead>Data</TableHead>
                          <TableHead className="text-right">Ações</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredDashboards.map((item) => (
                          <TableRow key={item.id} className="group hover:bg-gray-50/50 transition-colors">
                            <TableCell>
                              <div className="flex items-center gap-3">
                                <div className="h-8 w-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-[10px]">
                                  {item.nome?.substring(0, 2).toUpperCase()}
                                </div>
                                <span className="font-bold text-sm">{item.nome}</span>
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline" className="font-bold border-slate-200">{item.unidade || "Geral"}</Badge>
                            </TableCell>
                            <TableCell className="text-sm font-medium">
                              <div className="flex items-center gap-2">
                                <User size={12} className="text-muted-foreground" />
                                {item.criado_por || "Anônimo"}
                              </div>
                            </TableCell>
                            <TableCell className="text-sm text-muted-foreground">
                              {new Date(item.created_at).toLocaleDateString('pt-BR')}
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex justify-end gap-1">
                                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => router.push(`/custom-dashboard/${item.id}`)}>
                                  <Eye size={16} className="text-slate-400 hover:text-primary" />
                                </Button>
                                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={(e) => handleDelete(item.id, e)}>
                                  <Trash2 size={16} className="text-red-400 hover:text-red-600" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </>
            )}
          </div>
        </main>
      </div>

      <NewDashboardModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onSave={fetchDashboards} 
      />
    </div>
  );
}