"use client";

import React, { useState, useEffect } from "react";
import { Sidebar } from "@/components/central63/sidebar";
import { 
  LayoutDashboard, Search, Plus, BarChart3, Loader2, 
  MoreHorizontal, Trash2, Eye, Calendar, Database, 
  Layers, User, ArrowUpRight, List, LayoutGrid, Building2,
  Activity, Clock, ChevronLeft, ChevronRight, Filter
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { NewDashboardModal } from "@/components/central63/dashboards/new-dashboard-modal";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export default function DashboardsPage() {
  const router = useRouter();
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [searchQuery, setSearchQuery] = useState("");
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

  const handleDelete = async (id: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    if(!confirm("Deseja excluir este dashboard permanentemente?")) return;
    try {
      const { error } = await supabase.from('dashboard_data').delete().eq('id', id);
      if (error) throw error;
      toast.success("Dashboard removido do ecossistema.");
      fetchDashboards();
    } catch (error) {
      toast.error("Erro ao excluir.");
    }
  };

  const filteredDashboards = dashboards.filter(d => 
    d.nome?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    d.unidade?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex h-screen bg-background overflow-hidden font-sans text-foreground">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} activeTab="dashboards" onTabChange={() => {}} />
      
      <div className="flex-1 flex flex-col bg-slate-50/30 dark:bg-transparent overflow-hidden">
        {/* HEADER INTEGRAL */}
        <header className="bg-card border-b border-border px-6 py-4 flex items-center justify-between shadow-sm z-20">
          <div className="flex items-center gap-4">
            <button className="lg:hidden p-2 text-muted-foreground hover:bg-accent rounded-lg" onClick={() => setSidebarOpen(true)}>
              <LayoutDashboard size={20} />
            </button>
            <div className="p-2 bg-indigo-50 dark:bg-indigo-950 rounded-xl text-indigo-600">
                <BarChart3 size={24} />
            </div>
            <div>
                <h2 className="text-xl font-bold text-foreground tracking-tight">Ecosystem Dashboards</h2>
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em]">Gestão de Indicadores Central63</p>
            </div>
          </div>
          
          <Button onClick={() => setIsModalOpen(true)} className="h-11 rounded-xl gap-2 bg-primary shadow-md shadow-primary/20 hover:scale-[1.02] transition-all">
            <Plus className="h-4 w-4" /> Novo Dashboard
          </Button>
        </header>

        <div className="flex-1 overflow-y-auto p-4 lg:p-8">
          {/* BARRA DE PESQUISA E VIEW MODE */}
          <div className="flex flex-col gap-4 mb-8 md:flex-row md:items-center md:justify-between">
            <div className="flex flex-1 items-center gap-3 max-w-xl">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por nome ou unidade estratégica..."
                  className="pl-9 bg-white dark:bg-card h-11 rounded-xl border-slate-200 shadow-sm focus-visible:ring-indigo-500"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-xl h-11 border border-slate-200">
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={() => setViewMode("grid")} 
                  className={cn("h-9 w-9 rounded-lg", viewMode === "grid" && "bg-white shadow-sm text-primary")}
                >
                  <LayoutGrid size={18} />
                </Button>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={() => setViewMode("list")} 
                  className={cn("h-9 w-9 rounded-lg", viewMode === "list" && "bg-white shadow-sm text-primary")}
                >
                  <List size={18} />
                </Button>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <Button variant="outline" className="h-11 rounded-xl gap-2 border-slate-200 bg-white" onClick={fetchDashboards}>
                <Clock className="h-4 w-4" /> Atualizar
              </Button>
            </div>
          </div>

          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
              <Loader2 className="h-10 w-10 animate-spin text-indigo-600" />
              <p className="font-bold text-muted-foreground text-sm uppercase tracking-widest">Sincronizando Ecossistema...</p>
            </div>
          ) : filteredDashboards.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 border-2 border-dashed border-slate-200 rounded-[40px] bg-slate-50/50">
              <Database className="h-16 w-16 text-slate-200 mb-4" />
              <h3 className="text-lg font-bold text-slate-400">Nenhum indicador encontrado</h3>
              <p className="text-slate-400 text-sm">Crie seu primeiro painel para começar a monitorar.</p>
            </div>
          ) : (
            <>
              {viewMode === "grid" ? (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                  {filteredDashboards.map((item) => (
                    <Card key={item.id} className="group relative border-0 shadow-sm hover:shadow-2xl transition-all duration-300 bg-white dark:bg-card overflow-hidden rounded-[2rem] ring-1 ring-slate-100 dark:ring-slate-800">
                      <div className="absolute top-0 left-0 right-0 h-24 opacity-20 bg-gradient-to-b from-indigo-500 to-transparent" />
                      <CardContent className="p-0 flex flex-col h-full relative z-10">
                        {/* Header */}
                        <div className="p-6 pb-2 flex justify-between items-start">
                          <div className="flex gap-4">
                            <Avatar className="h-14 w-14 ring-4 ring-white shadow-sm bg-indigo-50 text-indigo-600">
                              <AvatarFallback className="font-bold"><BarChart3 /></AvatarFallback>
                            </Avatar>
                            <div>
                              <div className="flex items-center gap-2 mb-1">
                                <span className="text-[10px] font-bold uppercase text-indigo-800 flex items-center gap-1">
                                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse" /> DB-{item.id.substring(0,4)}
                                </span>
                              </div>
                              <h3 className="font-bold text-lg text-slate-800 dark:text-slate-100 leading-tight truncate w-44">{item.nome}</h3>
                              <p className="text-[10px] font-medium text-slate-400">Status: <span className="text-emerald-500 font-bold">Monitorando</span></p>
                            </div>
                          </div>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="rounded-full"><MoreHorizontal size={18} /></Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="rounded-xl w-48 p-2">
                              <DropdownMenuItem className="cursor-pointer font-bold" onClick={() => router.push(`/custom-dashboard/${item.id}`)}>
                                <Eye size={16} className="mr-2" /> Abrir Painel
                              </DropdownMenuItem>
                              <DropdownMenuItem className="text-red-600 cursor-pointer font-bold" onClick={(e) => handleDelete(item.id, e)}>
                                <Trash2 className="mr-2 h-4 w-4"/> Excluir
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>

                        {/* Dados Reais */}
                        <div className="px-6 py-4">
                          <div className="bg-slate-50 dark:bg-slate-900/50 rounded-2xl p-4 grid grid-cols-2 gap-4 border border-slate-100 dark:border-slate-800">
                            <div className="space-y-1">
                              <p className="text-[10px] font-bold uppercase text-slate-400 flex items-center gap-1"><Building2 size={10} /> Unidade</p>
                              <p className="text-xs font-bold text-slate-700 dark:text-slate-300 truncate">{item.unidade || "Global"}</p>
                            </div>
                            <div className="space-y-1">
                              <p className="text-[10px] font-bold uppercase text-slate-400 flex items-center gap-1"><Layers size={10} /> Módulos</p>
                              <p className="text-xs font-bold text-slate-700 dark:text-slate-300">{item.widgets_config?.length || 0} Widgets</p>
                            </div>
                            <div className="col-span-2 pt-2 border-t border-slate-200/50 flex items-center justify-between">
                              <p className="text-[10px] font-medium text-slate-400 flex items-center gap-1.5"><Calendar size={10} /> Criado em {new Date(item.created_at).toLocaleDateString('pt-BR')}</p>
                              <div className="flex items-center gap-1 text-slate-400 text-[10px]">
                                <Eye size={10} /> <span>Live</span>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Botão Principal */}
                        <div className="mt-auto px-6 pb-6 pt-2">
                          <Button 
                            className="w-full h-11 rounded-xl font-black text-xs bg-indigo-600 text-white hover:bg-indigo-700 shadow-lg shadow-indigo-100 dark:shadow-none group/btn"
                            onClick={() => router.push(`/custom-dashboard/${item.id}`)}
                          >
                            VISUALIZAR INDICADORES
                            <ArrowUpRight size={16} className="ml-2 group-hover/btn:translate-x-1 group-hover/btn:-translate-y-1 transition-transform" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="bg-white dark:bg-card rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-slate-50/50 hover:bg-slate-50/50">
                        <TableHead className="font-bold">Indicador / Nome</TableHead>
                        <TableHead className="font-bold">Unidade Estratégica</TableHead>
                        <TableHead className="font-bold">Componentes</TableHead>
                        <TableHead className="font-bold">Criação</TableHead>
                        <TableHead className="text-right font-bold">Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredDashboards.map((item) => (
                        <TableRow key={item.id} className="group cursor-pointer" onClick={() => router.push(`/custom-dashboard/${item.id}`)}>
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <div className="p-2 bg-indigo-50 rounded-lg text-indigo-600">
                                <BarChart3 size={16} />
                              </div>
                              <span className="font-bold text-slate-700 dark:text-slate-200">{item.nome}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className="rounded-lg bg-slate-50 dark:bg-slate-900 font-bold border-slate-200 text-slate-500">
                              {item.unidade || "Global"}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1.5 text-slate-500 font-medium">
                                <Layers size={14} />
                                <span className="text-xs">{item.widgets_config?.length || 0} widgets</span>
                            </div>
                          </TableCell>
                          <TableCell className="text-xs text-slate-400 font-medium">
                            {new Date(item.created_at).toLocaleDateString('pt-BR')}
                          </TableCell>
                          <TableCell className="text-right">
                             <div className="flex items-center justify-end gap-2">
                                <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-indigo-600">
                                   <Eye size={16} />
                                </Button>
                                <Button 
                                  variant="ghost" 
                                  size="icon" 
                                  className="h-8 w-8 text-slate-400 hover:text-red-500" 
                                  onClick={(e) => handleDelete(item.id, e)}
                                >
                                  <Trash2 size={16} />
                                </Button>
                             </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
              
              {/* PAGINAÇÃO LOCAL SIMULADA */}
              <div className="flex items-center justify-between px-2 py-8">
                <p className="text-sm text-slate-400 font-medium tracking-tight uppercase text-[10px]">
                  Total de <span className="text-slate-900 dark:text-white">{filteredDashboards.length}</span> indicadores ativos
                </p>
                <div className="flex items-center gap-2">
                    <Button variant="outline" size="icon" className="h-9 w-9 rounded-xl border-slate-200 disabled:opacity-30" disabled>
                        <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="icon" className="h-9 w-9 rounded-xl border-slate-200 disabled:opacity-30" disabled>
                        <ChevronRight className="h-4 w-4" />
                    </Button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      <NewDashboardModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onSave={fetchDashboards} 
      />
    </div>
  );
}