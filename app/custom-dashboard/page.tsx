"use client";

import React, { useState, useEffect } from "react";
import { Sidebar } from "@/components/central63/sidebar";
import { LayoutDashboard, Search, Plus, List, LayoutGrid, Loader2, MoreHorizontal, Edit2, Trash2, Calendar, BarChart3, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { NewDashboardModal } from "@/components/central63/dashboards/new-dashboard-modal";

export default function DashboardsPage() {
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [searchQuery, setSearchQuery] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [dashboards, setDashboards] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("dashboards");

  const fetchDashboards = async () => {
    setIsLoading(true);
    try {
      // Assumindo que você criará uma tabela 'dashboard_data' no Supabase
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

  const handleDelete = async (id: string) => {
    if(!confirm("Deseja excluir este dashboard?")) return;
    try {
      const { error } = await supabase.from('dashboard_data').delete().eq('id', id);
      if (error) throw error;
      toast.success("Dashboard excluído.");
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
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} activeTab={activeTab} onTabChange={setActiveTab} />
      
      <div className="flex-1 flex flex-col bg-slate-50/30 dark:bg-transparent overflow-hidden">
        <header className="bg-card border-b border-border px-6 py-4 flex items-center justify-between shadow-sm z-20">
          <div className="flex items-center gap-4">
            <button className="lg:hidden p-2 text-muted-foreground hover:bg-accent rounded-lg" onClick={() => setSidebarOpen(true)}>
              <LayoutDashboard />
            </button>
            <BarChart3 className="text-primary hidden lg:block" />
            <h2 className="text-2xl font-bold text-foreground tracking-tight">Gestão de Dashboards</h2>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-4 lg:p-8">
          <div className="flex flex-col gap-4 mb-8 md:flex-row md:items-center md:justify-between">
            <div className="relative flex-1 max-w-xl">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Pesquisar dashboards..."
                className="pl-9 bg-white dark:bg-card h-11 rounded-xl border-slate-200"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            
            <div className="flex items-center gap-2">
              <Button onClick={() => setIsModalOpen(true)} className="h-11 rounded-xl gap-2 bg-primary shadow-md hover:scale-[1.02] transition-all">
                <Plus className="h-4 w-4" /> Novo Dashboard
              </Button>
            </div>
          </div>

          {isLoading ? (
            <div className="flex flex-col items-center justify-center h-64 gap-4">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">Sincronizando dashboards...</p>
            </div>
          ) : filteredDashboards.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-80 border-2 border-dashed rounded-[2.5rem] bg-slate-50/50">
              <BarChart3 className="h-16 w-16 text-slate-200 mb-4" />
              <h3 className="text-lg font-bold text-slate-400">Nenhum dashboard encontrado</h3>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {filteredDashboards.map((item) => (
                <Card key={item.id} className="group relative border-0 shadow-sm hover:shadow-2xl transition-all duration-300 bg-white overflow-hidden rounded-[2rem] ring-1 ring-slate-100">
                  <CardContent className="p-6 flex flex-col h-full relative z-10">
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex gap-4">
                        <Avatar className="h-14 w-14 bg-indigo-50 text-indigo-600">
                          <AvatarFallback><BarChart3 /></AvatarFallback>
                        </Avatar>
                        <div>
                          <span className="text-[10px] font-bold uppercase text-indigo-600 flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" /> DB-{item.id.substring(0,4)}
                          </span>
                          <h3 className="font-bold text-lg text-slate-800 truncate w-40">{item.nome}</h3>
                        </div>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild><Button variant="ghost" size="icon"><MoreHorizontal size={18} /></Button></DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleDelete(item.id)} className="text-red-600"><Trash2 className="mr-2 h-4 w-4"/> Excluir</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>

                    <div className="bg-slate-50 rounded-2xl p-4 mb-4 border border-slate-100">
                      <div className="flex justify-between text-xs mb-2">
                        <span className="text-slate-400 uppercase font-bold text-[9px]">Unidade</span>
                        <span className="font-bold text-slate-700">{item.unidade}</span>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span className="text-slate-400 uppercase font-bold text-[9px]">Data</span>
                        <span className="font-bold text-slate-700">{new Date(item.created_at).toLocaleDateString('pt-BR')}</span>
                      </div>
                    </div>

                    <Button className="w-full h-10 rounded-xl font-bold text-xs bg-indigo-600 text-white hover:bg-indigo-700">
                      <LayoutDashboard size={14} className="mr-2" /> Visualizar Indicadores
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
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