"use client";

import React, { useState, useEffect, useMemo } from "react";
import { NewSpreadsheetModal } from "@/components/central63/spreadsheets/new-spreadsheets-modal";
import { SpreadsheetFillView } from "@/components/central63/spreadsheets/spreadsheet-fill-view";
import { 
  Search, Plus, Filter, LayoutGrid, List, MoreHorizontal, 
  Eye, Trash2, Calendar, Clock, FileSpreadsheet,
  ChevronLeft, ChevronRight, Menu, Loader2, Building2, Edit2,
  FileText, CheckCircle2, BarChart3, Users as UsersIcon
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Sidebar } from "@/components/central63/sidebar"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

function LocalPagination({ currentPage, totalPages, onPageChange }: PaginationProps) {
  return (
    <div className="flex items-center justify-between px-2 py-4">
      <p className="text-sm text-muted-foreground">
        Página <span className="font-medium text-foreground">{currentPage}</span> de <span className="font-medium text-foreground">{totalPages || 1}</span>
      </p>
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="icon"
          className="h-8 w-8 rounded-lg"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <Button
          variant="outline"
          size="icon"
          className="h-8 w-8 rounded-lg"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage >= totalPages}
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

export default function SpreadsheetsPage() {
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [searchQuery, setSearchQuery] = useState("");
  const [unitFilter, setUnitFilter] = useState("all");
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  const [spreadsheets, setSpreadsheets] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedModel, setSelectedModel] = useState<any>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("spreadsheets");
  const [editingData, setEditingData] = useState<any>(null);

  const fetchSpreadsheetData = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('spreadsheet_data')
        .select('*, profiles:criado_por (full_name, avatar_url)')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setSpreadsheets(data || []);
    } catch (error: any) {
      toast.error("Erro ao carregar dados: " + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSpreadsheetData();
  }, []);

  // --- CÁLCULO DE MÉTRICAS (DASHBOARD) ---
  const stats = useMemo(() => {
    const total = spreadsheets.length;
    const totalRows = spreadsheets.reduce((acc, curr) => acc + (curr.dados?.length || 0), 0);
    const uniqueUnits = new Set(spreadsheets.map(s => s.unidade)).size;
    const latestEntries = spreadsheets.filter(s => {
      const entryDate = new Date(s.created_at);
      const today = new Date();
      return entryDate.toDateString() === today.toDateString();
    }).length;

    return { total, totalRows, uniqueUnits, latestEntries };
  }, [spreadsheets]);

  // --- FILTRAGEM ---
  const filteredSpreadsheets = spreadsheets.filter(s => {
    const matchesSearch = s.modelo_tabela?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         s.nome_tabela?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesUnit = unitFilter === "all" || s.unidade === unitFilter;
    return matchesSearch && matchesUnit;
  });

  const uniqueUnitsList = Array.from(new Set(spreadsheets.map(s => s.unidade))).filter(Boolean);

  const handleCreateSpreadsheet = async (formData: any) => {
    try {
      const { error } = await supabase.from('spreadsheets').insert([formData]);
      if (error) throw error;
      toast.success("Modelo criado com sucesso!");
    } catch (error: any) {
      toast.error("Erro: " + error.message);
    }
  };

  const handleUseModel = (model: any) => {
    setSelectedModel(model);
    setIsModalOpen(false);
  };

  const handleEditData = async (record: any) => {
    try {
      const { data: modelData, error } = await supabase
        .from('spreadsheets')
        .select('dados')
        .eq('nome', record.modelo_tabela)
        .single();

      if (error) throw error;

      setEditingData({
        ...record,
        nome_tabela: record.nome_tabela,
        modelStructure: modelData.dados 
      });
    } catch (error) {
      toast.error("Não foi possível carregar a estrutura do modelo.");
    }
  };

  const handleSaveData = async (data: any) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuário não autenticado");

      if (editingData) {
        const { error } = await supabase
          .from('spreadsheet_data')
          .update({
            nome_tabela: data.nome_tabela,
            unidade: data.unidade,
            secretaria: data.secretaria || "Geral",
            dados: data.dados, 
            criado_por: user.id
          })
          .eq('id', editingData.id);

        if (error) throw error;
        toast.success("Dados atualizados!");
        setEditingData(null);
      } else {
        const { error } = await supabase
          .from('spreadsheet_data')
          .insert([{
            nome_tabela: data.nome_tabela,
            unidade: data.unidade,
            secretaria: data.secretaria || "Geral",
            modelo_tabela: data.nome_modelo,
            dados: data.dados, 
            criado_por: user.id
          }]);

        if (error) throw error;
        toast.success("Dados salvos!");
        setSelectedModel(null);
      }
      fetchSpreadsheetData(); 
    } catch (error: any) {
      toast.error("Erro: " + error.message);
    }
  };

  const handleDeleteData = async (id: string) => {
    if(!confirm("Deseja excluir este registro?")) return;
    try {
      const { error } = await supabase.from('spreadsheet_data').delete().eq('id', id);
      if (error) throw error;
      toast.success("Registro excluído.");
      fetchSpreadsheetData();
    } catch (error: any) {
      toast.error("Erro ao excluir.");
    }
  };

  if (editingData || selectedModel) {
    const activeModel = editingData ? {
      id: editingData.id,
      nome: editingData.modelo_tabela, 
      nome_tabela: editingData.nome_tabela,
      unidade: editingData.unidade, 
      dados: editingData.modelStructure 
    } : selectedModel;

    return (
      <div className="flex h-screen bg-background overflow-hidden">
        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} activeTab={activeTab} onTabChange={setActiveTab} />
        <div className="flex-1 overflow-y-auto bg-slate-50/30 dark:bg-transparent">
          <SpreadsheetFillView 
            model={activeModel} 
            initialRows={editingData?.dados} 
            onBack={() => { setEditingData(null); setSelectedModel(null); }} 
            onSaveData={handleSaveData}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-background overflow-hidden font-sans text-foreground">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} activeTab={activeTab} onTabChange={setActiveTab} />
      
      <div className="flex-1 flex flex-col bg-slate-50/30 dark:bg-transparent overflow-hidden">
        <header className="bg-card border-b border-border px-6 py-4 flex items-center justify-between shadow-sm z-20">
          <div className="flex items-center gap-4">
            <button className="lg:hidden p-2 text-muted-foreground hover:bg-accent rounded-lg" onClick={() => setSidebarOpen(true)}>
              <Menu />
            </button>
            <FileSpreadsheet className="text-primary hidden lg:block" />
            <h2 className="text-2xl font-bold text-foreground tracking-tight">Gestão de Planilhas</h2>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-4 lg:p-8 space-y-6">
          
          {/* Dashboard de Métricas */}
          <div className="bg-white dark:bg-card rounded-2xl border shadow-sm p-1 grid grid-cols-2 md:grid-cols-4 divide-x divide-gray-100 dark:divide-gray-800">
            <div className="p-4 flex items-center gap-4">
              <div className="h-10 w-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center"><FileText size={20} /></div>
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Planilhas</p>
                <p className="text-xl font-bold tracking-tight">{stats.total}</p>
              </div>
            </div>
            <div className="p-4 flex items-center gap-4">
              <div className="h-10 w-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center"><BarChart3 size={20} /></div>
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Total Linhas</p>
                <p className="text-xl font-bold tracking-tight">{stats.totalRows}</p>
              </div>
            </div>
            <div className="p-4 flex items-center gap-4">
              <div className="h-10 w-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center"><Building2 size={20} /></div>
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Unidades</p>
                <p className="text-xl font-bold tracking-tight">{stats.uniqueUnits}</p>
              </div>
            </div>
            <div className="p-4 flex items-center gap-4">
              <div className="h-10 w-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center"><CheckCircle2 size={20} /></div>
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Hoje</p>
                <div className="flex items-baseline gap-2">
                  <p className="text-xl font-bold tracking-tight">{stats.latestEntries}</p>
                  {stats.latestEntries > 0 && <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded">Ativo</span>}
                </div>
              </div>
            </div>
          </div>

          {/* Barra de Ferramentas e Filtros */}
          <div className="flex flex-col md:flex-row gap-4 justify-between items-center w-full">
            <div className="flex items-center gap-2 w-full md:flex-1 bg-white dark:bg-card p-1 rounded-xl border shadow-sm">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
                <Input 
                  placeholder="Buscar por nome ou modelo..." 
                  className="pl-9 h-10 border-0 bg-transparent focus-visible:ring-0 w-full"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              
              <div className="h-6 w-px bg-border mx-1 flex-shrink-0" />
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-8 gap-2 text-muted-foreground hover:text-foreground">
                    <Filter size={14} />
                    <span className="text-xs font-medium hidden sm:inline-block">
                      {unitFilter === 'all' ? 'Todas Unidades' : unitFilter}
                    </span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="max-h-64 overflow-y-auto">
                  <DropdownMenuItem onClick={() => setUnitFilter('all')}>Todas Unidades</DropdownMenuItem>
                  {uniqueUnitsList.map(unit => (
                    <DropdownMenuItem key={unit} onClick={() => setUnitFilter(unit)}>{unit}</DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            <div className="flex items-center gap-2 w-full md:w-auto">
              <div className="flex items-center bg-white dark:bg-card border rounded-xl p-1 shadow-sm">
                <Button variant="ghost" size="icon" onClick={() => setViewMode('grid')} className={cn("h-9 w-9 rounded-lg", viewMode === 'grid' && "bg-slate-100 text-foreground shadow-sm")}><LayoutGrid size={18} /></Button>
                <Button variant="ghost" size="icon" onClick={() => setViewMode('list')} className={cn("h-9 w-9 rounded-lg", viewMode === 'list' && "bg-slate-100 text-foreground shadow-sm")}><List size={18} /></Button>
              </div>

              <Button onClick={() => setIsModalOpen(true)} className="h-11 px-6 font-bold bg-primary text-white shadow-lg hover:bg-primary/90 rounded-xl flex-1 md:flex-none">
                <Plus size={18} className="mr-2" /> 
                <span>Nova Planilha</span>
              </Button>
            </div>
          </div>

          {/* Listagem */}
          {isLoading ? (
            <div className="flex flex-col items-center justify-center h-64 gap-4">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground font-medium">Carregando dados...</p>
            </div>
          ) : filteredSpreadsheets.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-80 border-2 border-dashed rounded-[2.5rem] bg-slate-50/50">
              <FileSpreadsheet className="h-16 w-16 text-slate-200 mb-4" />
              <h3 className="text-lg font-bold text-slate-400">Nenhuma planilha encontrada</h3>
            </div>
          ) : (
            <>
              {viewMode === "grid" ? (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                  {filteredSpreadsheets.map((item) => (
                    <Card key={item.id} className="group relative border-0 shadow-sm hover:shadow-xl transition-all duration-300 bg-white dark:bg-card overflow-hidden rounded-[2rem] ring-1 ring-slate-100 dark:ring-slate-800">
                      <div className="absolute top-0 left-0 right-0 h-24 opacity-40 bg-gradient-to-b from-blue-100 to-transparent" />
                      <CardContent className="p-0 flex flex-col h-full relative z-10">
                        <div className="p-6 pb-2 flex justify-between items-start">
                          <div className="flex gap-4">
                            <Avatar className="h-14 w-14 ring-4 ring-white dark:ring-card shadow-sm">
                              <AvatarImage src={item.profiles?.avatar_url} />
                              <AvatarFallback className="bg-blue-50 text-blue-600 font-bold uppercase">
                                {item.profiles?.full_name?.substring(0, 2) || "AN"}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <div className="flex items-center gap-2 mb-1">
                                <span className="text-[10px] font-bold uppercase text-blue-800 flex items-center gap-1">
                                  <span className="w-1.5 h-1.5 rounded-full bg-blue-500" /> ID-{item.id.substring(0,4)}
                                </span>
                              </div>
                              <h3 className="font-bold text-lg text-slate-800 leading-tight truncate w-48">{item.nome_tabela || item.modelo_tabela}</h3>
                              <p className="text-[10px] font-medium text-slate-400">Por: {item.profiles?.full_name || "Anônimo"}</p>
                            </div>
                          </div>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild><Button variant="ghost" size="icon" className="rounded-full"><MoreHorizontal size={18} /></Button></DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="rounded-xl w-48">
                              <DropdownMenuItem onClick={() => handleEditData(item)}><Edit2 className="mr-2 h-4 w-4"/> Editar</DropdownMenuItem>
                              <DropdownMenuItem className="text-red-600" onClick={() => handleDeleteData(item.id)}><Trash2 className="mr-2 h-4 w-4"/> Excluir</DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>

                        <div className="px-6 py-4">
                          <div className="bg-slate-50 dark:bg-slate-900/50 rounded-2xl p-4 grid grid-cols-2 gap-4 border border-slate-100 dark:border-slate-800">
                            <div className="space-y-1">
                              <p className="text-[10px] font-bold uppercase text-slate-400 flex items-center gap-1"><FileSpreadsheet size={10} /> Modelo</p>
                              <p className="text-xs font-bold text-slate-700 truncate">{item.modelo_tabela}</p>
                            </div>
                            <div className="space-y-1">
                              <p className="text-[10px] font-bold uppercase text-slate-400 flex items-center gap-1"><Building2 size={10} /> Unidade</p>
                              <p className="text-xs font-bold text-slate-700 truncate">{item.unidade}</p>
                            </div>
                            <div className="col-span-2 pt-2 border-t flex items-center justify-between">
                              <p className="text-[10px] font-medium text-slate-400 flex items-center gap-1.5"><Calendar size={10} /> {new Date(item.created_at).toLocaleDateString('pt-BR')}</p>
                              <p className="text-[10px] font-medium text-slate-400 flex items-center gap-1.5">{item.dados?.length || 0} cadastrados</p>
                            </div>
                          </div>
                        </div>

                        <div className="mt-auto px-6 pb-6">
                          <Button className="w-full h-10 rounded-xl font-bold text-xs bg-blue-600 text-white hover:bg-blue-700" onClick={() => handleEditData(item)}>
                            <Eye size={14} className="mr-2" /> Ver Planilha
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="bg-white dark:bg-card rounded-2xl border shadow-sm overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-slate-50/50">
                        <TableHead>Nome/Unidade</TableHead>
                        <TableHead>Modelo</TableHead>
                        <TableHead>Linhas</TableHead>
                        <TableHead>Data</TableHead>
                        <TableHead className="text-right">Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredSpreadsheets.map((item) => (
                        <TableRow key={item.id}>
                          <TableCell>
                            <div className="flex flex-col">
                              <span className="font-medium text-sm">{item.nome_tabela || "Sem nome"}</span>
                              <span className="text-[10px] text-slate-400 uppercase font-bold">{item.unidade}</span>
                            </div>
                          </TableCell>
                          <TableCell className="text-sm font-medium text-slate-500">{item.modelo_tabela}</TableCell>
                          <TableCell className="text-sm text-slate-500">{item.dados?.length || 0} registros</TableCell>
                          <TableCell className="text-sm text-slate-400">{new Date(item.created_at).toLocaleDateString('pt-BR')}</TableCell>
                          <TableCell className="text-right space-x-2">
                            <Button variant="ghost" size="icon" onClick={() => handleEditData(item)}><Eye size={16} className="text-slate-400" /></Button>
                            <Button variant="ghost" size="icon" className="hover:text-red-500" onClick={() => handleDeleteData(item.id)}><Trash2 size={16} /></Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
              <LocalPagination currentPage={1} totalPages={1} onPageChange={() => {}} />
            </>
          )}

          <NewSpreadsheetModal 
            isOpen={isModalOpen} 
            onClose={() => setIsModalOpen(false)} 
            onSave={handleCreateSpreadsheet}
            onUseModel={handleUseModel}
          />
        </div>
      </div>
    </div>
  );
}