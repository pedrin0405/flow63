"use client";

import React, { useState } from "react";
import { 
  Search, Plus, Filter, LayoutGrid, List, MoreHorizontal, 
  Eye, Copy, Trash2, Briefcase, Users as UsersIcon, Calendar, 
  Link as LinkIcon, Download, Check, Clock, FileSpreadsheet,
  ChevronLeft, ChevronRight, Menu,
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

// --- COMPONENTE DE PAGINAÇÃO LOCAL PARA EVITAR ERROS DE IMPORTAÇÃO ---
interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

function LocalPagination({ currentPage, totalPages, onPageChange }: PaginationProps) {

  return (
    <div className="flex items-center justify-between px-2 py-4">
      <p className="text-sm text-muted-foreground">
        Mostrando <span className="font-medium text-foreground">1</span> a <span className="font-medium text-foreground">3</span> de <span className="font-medium text-foreground">12</span> resultados
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
        <div className="flex items-center gap-1">
          {[1, 2, 3].map((page) => (
            <Button
              key={page}
              variant={currentPage === page ? "default" : "outline"}
              size="icon"
              className="h-8 w-8 rounded-lg text-xs"
              onClick={() => onPageChange(page)}
            >
              {page}
            </Button>
          ))}
        </div>
        <Button
          variant="outline"
          size="icon"
          className="h-8 w-8 rounded-lg"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

type ViewMode = "grid" | "list";

interface Spreadsheet {
  id: string;
  name: string;
  model: string;
  created_at: string;
  secretary: string;
  author: string;
  status: "completed" | "pending";
}

export default function SpreadsheetsPage() {
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [searchQuery, setSearchQuery] = useState("");
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Dados mockados
  const spreadsheets: Spreadsheet[] = [
    {
      id: "PLAN-2024-001",
      name: "Relatório Mensal de Gastos",
      model: "Orçamento Geral",
      created_at: "2024-05-12T14:30:00Z",
      secretary: "Secretaria de Fazenda",
      author: "João Silva",
      status: "completed",
    },
    {
      id: "PLAN-2024-002",
      name: "Cadastro de Servidores",
      model: "Recursos Humanos",
      created_at: "2024-05-10T09:15:00Z",
      secretary: "Secretaria de Administração",
      author: "Maria Oliveira",
      status: "pending",
    },
    {
      id: "PLAN-2024-003",
      name: "Inventário de Medicamentos",
      model: "Estoque Saúde",
      created_at: "2024-05-08T16:45:00Z",
      secretary: "Secretaria de Saúde",
      author: "Ricardo Souza",
      status: "completed",
    },
  ];

  const filteredSpreadsheets = spreadsheets.filter(s => 
    s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.secretary.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleCopyLink = (id: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("spreadsheets"); 

  return (
  <div className="flex h-screen bg-background overflow-hidden font-sans text-foreground">
    <Sidebar 
      isOpen={sidebarOpen} 
      onClose={() => setSidebarOpen(false)} 
      activeTab={activeTab} // Use a variável de estado aqui
      onTabChange={(tab: string) => {
        setActiveTab(tab); // Atualiza a aba ativa quando clicar
        setSidebarOpen(false); // Fecha a sidebar no mobile após o clique
      }} 
    />
      <div className="flex-1 space-y-6 p-4  pt-6 md:p-0 bg-slate-50/30 dark:bg-transparent min-h-screen">

        <header className="bg-card border-b border-border px-6 py-4 flex items-center justify-between shadow-sm flex-shrink-0 z-20">
          <div className="flex items-center gap-4">
            <button className="lg:hidden p-2 text-muted-foreground hover:bg-accent rounded-lg" onClick={() => setSidebarOpen(true)}><Menu /></button>
            <FileSpreadsheet className="text-primary hidden lg:block" />
            <h2 className="text-2xl font-bold text-foreground tracking-tight">Planilhas</h2>
            {/* <p className="text-muted-foreground text-sm"> | Gerencie o fluxo de cadastros e atendimentos.</p> */}
          </div>
        </header>
        <div className="flex-1 overflow-y-auto bg-background lg:p-8">

          {/* --- BARRA DE FILTROS E PESQUISA --- */}
          <div className="flex flex-col gap-4 md:p-8 md:flex-row md:items-center md:justify-between">
            <div className="flex flex-1 items-center gap-3 max-w-xl">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Pesquisar por nome ou secretaria..."
                  className="pl-9 bg-white dark:bg-card h-11 rounded-xl border-slate-200 focus-visible:ring-primary shadow-sm"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              
              {/* Seletor de Visualização Grade/Lista */}
              <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700 h-11 shadow-inner">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setViewMode("grid")}
                  className={cn(
                    "h-9 w-9 rounded-lg transition-all duration-200",
                    viewMode === "grid" 
                      ? "bg-white dark:bg-slate-700 shadow-sm text-primary" 
                      : "text-slate-500 hover:text-slate-700"
                  )}
                >
                  <LayoutGrid size={18} />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setViewMode("list")}
                  className={cn(
                    "h-9 w-9 rounded-lg transition-all duration-200",
                    viewMode === "list" 
                      ? "bg-white dark:bg-slate-700 shadow-sm text-primary" 
                      : "text-slate-500 hover:text-slate-700"
                  )}
                >
                  <List size={18} />
                </Button>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <Button variant="outline" className="h-11 rounded-xl gap-2 border-slate-200 hover:bg-slate-50">
                <Filter className="h-4 w-4" />
                Filtros
              </Button>
              <Button className="h-11 rounded-xl gap-2 bg-primary shadow-md shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all">
                <Plus className="h-4 w-4" />
                Nova Planilha
              </Button>
            </div>
          </div>  

          {/* --- CONTEÚDO PRINCIPAL --- */}
          <div className="space-y-6">
            {viewMode === "grid" ? (
              /* --- VISUALIZAÇÃO EM GRADE (CARDS PREMIUM) --- */
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {filteredSpreadsheets.map((item) => {
                  const isCompleted = item.status === 'completed';
                  
                  return (
                    <Card 
                      key={item.id} 
                      className="group relative border-0 shadow-sm hover:shadow-2xl transition-all duration-300 bg-white dark:bg-card overflow-hidden rounded-[1.5rem] ring-1 ring-slate-100 dark:ring-slate-800 hover:-translate-y-1"
                    >
                      {/* Efeito de Topo Colorido */}
                      <div className={`absolute top-0 left-0 right-0 h-24 opacity-30 bg-gradient-to-b ${
                        isCompleted ? 'from-blue-100 to-transparent' : 'from-amber-100 to-transparent'
                      }`} />

                      <CardContent className="p-0 flex flex-col h-full relative z-10">
                        <div className="p-6 pb-2 flex justify-between items-start">
                          <div className="flex gap-4">
                            <Avatar className={`h-14 w-14 ring-4 ring-white dark:ring-card shadow-sm ${isCompleted ? 'bg-blue-50 text-blue-600' : 'bg-amber-50 text-amber-600'}`}>
                              <AvatarFallback className="font-bold">
                                <FileSpreadsheet className="h-6 w-6" />
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <div className="flex items-center gap-2 mb-1">
                                <Badge variant="secondary" className="font-mono text-[10px] px-1.5 h-5 bg-white/80 backdrop-blur border border-slate-200 text-slate-500 rounded-md shadow-sm">
                                  {item.id}
                                </Badge>
                                <span className={`text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 ${isCompleted ? 'text-blue-600' : 'text-amber-600'}`}>
                                  <span className={`w-1.5 h-1.5 rounded-full ${isCompleted ? 'bg-blue-500' : 'bg-amber-500'}`} />
                                  {isCompleted ? 'Concluído' : 'Pendente'}
                                </span>
                              </div>
                              <h3 className="font-bold text-lg text-slate-800 dark:text-slate-100 leading-tight line-clamp-1" title={item.name}>
                                {item.name}
                              </h3>
                            </div>
                          </div>

                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-slate-900 -mr-2 rounded-full hover:bg-slate-100">
                                <MoreHorizontal size={18} />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="rounded-xl border-slate-100 shadow-xl w-48 p-1">
                              <DropdownMenuLabel className="text-[10px] uppercase text-slate-400 px-2 py-1.5">Opções</DropdownMenuLabel>
                              <DropdownMenuItem className="rounded-lg font-medium cursor-pointer py-2">
                                <Eye size={16} className="mr-2 text-slate-500"/> Visualizar
                              </DropdownMenuItem>
                              <DropdownMenuItem className="rounded-lg font-medium cursor-pointer py-2">
                                <Download size={16} className="mr-2 text-slate-500"/> Baixar XLSX
                              </DropdownMenuItem>
                              <DropdownMenuSeparator className="bg-slate-100 my-1"/>
                              <DropdownMenuItem className="text-red-600 focus:text-red-700 focus:bg-red-50 rounded-lg font-medium cursor-pointer py-2">
                                <Trash2 size={16} className="mr-2"/> Excluir
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>

                        <div className="px-6 py-4">
                          <div className="bg-slate-50 dark:bg-slate-900/50 rounded-2xl p-4 grid grid-cols-2 gap-4 border border-slate-100 dark:border-slate-800">
                            <div className="space-y-1">
                              <p className="text-[10px] font-bold uppercase text-slate-400 tracking-wider flex items-center gap-1">
                                <Briefcase size={10} /> Modelo
                              </p>
                              <p className="text-xs font-bold text-slate-700 dark:text-slate-300 truncate" title={item.model}>
                                {item.model}
                              </p>
                            </div>
                            <div className="space-y-1">
                              <p className="text-[10px] font-bold uppercase text-slate-400 tracking-wider flex items-center gap-1">
                                <UsersIcon size={10} /> Secretaria
                              </p>
                              <p className="text-xs font-bold text-slate-700 dark:text-slate-300 truncate" title={item.secretary}>
                                {item.secretary}
                              </p>
                            </div>
                            <div className="col-span-2 pt-2 border-t border-slate-200/50 flex items-center justify-between">
                              <p className="text-[10px] font-medium text-slate-400 flex items-center gap-1.5">
                                <Calendar size={10} /> 
                                {new Date(item.created_at).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })}
                              </p>
                              <p className="text-[10px] font-medium text-slate-400">
                                Por: {item.author.split(' ')[0]}
                              </p>
                            </div>
                          </div>
                        </div>

                        <div className="mt-auto px-6 pb-6 pt-0 flex flex-col gap-3">
                          <div className="flex gap-3 w-full">
                            <Button
                              variant="outline"
                              className={cn(
                                "flex-1 h-10 rounded-xl border-slate-200 font-bold text-xs transition-all group/btn active:scale-95",
                                copiedId === item.id 
                                  ? 'text-blue-600 border-blue-200 bg-blue-50' 
                                  : 'text-slate-600 hover:border-primary hover:text-primary hover:bg-primary/5'
                              )}
                              onClick={(e) => handleCopyLink(item.id, e)}
                            >
                              {copiedId === item.id ? (
                                <>
                                  <Check size={14} className="mr-2 animate-in zoom-in duration-300" />
                                  Copiado!
                                </>
                              ) : (
                                <>
                                  <LinkIcon size={14} className="mr-2 text-slate-400 group-hover/btn:text-primary transition-colors" />
                                  Link
                                </>
                              )}
                            </Button>

                            <Button
                              variant="outline"
                              className="flex-1 h-10 rounded-xl border-slate-200 text-slate-600 font-bold text-xs hover:border-primary hover:text-primary hover:bg-primary/5 transition-all"
                            >
                              <Download size={14} className="mr-2" />
                              PDF
                            </Button>
                          </div>

                          <Button
                            className={cn(
                              "w-full h-10 rounded-xl font-bold text-xs shadow-md transition-all active:scale-[0.98]",
                              isCompleted
                                ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-200'
                                : 'bg-white border border-amber-200 text-amber-700 hover:bg-amber-50 shadow-sm'
                            )}
                          >
                            {isCompleted ? <Eye size={14} className="mr-2" /> : <Clock size={14} className="mr-2" />}
                            {isCompleted ? 'Ver Dados' : 'Aguardando'}
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            ) : (
              /* --- VISUALIZAÇÃO EM LISTA (TABELA) --- */
              <div className="bg-white dark:bg-card rounded-2xl border shadow-sm overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-slate-50/50 hover:bg-slate-50/50">
                      <TableHead className="w-[120px]">ID</TableHead>
                      <TableHead>Nome</TableHead>
                      <TableHead>Secretaria</TableHead>
                      <TableHead className="hidden md:table-cell">Modelo</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="hidden md:table-cell">Data</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredSpreadsheets.map((item) => (
                      <TableRow key={item.id} className="group cursor-pointer hover:bg-slate-50/30 transition-colors">
                        <TableCell className="font-mono text-[10px] font-bold text-slate-400">{item.id}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <div className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                              <FileSpreadsheet className="h-4 w-4 text-blue-600" />
                            </div>
                            <span className="font-bold text-sm text-slate-700 dark:text-slate-200">{item.name}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-sm">
                          <Badge variant="outline" className="font-normal text-slate-500 border-slate-200">{item.secretary}</Badge>
                        </TableCell>
                        <TableCell className="text-sm text-slate-500 hidden md:table-cell">{item.model}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className={cn(
                            "font-bold border-0",
                            item.status === 'completed' ? 'bg-blue-100 text-blue-700' : 'bg-amber-100 text-amber-700'
                          )}>
                            {item.status === 'completed' ? 'Concluído' : 'Pendente'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm text-slate-400 hidden md:table-cell">
                          {new Date(item.created_at).toLocaleDateString('pt-BR')}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-primary" onClick={(e) => handleCopyLink(item.id, e)}>
                                    <Copy size={16} />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>Copiar Link</TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                            
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400">
                                  <MoreHorizontal size={16} />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="rounded-xl">
                                <DropdownMenuItem className="cursor-pointer">Visualizar</DropdownMenuItem>
                                <DropdownMenuItem className="cursor-pointer">Baixar PDF</DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem className="text-red-600 cursor-pointer">Excluir</DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}

            <LocalPagination 
              currentPage={1}
              totalPages={3}
              onPageChange={() => {}}
            />
          </div>
        </div>
      </div>
    </div>
  );
}