"use client";

import React, { useState, useEffect } from "react";
import { NewSpreadsheetModal } from "@/components/central63/spreadsheets/new-spreadsheets-modal";
import { SpreadsheetFillView } from "@/components/central63/spreadsheets/spreadsheet-fill-view";
import { 
  Search, Plus, Filter, LayoutGrid, List, MoreHorizontal, 
  Eye, Copy, Trash2, Briefcase, Users as UsersIcon, Calendar, 
  Link as LinkIcon, Download, Check, Clock, FileSpreadsheet,
  ChevronLeft, ChevronRight, Menu, Loader2, Building2, Edit2
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
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
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";

// --- COMPONENTE DE PAGINAÇÃO LOCAL ---
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
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // Estados de Dados Reais
  const [spreadsheets, setSpreadsheets] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedModel, setSelectedModel] = useState<any>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("spreadsheets");
  const [editingData, setEditingData] = useState<any>(null); // ESTADO PARA EDIÇÃO

  // --- BUSCA DADOS DA TABELA SPREADSHEET_DATA ---
  const fetchSpreadsheetData = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('spreadsheet_data')
        .select('*')
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

  // --- FUNÇÕES DE AÇÃO ---
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
      toast.error("Não foi possível carregar a estrutura do modelo para edição.");
    }
  };

  const handleSaveData = async (data: any) => {
    try {
      if (editingData) {
        const { error } = await supabase
          .from('spreadsheet_data')
          .update({
            nome_tabela: data.nome_tabela,
            unidade: data.unidade,
            secretaria: data.secretaria || "Geral",
            dados: data.dados, 
            preenchido_por: data.criado_por
          })
          .eq('id', editingData.id);

        if (error) throw error;
        toast.success("Dados atualizados com sucesso!");
        setEditingData(null);
      } else {
        const { error } = await supabase
          .from('spreadsheet_data')
          .insert([
            {
              nome_tabela: data.nome_tabela,
              unidade: data.unidade,
              secretaria: data.secretaria || "Geral",
              modelo_tabela: data.nome_modelo,
              dados: data.dados, 
              preenchido_por: data.criado_por
            }
          ]);

        if (error) throw error;
        toast.success("Dados salvos com sucesso!");
        setSelectedModel(null);
      }
      fetchSpreadsheetData(); 
    } catch (error: any) {
      toast.error("Erro ao processar: " + error.message);
    }
  };

  const handleDeleteData = async (id: string) => {
    if(!confirm("Tem certeza que deseja excluir este registro?")) return;
    try {
      const { error } = await supabase.from('spreadsheet_data').delete().eq('id', id);
      if (error) throw error;
      toast.success("Registro excluído.");
      fetchSpreadsheetData();
    } catch (error: any) {
      toast.error("Erro ao excluir registro.");
    }
  };

  const handleCopyLink = (id: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    navigator.clipboard.writeText(`${window.location.origin}/spreadsheets/${id}`);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const filteredSpreadsheets = spreadsheets.filter(s => 
    s.modelo_tabela?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.unidade?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // --- VIEW DE EDIÇÃO ---
  if (editingData) {
    return (
      <div className="flex h-screen bg-background overflow-hidden font-sans text-foreground">
        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} activeTab={activeTab} onTabChange={(tab: string) => setActiveTab(tab)} />
        <div className="flex-1 overflow-y-auto bg-slate-50/30 dark:bg-transparent min-h-screen">
          <SpreadsheetFillView 
            model={{
                id: editingData.id,
                nome: editingData.modelo_tabela, 
                nome_tabela: editingData.nome_tabela,
                unidade: editingData.unidade, 
                criado_por: editingData.preenchido_por,
                dados: editingData.modelStructure 
            }} 
            initialRows={editingData.dados} 
            onBack={() => setEditingData(null)} 
            onSaveData={handleSaveData}
          />
        </div>
      </div>
    );
  }

  // --- VIEW DE PREENCHIMENTO ---
  if (selectedModel) {
    return (
      <div className="flex h-screen bg-background overflow-hidden font-sans text-foreground">
        <Sidebar 
          isOpen={sidebarOpen} 
          onClose={() => setSidebarOpen(false)} 
          activeTab={activeTab}
          onTabChange={(tab: string) => setActiveTab(tab)} 
        />
        <div className="flex-1 overflow-y-auto bg-slate-50/30 dark:bg-transparent min-h-screen">
          <SpreadsheetFillView 
            model={selectedModel} 
            onBack={() => setSelectedModel(null)} 
            onSaveData={handleSaveData}
          />
        </div>
      </div>
    );
  }

  // --- VIEW PRINCIPAL ---
  return (
    <div className="flex h-screen bg-background overflow-hidden font-sans text-foreground">
      <Sidebar 
        isOpen={sidebarOpen} 
        onClose={() => setSidebarOpen(false)} 
        activeTab={activeTab}
        onTabChange={(tab: string) => {
          setActiveTab(tab);
          setSidebarOpen(false);
        }} 
      />
      
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

        <div className="flex-1 overflow-y-auto p-4 lg:p-8">
          {/* BARRA DE PESQUISA E BOTÕES */}
          <div className="flex flex-col gap-4 mb-8 md:flex-row md:items-center md:justify-between">
            <div className="flex flex-1 items-center gap-3 max-w-xl" suppressHydrationWarning>
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Pesquisar por modelo ou unidade..."
                  className="pl-9 bg-white dark:bg-card h-11 rounded-xl border-slate-200 shadow-sm"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-xl h-11 border border-slate-200">
                <Button variant="ghost" size="icon" onClick={() => setViewMode("grid")} className={cn("h-9 w-9 rounded-lg", viewMode === "grid" && "bg-white shadow-sm text-primary")}><LayoutGrid size={18} /></Button>
                <Button variant="ghost" size="icon" onClick={() => setViewMode("list")} className={cn("h-9 w-9 rounded-lg", viewMode === "list" && "bg-white shadow-sm text-primary")}><List size={18} /></Button>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <Button variant="outline" className="h-11 rounded-xl gap-2 border-slate-200 bg-white" onClick={fetchSpreadsheetData}>
                <Clock className="h-4 w-4" /> Atualizar
              </Button>
              <Button onClick={() => setIsModalOpen(true)} className="h-11 rounded-xl gap-2 bg-primary shadow-md shadow-primary/20 hover:scale-[1.02] transition-all">
                <Plus className="h-4 w-4" /> Nova Planilha
              </Button>
            </div>
          </div>

          {/* LOADING E LISTAGEM */}
          {isLoading ? (
            <div className="flex flex-col items-center justify-center h-64 gap-4">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground font-medium">Sincronizando com Supabase...</p>
            </div>
          ) : filteredSpreadsheets.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-80 border-2 border-dashed rounded-[2.5rem] bg-slate-50/50">
              <FileSpreadsheet className="h-16 w-16 text-slate-200 mb-4" />
              <h3 className="text-lg font-bold text-slate-400">Nenhum preenchimento encontrado</h3>
              <p className="text-slate-400 text-sm">Clique em 'Nova Planilha' para começar.</p>
            </div>
          ) : (
            <>
              {viewMode === "grid" ? (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                  {filteredSpreadsheets.map((item) => (
                    <Card key={item.id} className="group relative border-0 shadow-sm hover:shadow-2xl transition-all duration-300 bg-white dark:bg-card overflow-hidden rounded-[2rem] ring-1 ring-slate-100 dark:ring-slate-800">
                      <div className="absolute top-0 left-0 right-0 h-24 opacity-40 bg-gradient-to-b from-blue-100 to-transparent" />
                      <CardContent className="p-0 flex flex-col h-full relative z-10">
                        <div className="p-6 pb-2 flex justify-between items-start">
                          <div className="flex gap-4">
                            <Avatar className="h-14 w-14 ring-4 ring-white shadow-sm bg-blue-50 text-blue-600">
                              <AvatarFallback className="font-bold"><FileSpreadsheet /></AvatarFallback>
                            </Avatar>
                            <div>
                              <div className="flex items-center gap-2 mb-1">
                                {/* <Badge variant="secondary" className="font-mono text-[9px] h-5 bg-white border">ID-{item.id.substring(0,4)}</Badge> */}
                                <span className="text-[10px] font-bold uppercase text-blue-800 flex items-center gap-1">
                                  <span className="w-1.5 h-1.5 rounded-full bg-blue-500" /> ID-{item.id.substring(0,4)}
                                </span>
                              </div>
                              <h3 className="font-bold text-lg text-slate-800 leading-tight truncate w-48">{item.nome_tabela || item.modelo_tabela}</h3>
                              <p className="text-[10px] font-medium text-slate-400">Por: {item.preenchido_por || "Autor"}</p>
                            </div>
                          </div>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild><Button variant="ghost" size="icon" className="rounded-full"><MoreHorizontal size={18} /></Button></DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="rounded-xl w-48">
                              <DropdownMenuItem className="cursor-pointer" onClick={() => handleEditData(item)}><Edit2 className="mr-2 h-4 w-4"/> Editar Dados</DropdownMenuItem>
                              <DropdownMenuItem className="text-red-600 cursor-pointer" onClick={() => handleDeleteData(item.id)}><Trash2 className="mr-2 h-4 w-4"/> Excluir</DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>

                        <div className="px-6 py-4">
                          <div className="bg-slate-50 dark:bg-slate-900/50 rounded-2xl p-4 grid grid-cols-2 gap-4 border border-slate-100 dark:border-slate-800">
                            <div className="space-y-1"><p className="text-[10px] font-bold uppercase text-slate-400 flex items-center gap-1"><FileSpreadsheet size={10} /> Modelo</p><p className="text-xs font-bold text-slate-700 truncate">{item.modelo_tabela}</p></div>
                            <div className="space-y-1"><p className="text-[10px] font-bold uppercase text-slate-400 flex items-center gap-1"><Building2 size={10} /> Unidade</p><p className="text-xs font-bold text-slate-700 truncate">{item.unidade}</p></div>
                            <div className="col-span-2 pt-2 border-t flex items-center justify-between">
                              <p className="text-[10px] font-medium text-slate-400 flex items-center gap-1.5"><Calendar size={10} /> {new Date(item.created_at).toLocaleDateString('pt-BR')}</p>
                              <p className="text-[10px] font-medium text-slate-400 flex items-center gap-1.5">{item.dados?.length || 0} cadastrados</p>
                            </div>
                          </div>
                        </div>

                        <div className="mt-auto px-6 pb-0 pt-0 flex flex-col gap-3">
                          <Button 
                            className="w-full h-10 rounded-xl font-bold text-xs bg-blue-600 text-white hover:bg-blue-700"
                            onClick={() => handleEditData(item)}
                          >
                            <List size={14} className="mr-2" /> Ver Planilha
                            {/* <List size={14} className="mr-2" /> Ver Planilha: {item.dados?.length || 0} linhas */}
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
                        <TableHead>Modelo</TableHead>
                        <TableHead>Total de Linhas</TableHead>
                        <TableHead>Preenchido por</TableHead>
                        <TableHead>Data</TableHead>
                        <TableHead className="text-right">Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredSpreadsheets.map((item) => (
                        <TableRow key={item.id} className="group">
                          <TableCell className="text-sm">
                            <div className="flex flex-col">
                              <span className="font-medium">{item.unidade}</span>
                              <span className="text-[10px] text-slate-400">{item.secretaria}</span>
                            </div>
                          </TableCell>
                          <TableCell className="text-sm text-slate-500">{item.dados?.length || 0} linhas</TableCell>
                          <TableCell className="text-sm text-slate-500">{item.preenchido_por}</TableCell>
                          <TableCell className="text-sm text-slate-400">{new Date(item.created_at).toLocaleDateString('pt-BR')}</TableCell>
                          <TableCell className="text-right">
                             <div className="flex items-center justify-end gap-2">
                                <Button variant="ghost" size="icon" onClick={() => handleEditData(item)}>
                                   <Eye size={16} className="text-slate-400" />
                                </Button>
                                {/* <Button variant="ghost" size="icon" onClick={() => handleEditData(item)}>
                                   <Edit2 size={16} className="text-slate-400" />
                                </Button> */}
                                <Button variant="ghost" size="icon" className="text-slate-400 hover:text-red-500" onClick={() => handleDeleteData(item.id)}>
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