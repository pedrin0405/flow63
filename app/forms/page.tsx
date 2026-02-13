"use client"

import { useState, useEffect, useCallback, useMemo } from "react"
import { 
  Search, 
  Plus, 
  FileText, 
  Clock, 
  CheckCircle2, 
  MoreVertical,
  Menu, 
  Trash2, 
  Calendar,
  Download,
  Link as LinkIcon,
  Eye,
  BarChart3,
  Filter,
  Users,
  Briefcase,
  LayoutGrid,
  List as ListIcon,
  Copy,
  MoreHorizontal,
  Check,
  Library,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"
import { Separator } from "@/components/ui/separator"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

import { supabase } from "@/lib/supabase"
import { NewFormModal } from "@/components/central63/forms/new-form-modal"
import { FormPreviewModal } from "@/components/central63/forms/form-preview-modal"
import { Sidebar } from "@/components/central63/sidebar"
import { useToast } from "@/hooks/use-toast"

import { jsPDF } from "jspdf";
import autoTable from 'jspdf-autotable';

export default function FormList() {
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState<"all" | "pending" | "completed">("all")
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid") // Estado para alternar visualização
  
  // Estados dos Modais
  const [isNewModalOpen, setIsNewModalOpen] = useState(false)
  const [isPreviewOpen, setIsPreviewOpen] = useState(false)
  const [selectedForm, setSelectedForm] = useState<any>(null)
  
  const [forms, setForms] = useState<any[]>([])
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [activeTab, setActiveTab] = useState("forms")
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()

  // Mude de false para null (ou undefined)
const [copiedId, setCopiedId] = useState<string | null>(null);

const handleCopyAction = (id: string, e: React.MouseEvent) => {
  handleCopyLink(id, e);
  setCopiedId(id); // Armazena o ID do item clicado
  setTimeout(() => setCopiedId(null), 2000); // Limpa após 2 segundos
};

  console.log(forms)

  const fetchDetails = async (id: string) => {
  try {
    const { data, error } = await supabase
      .from('forms') // Busca na tabela de detalhes
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    return data;
  } catch (error: any) {
    toast({ 
      title: "Erro ao buscar detalhes", 
      description: "Não foi possível encontrar os dados complementares deste formulário.", 
      variant: "destructive" 
    });
    return null;
  }
};

const generatePDF = async (form: any) => {
  setLoading(true);
  
  // Busca os dados detalhados antes de gerar o PDF
  const detailData = await fetchDetails(form.id);
  
  const doc = new jsPDF();
  const margin = 20;
  let currentY = 20;

  // 1. Adicionar Logo (public/logo-horizontal.png)
      try {
        // Next.js serve arquivos da pasta public na raiz /
        doc.addImage('/logo-horizontal.png', 'PNG', 75, currentY, 60, 30)
        currentY += 45
      } catch (e) {
        console.warn("Logo não encontrada no caminho /logo-horizontal.png")
        currentY += 10
      }

  // Cabeçalho Principal (Negrito)
  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.text("AUTORIZAÇÃO DE DIVULGAÇÃO DE IMÓVEL", 105, currentY, { align: "center" });
  
  doc.setFontSize(11);
  currentY += 15;

  // Função auxiliar para campos simples (Label em Negrito, Valor Normal)
  const drawField = (label: string, value: string) => {
    doc.setFont("helvetica", "bold");
    doc.text(label, margin, currentY);
    const labelWidth = doc.getTextWidth(label);
    doc.setFont("helvetica", "normal");
    doc.text(value || "", margin + labelWidth + 2, currentY);
    currentY += 10;
  };

  // --- PREENCHIMENTO DOS CAMPOS ---
  drawField("NOME: ", detailData?.nome || form.cliente_nome);
  
  doc.setFont("helvetica", "bold");
  doc.text("ENDEREÇO DO IMÓVEL (COM N° DE MATRÍCULA):", margin, currentY);
  currentY += 7;
  doc.setFont("helvetica", "normal");
  doc.text(detailData?.endereco || "_________________________________________________", margin, currentY);
  currentY += 10;

  drawField("QUAL TIPO DE INTERMEDIAÇÃO?: ", detailData?.tipo || "SEM EXCLUSIVIDADE");
  drawField("AUTORIZAÇÃO COM PRAZO DE VIGÊNCIA DE: ", detailData?.prazo || "NÃO INFORMADO");
  currentY += 5;

  // Função para desenhar parágrafos (Texto Fixo Normal + Variável em Negrito no final)
  const drawMixedParagraph = (title: string, fixedText: string, variableText: string) => {
    doc.setFont("helvetica", "bold");
    doc.text(title, margin, currentY);
    currentY += 5;
    
    let cursorX = margin;
    let cursorY = currentY;
    const maxWidth = 170;

    const drawPart = (text: string, isBold: boolean) => {
      doc.setFont("helvetica", isBold ? "bold" : "normal");
      const words = text.split(" ");
      words.forEach(word => {
        const w = word + " ";
        const width = doc.getTextWidth(w);
        if (cursorX + width > margin + maxWidth) {
          cursorX = margin;
          cursorY += 6;
        }
        doc.text(w, cursorX, cursorY);
        cursorX += width;
      });
    };

    drawPart(fixedText, false); // Texto estático em Normal
    drawPart(variableText, true);  // Valor variável em Negrito
    
    currentY = cursorY + 12;
  };
  console.log(detailData)

  // --- TERMO 1 (Dos Honorários) ---
  // A porcentagem de 5% agora é fixa (Normal), o variável é o final (ex: CIENTE)
  drawMixedParagraph(
    "Dos HONORÁRIOS - ",
    "O (a) CONTRATANTE  pagará para a CONTRATADA  pelos serviços profissionais prestados de intermediação imobiliária o percentual de 5% do total da transação. Devendo tal comissão ser paga no ato da assinatura do contrato de promessa de compra e venda ou da assinatura da escritura definitiva no respectivo cartório de registro de imóveis, o que acontecer primeiro: ",
    detailData?.termo_1 === true ? "CIENTE." : "NÃO INFORMADO."
  );

  // --- TERMO 2 (Da Publicidade) ---
  drawMixedParagraph(
    "Da publicidade e das ferramentas para a realização de objeto - ",
    "É reservado para a contratada, como forma de promover a divulgação do imóvel objeto desta AUTORIZAÇÃO DE INTERMEDIAÇÃO IMOBILIÁRIA, o direito de, as suas expensas, utilizar-se das ferramentas e técnicas permitidas em lei, entre elas: a colocação de placas; veiculação de anúncios, inclusive com a utilização de fotografias, na internet e demais meios de comunicação; promover, com o prévio consentimento do CONTRATANTE, visitas ao imóvel para mostrá-lo as pessoas interessadas: ",
    detailData?.termo_2 === true ? "CIENTE." : "NÃO INFORMADO."
  );

  // DATA
  const dataVal = detailData?.data || form.created_at;
  const dataStr = dataVal 
  ? new Date(dataVal).toLocaleDateString('pt-BR', {
      timeZone: 'America/Araguaina' // Garante a subtração das 3h do UTC
    }) 
  : "";
  drawField("DATA DA AUTORIZAÇÃO: ", dataStr);

  // Rodapé Institucional
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.text("CASA 63 IMOBILIÁRIA L TDA- CNPJ 29.541.965/0001-73-CRECI 3638", 105, 285, { align: "center" });

  doc.save(`Autorização - ${form.cliente_nome}.pdf`);
  setLoading(false);
};

  const fetchForms = useCallback(async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('reg_forms')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      setForms(data || [])
    } catch (error: any) {
      toast({ title: "Erro", description: error.message, variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }, [toast])

  useEffect(() => {
    fetchForms()
  }, [fetchForms])

  // Filtros
  const filteredForms = useMemo(() => {
    return forms.filter(f => {
      const searchLower = search.toLowerCase()
      const matchesSearch = 
        f.cliente_nome?.toLowerCase().includes(searchLower) ||
        f.corretor_nome?.toLowerCase().includes(searchLower) ||
        f.id?.toLowerCase().includes(searchLower)
      
      const matchesStatus = statusFilter === "all" || f.status === statusFilter

      return matchesSearch && matchesStatus
    })
  }, [forms, search, statusFilter])

  // Estatísticas
  const stats = useMemo(() => {
    const total = forms.length
    const completed = forms.filter(f => f.status === 'completed').length
    const pending = forms.filter(f => f.status === 'pending').length
    const rate = total > 0 ? Math.round((completed / total) * 100) : 0
    return { total, completed, pending, rate }
  }, [forms])

  // Ações
  const handleOpenPreview = (form: any) => {
    setSelectedForm(form)
    setIsPreviewOpen(true)
  }

  const handleCopyLink = (id: string, e?: React.MouseEvent) => {
    e?.stopPropagation()
    const url = `${window.location.origin}/forms/${id}`
    navigator.clipboard.writeText(url)
    toast({ title: "Copiado", description: "Link copiado para a área de transferência." })
  }

  const handleCreateForm = async (newFormData: any) => {
    const uniqueId = Math.random().toString(36).substring(2, 9).toUpperCase()
    try {
      const { error } = await supabase
        .from('reg_forms')
        .insert([{
          id: uniqueId,
          cliente_nome: newFormData.clientName,
          corretor_nome: newFormData.brokerName,
          secretaria: newFormData.secretaryName,
          status: "pending"
        }])

      if (error) throw error
      toast({ title: "Sucesso", description: "Ficha criada." })
      fetchForms()
      setIsNewModalOpen(false)
    } catch (error: any) {
      toast({ title: "Erro", description: error.message, variant: "destructive" })
    }
  }

  const handleDeleteForm = async (id: string) => {
    try {
      const { error } = await supabase.from('reg_forms').delete().eq('id', id)
      if (error) throw error
      setForms(forms.filter(form => form.id !== id))
      toast({ title: "Excluído", description: "Registro removido." })
    } catch (error: any) {
      toast({ title: "Erro", description: error.message, variant: "destructive" })
    }
  }

  return (
    <div className="flex h-screen bg-[#FAFAFA] dark:bg-background overflow-hidden font-sans text-foreground">
      <Sidebar 
        isOpen={sidebarOpen} 
        onClose={() => setSidebarOpen(false)} 
        activeTab={activeTab} 
        onTabChange={(tab) => { setActiveTab(tab); setSidebarOpen(false); }} 
      />

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
        {/* <header className="lg:hidden flex items-center justify-between p-4 border-b bg-white dark:bg-card">
          <div className="font-bold text-lg">Central<span className="text-primary">63</span></div>
          <Button variant="ghost" size="icon" onClick={() => setSidebarOpen(true)}><Menu size={24} /></Button>
        </header> */}
        
        <header className="bg-card border-b border-border px-6 py-4 flex items-center justify-between shadow-sm flex-shrink-0 z-20">
            <div className="flex items-center gap-4">
              <button className="lg:hidden p-2 text-muted-foreground hover:bg-accent rounded-lg" onClick={() => setSidebarOpen(true)}><Menu /></button>
              <Library className="text-primary hidden lg:block" />
              <h2 className="text-2xl font-bold text-foreground tracking-tight">Formulários</h2>
              {/* <p className="text-muted-foreground text-sm"> | Gerencie o fluxo de cadastros e atendimentos.</p> */}
            </div>
          </header>


        <main className="flex-1 overflow-y-auto">
          <div className="max-w-[1600px] mx-auto p-6 md:p-8 space-y-8 pb-20">

            {/* Dashboard Unificado */}
            <div className="bg-white dark:bg-card rounded-2xl border shadow-sm p-1 grid grid-cols-2 md:grid-cols-4 divide-x divide-gray-100 dark:divide-gray-800">
              <div className="p-4 flex items-center gap-4">
                <div className="h-10 w-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center"><FileText size={20} /></div>
                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Total</p>
                  <p className="text-xl font-bold tracking-tight">{stats.total}</p>
                </div>
              </div>
              <div className="p-4 flex items-center gap-4">
                <div className="h-10 w-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center"><Clock size={20} /></div>
                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Pendentes</p>
                  <div className="flex items-baseline gap-2">
                    <p className="text-xl font-bold tracking-tight">{stats.pending}</p>
                    <span className="text-xs font-medium text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded">Ação Necessária</span>
                  </div>
                </div>
              </div>
              <div className="p-4 flex items-center gap-4">
                <div className="h-10 w-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center"><CheckCircle2 size={20} /></div>
                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Concluídos</p>
                  <p className="text-xl font-bold tracking-tight">{stats.completed}</p>
                </div>
              </div>
              <div className="p-4 flex items-center gap-4">
                <div className="h-10 w-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center"><BarChart3 size={20} /></div>
                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Conversão</p>
                  <p className="text-xl font-bold tracking-tight">{stats.rate}%</p>
                </div>
              </div>
            </div>

            {/* Barra de Ferramentas */}
            <div className="flex flex-col md:flex-row gap-4 justify-between items-center w-full">
              
              {/* Grupo de Busca e Filtro (Agora com flex-1 para esticar) */}
              <div className="flex items-center gap-2 w-full md:flex-1 bg-white dark:bg-card p-1 rounded-xl border shadow-sm"
              suppressHydrationWarning
              >
                 <div className="relative flex-1"> {/* flex-1 aqui garante que o input estique dentro do grupo */}
                   <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
                   <Input 
                     placeholder="Buscar por cliente, id..." 
                     className="pl-9 h-10 border-0 bg-transparent focus-visible:ring-0 w-full" // w-full garante largura total
                     value={search}
                     onChange={(e) => setSearch(e.target.value)}
                   />
                 </div>
                 
                 {/* Divisória Vertical */}
                 <div className="h-6 w-px bg-border mx-1 flex-shrink-0" />
                 
                 <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                       <Button variant="ghost" size="sm" className="h-8 gap-2 text-muted-foreground hover:text-foreground flex-shrink-0">
                         <Filter size={14} />
                         <span className="text-xs font-medium hidden sm:inline-block">
                           {statusFilter === 'all' ? 'Todos' : statusFilter === 'pending' ? 'Pendentes' : 'Concluídos'}
                         </span>
                         {/* Versão mobile abreviada se necessário */}
                         <span className="text-xs font-medium sm:hidden">
                           Filtro
                         </span>
                       </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => setStatusFilter('all')}>Todos</DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setStatusFilter('pending')}>Pendentes</DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setStatusFilter('completed')}>Concluídos</DropdownMenuItem>
                    </DropdownMenuContent>
                 </DropdownMenu>
              </div>

              {/* Botões de Ação (Direita) */}
              <div className="flex items-center gap-2 w-full md:w-auto flex-shrink-0">
                {/* Botões de Visualização */}
                <div className="flex items-center bg-white dark:bg-card border rounded-xl p-1 shadow-sm flex-shrink-0">
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    onClick={() => setViewMode('grid')}
                    className={`h-9 w-9 rounded-lg transition-all ${viewMode === 'grid' ? 'bg-gray-100 text-foreground shadow-sm' : 'text-muted-foreground'}`}
                  >
                    <LayoutGrid size={18} />
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    onClick={() => setViewMode('list')}
                    className={`h-9 w-9 rounded-lg transition-all ${viewMode === 'list' ? 'bg-gray-100 text-foreground shadow-sm' : 'text-muted-foreground'}`}
                  >
                    <ListIcon size={18} />
                  </Button>
                </div>

                {/* Botão Novo */}
                <Button onClick={() => setIsNewModalOpen(true)} className="h-11 px-6 font-bold bg-primary text-white shadow-lg hover:bg-primary/90 rounded-xl flex-1 md:flex-none whitespace-nowrap">
                  <Plus size={18} className="mr-2" /> 
                  <span className="hidden sm:inline">Novo Formulário</span>
                  <span className="sm:hidden">Novo</span>
                </Button>
              </div>
            </div>

            {loading ? (
              <div className="flex justify-center py-20"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>
            ) : filteredForms.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-24 text-center">
                <div className="bg-gray-50 p-4 rounded-full mb-3"><FileText className="text-gray-300" size={32} /></div>
                <p className="text-muted-foreground font-medium">Nenhum registro encontrado.</p>
              </div>
            ) : (
              <>
                {/* --- VISUALIZAÇÃO EM GRADE (CARDS PREMIUM) --- */}
                {viewMode === 'grid' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                    {filteredForms.map((form) => {
                      const isCompleted = form.status === 'completed'
                      
                      return (
                        <Card 
                          key={form.id} 
                          className="group relative border-0 shadow-sm hover:shadow-2xl transition-all duration-300 bg-white dark:bg-card overflow-hidden rounded-[1.5rem] ring-1 ring-slate-100 dark:ring-slate-800 hover:-translate-y-1"
                        >
                          {/* Efeito de Topo Colorido (Gradiente sutil) */}
                          <div className={`absolute top-0 left-0 right-0 h-24 opacity-30 bg-gradient-to-b ${
                            isCompleted ? 'from-blue-100 to-transparent' : 'from-amber-100 to-transparent'
                          }`} />

                          <CardContent className="p-0 flex flex-col h-full relative z-10">
                            
                            {/* Cabeçalho do Card */}
                            <div className="p-6 pb-2 flex justify-between items-start">
                              <div className="flex gap-4">
                                <Avatar className={`h-14 w-14 ring-4 ring-white dark:ring-card shadow-sm ${isCompleted ? 'bg-blue-50 text-blue-600' : 'bg-amber-50 text-amber-600'}`}>
                                  <AvatarFallback className="font-bold text-lg">
                                    {form.cliente_nome?.substring(0, 2).toUpperCase()}
                                  </AvatarFallback>
                                </Avatar>
                                <div>
                                  <div className="flex items-center gap-2 mb-1">
                                    <Badge variant="secondary" className="font-mono text-[10px] px-1.5 h-5 bg-white/80 backdrop-blur border border-slate-200 text-slate-500 rounded-md shadow-sm">
                                      {form.id}
                                    </Badge>
                                    <span className={`text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 ${isCompleted ? 'text-blue-600' : 'text-amber-600'}`}>
                                      <span className={`w-1.5 h-1.5 rounded-full ${isCompleted ? 'bg-blue-500' : 'bg-amber-500'}`} />
                                      {isCompleted ? 'Concluído' : 'Pendente'}
                                    </span>
                                  </div>
                                  <h3 className="font-bold text-lg text-slate-800 dark:text-slate-100 leading-tight line-clamp-1" title={form.cliente_nome}>
                                    {form.cliente_nome}
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
                                  <DropdownMenuItem onClick={() => handleOpenPreview(form)} className="rounded-lg font-medium cursor-pointer py-2">
                                    <Eye size={16} className="mr-2 text-slate-500"/> Visualizar
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => handleCopyLink(form.id)} className="rounded-lg font-medium cursor-pointer py-2">
                                    <Copy size={16} className="mr-2 text-slate-500"/> Copiar Link
                                  </DropdownMenuItem>
                                  <DropdownMenuSeparator className="bg-slate-100 my-1"/>
                                  <DropdownMenuItem onClick={() => handleDeleteForm(form.id)} className="text-red-600 focus:text-red-700 focus:bg-red-50 rounded-lg font-medium cursor-pointer py-2">
                                    <Trash2 size={16} className="mr-2"/> Excluir
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>

                            {/* Bloco de Informações (Miolo) */}
                            <div className="px-6 py-4">
                              <div className="bg-slate-50 dark:bg-slate-900/50 rounded-2xl p-4 grid grid-cols-2 gap-4 border border-slate-100 dark:border-slate-800">
                                <div className="space-y-1">
                                  <p className="text-[10px] font-bold uppercase text-slate-400 tracking-wider flex items-center gap-1">
                                    <Briefcase size={10} /> Corretor
                                  </p>
                                  <p className="text-xs font-bold text-slate-700 dark:text-slate-300 truncate" title={form.corretor_nome}>
                                    {form.corretor_nome}
                                  </p>
                                </div>
                                <div className="space-y-1">
                                  <p className="text-[10px] font-bold uppercase text-slate-400 tracking-wider flex items-center gap-1">
                                    <Users size={10} /> Responsável
                                  </p>
                                  <p className="text-xs font-bold text-slate-700 dark:text-slate-300 truncate" title={form.secretaria}>
                                    {form.secretaria || '-'}
                                  </p>
                                </div>
                                <div className="col-span-2 pt-2 border-t border-slate-200/50 flex items-center justify-between">
                                  <p className="text-[10px] font-medium text-slate-400 flex items-center gap-1.5">
                                    <Calendar size={10} /> 
                                    {new Date(form.created_at).toLocaleDateString('pt-BR', {timeZone: 'America/Araguaina', day: '2-digit', month: 'short', year: 'numeric' })}
                                  </p>
                                  <p className="text-[10px] font-medium text-slate-400">
                                    {new Date(form.created_at).toLocaleTimeString([], {timeZone: 'America/Araguaina', hour: '2-digit', minute:'2-digit'})}
                                  </p>
                                </div>
                              </div>
                            </div>

                            {/* Rodapé de Ações */}
                            <div className="mt-auto px-6 pb-6 pt-0 flex flex-col gap-3">
                            {/* Primeira Linha: Link e PDF */}
                            <div className="flex gap-3 w-full">
                              <Button
                                variant="outline"
                                // A classe muda apenas se este ID for o que foi copiado
                                className={`flex-1 h-10 rounded-xl border-slate-200 font-bold text-xs transition-all group/btn active:scale-95 ${
                                  copiedId === form.id 
                                    ? 'text-blue-600 border-blue-200 bg-blue-50' 
                                    : 'text-slate-600 hover:border-primary hover:text-primary hover:bg-primary/5'
                                }`}
                                onClick={(e) => handleCopyAction(form.id, e)}
                              >
                                {copiedId === form.id ? (
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
                                onClick={(e) => {
                                  e.stopPropagation();
                                  generatePDF(form);
                                }}
                              >
                                <Download size={14} className="mr-2" />
                                PDF
                              </Button>
                            </div>

                            {/* Segunda Linha: Ver Dados / Aguardando */}
                            <Button
                              className={`w-full h-10 rounded-xl font-bold text-xs shadow-md transition-all ${
                                isCompleted
                                  ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-200'
                                  : 'bg-white border border-amber-200 text-amber-700 hover:bg-amber-50 shadow-sm'
                              }`}
                              onClick={() => handleOpenPreview(form)}
                            >
                              {isCompleted ? <Eye size={14} className="mr-2" /> : <Clock size={14} className="mr-2" />}
                              {isCompleted ? 'Ver Dados' : 'Aguardando'}
                            </Button>
                          </div>
                          </CardContent>
                        </Card>
                      )
                    })}
                  </div>
                )}

                {/* --- VISUALIZAÇÃO EM LISTA (TABELA) --- */}
                {viewMode === 'list' && (
                  <div className="bg-white dark:bg-card rounded-2xl border shadow-sm overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-gray-50/50 hover:bg-gray-50/50">
                          <TableHead className="w-[100px]">ID</TableHead>
                          <TableHead>Cliente</TableHead>
                          <TableHead>Corretor</TableHead>
                          <TableHead className="hidden md:table-cell">Secretária</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead className="hidden md:table-cell">Data</TableHead>
                          <TableHead className="text-right">Ações</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredForms.map((form) => (
                          <TableRow key={form.id} className="group cursor-pointer hover:bg-gray-50/50 transition-colors" onClick={() => handleOpenPreview(form)}>
                            <TableCell className="font-mono text-xs font-bold text-muted-foreground">{form.id}</TableCell>
                            <TableCell>
                              <div className="flex items-center gap-3">
                                <Avatar className="h-8 w-8">
                                  <AvatarFallback className="text-[10px] font-bold">{form.cliente_nome?.substring(0, 2)}</AvatarFallback>
                                </Avatar>
                                <span className="font-bold text-sm text-foreground">{form.cliente_nome}</span>
                              </div>
                            </TableCell>
                            <TableCell className="text-sm">{form.corretor_nome}</TableCell>
                            <TableCell className="text-sm text-muted-foreground hidden md:table-cell">{form.secretaria || '-'}</TableCell>
                            <TableCell>
                              <Badge variant="outline" className={`font-bold border-0 ${form.status === 'completed' ? 'bg-blue-100 text-blue-700' : 'bg-amber-100 text-amber-700'}`}>
                                {form.status === 'completed' ? 'Concluído' : 'Pendente'}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-sm text-muted-foreground hidden md:table-cell">
                              {new Date(form.created_at).toLocaleDateString('pt-BR',{timeZone: 'America/Araguaina'})}
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex items-center justify-end gap-1">
                                <TooltipProvider>
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-primary" onClick={(e) => handleCopyLink(form.id, e)}>
                                        <Copy size={16} />
                                      </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>Copiar Link</TooltipContent>
                                  </Tooltip>
                                </TooltipProvider>
                                
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground">
                                      <MoreHorizontal size={16} />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end">
                                    <DropdownMenuItem onClick={() => handleOpenPreview(form)}>Visualizar Detalhes</DropdownMenuItem>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem onClick={() => handleDeleteForm(form.id)} className="text-red-600 focus:text-red-600">Excluir</DropdownMenuItem>
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
              </>
            )}
          </div>
        </main>
      </div>

      <NewFormModal 
        isOpen={isNewModalOpen} 
        onClose={() => setIsNewModalOpen(false)}
        onSubmit={handleCreateForm}
      />
      
      <FormPreviewModal 
        isOpen={isPreviewOpen}
        onClose={() => setIsPreviewOpen(false)}
        formId={selectedForm?.id}
        basicInfo={selectedForm}
      />
    </div>
  )
}