"use client"

import { useState, useEffect, Suspense, useCallback } from "react"
import { 
  CreditCard, Menu, Plus, Search, Filter, Edit2, 
  CheckCircle, XCircle, Clock, Trash2, Star, 
  Settings2, LayoutGrid, ListChecks, Info, 
  AlertCircle, ChevronRight, UserPlus, Download, FileSpreadsheet,
  MoveHorizontal, MoveVertical, Maximize, Eye, Camera, Loader2, UploadCloud,
  Calendar, ShieldCheck, User, Layers, Sparkles, Type, X
} from "lucide-react"
import { Sidebar } from "@/components/central63/sidebar"
import { useToast } from "@/hooks/use-toast"
import { supabase } from "@/lib/supabase"
import Loading from "@/app/loading"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, List as TabsList, Trigger as TabsTrigger } from "@/components/ui/tabs"
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select"
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogFooter,
  DialogDescription
} from "@/components/ui/dialog"
import { Checkbox } from "@/components/ui/checkbox"
import { 
  getBenefitCards, 
  getBenefits, 
  saveBenefitCard, 
  getAllUsers, 
  deleteBenefitCard,
  deleteBenefit,
  saveBenefit,
  getCardBenefitsIds,
  BenefitCard, 
  Benefit 
} from "@/app/actions/benefit-cards"
import * as XLSX from 'xlsx'
import { Slider } from "@/components/ui/slider"

export default function BenefitCardsAdminPage() {
  const { toast } = useToast()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [activeTab, setActiveTab] = useState("cards")
  const [cards, setCards] = useState<any[]>([])
  const [benefits, setBenefits] = useState<Benefit[]>([])
  const [isLoading, setIsLoading] = useState(true)
  
  // Modais
  const [isCardModalOpen, setIsCardModalOpen] = useState(false)
  const [isBenefitModalOpen, setIsBenefitModalOpen] = useState(false)
  const [editingCard, setEditingCard] = useState<any>(null)
  const [editingBenefit, setEditingBenefit] = useState<any>(null)

  const [filters, setFilters] = useState({
    search: "",
    status: "all"
  })

  const fetchData = useCallback(async () => {
    setIsLoading(true)
    try {
      const [cardsRes, benefitsRes] = await Promise.all([
        getBenefitCards(filters),
        getBenefits()
      ])
      
      if (cardsRes.success) setCards(cardsRes.data || [])
      if (benefitsRes.success) setBenefits(benefitsRes.data || [])
      
    } catch (error) {
      toast({ title: "Erro", description: "Falha ao carregar dados.", variant: "destructive" })
    } finally {
      setIsLoading(false)
    }
  }, [filters, toast])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const handleDeleteCard = async (id: string) => {
    if (!confirm("Deseja realmente excluir este cartão?")) return
    const res = await deleteBenefitCard(id)
    if (res.success) {
      toast({ title: "Sucesso", description: "Cartão removido." })
      fetchData()
    }
  }

  const handleDeleteBenefit = async (id: string) => {
    if (!confirm("Deseja excluir este benefício do catálogo?")) return
    const res = await deleteBenefit(id)
    if (res.success) {
      toast({ title: "Sucesso", description: "Benefício removido." })
      fetchData()
    }
  }

  const handleExport = () => {
    const dataToExport = cards.map(c => ({
      Nome: c.profiles?.full_name,
      Email: c.profiles?.email,
      Nivel: c.nivel_beneficio,
      Validade: new Date(c.data_validade).toLocaleDateString('pt-BR'),
      Status: c.status.toUpperCase(),
      Serial: c.apple_pass_serial
    }))
    
    const ws = XLSX.utils.json_to_sheet(dataToExport)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, "Cartões")
    XLSX.writeFile(wb, `Cartoes_Beneficios_${new Date().toISOString().split('T')[0]}.xlsx`)
    toast({ title: "Sucesso", description: "Relatório exportado com sucesso." })
  }

  const handleStatusColor = (status: string) => {
    switch (status) {
      case 'ativo': return 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
      case 'inativo': return 'bg-rose-500/10 text-rose-500 border-rose-500/20'
      case 'expirado': return 'bg-amber-500/10 text-amber-500 border-amber-500/20'
      default: return 'bg-slate-500/10 text-slate-500 border-slate-500/20'
    }
  }

  return (
    <Suspense fallback={<Loading />}>
      <div className="flex h-screen bg-background overflow-hidden font-sans text-foreground">
        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} activeTab="benefit-cards-admin" onTabChange={() => {}} />
        
        <main className="flex-1 flex flex-col h-full overflow-hidden relative">
          <header className="w-full bg-card border-b border-border px-6 py-4 flex items-center justify-between shadow-sm z-20">
            <div className="flex items-center gap-4">
              <button className="lg:hidden p-2 text-muted-foreground hover:bg-accent rounded-lg" onClick={() => setSidebarOpen(true)}>
                <Menu />
              </button>
              <div className="bg-primary/10 p-2 rounded-xl">
                <CreditCard className="text-primary w-6 h-6" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-foreground tracking-tight leading-none">Gestão de Benefícios</h2>
                <p className="text-xs text-muted-foreground mt-1">Controle de cartões e catálogo corporativo</p>
              </div>
            </div>
            
            <div className="flex gap-2">
              <Button 
                variant="outline"
                onClick={handleExport}
                className="rounded-full gap-2 border-slate-200 hover:bg-slate-50 text-slate-600 hidden md:flex"
              >
                <Download size={16} /> Exportar
              </Button>
              <Button 
                variant="outline"
                onClick={() => { setEditingBenefit(null); setIsBenefitModalOpen(true); }}
                className="rounded-full gap-2 border-primary/20 hover:bg-primary/5 text-primary hidden sm:flex"
              >
                <Plus size={16} /> Novo Benefício
              </Button>
              <Button onClick={() => { setEditingCard(null); setIsCardModalOpen(true); }} className="rounded-full gap-2 shadow-lg shadow-primary/20">
                <UserPlus size={16} /> Novo Cartão
              </Button>
            </div>
          </header>

          <div className="flex-1 overflow-y-auto bg-[#F8F9FC] dark:bg-background p-4 lg:p-8">
            <div className="max-w-7xl mx-auto space-y-8">
              
              {/* Stats Rápidas */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <Card className="bg-white border-none shadow-md rounded-3xl overflow-hidden relative border-l-4 border-l-primary/30">
                  <CardContent className="p-6 flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-blue-500/10 flex items-center justify-center text-blue-500">
                      <CreditCard size={24} />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Total de Cartões</p>
                      <h3 className="text-2xl font-black">{cards.length}</h3>
                    </div>
                  </CardContent>
                </Card>
                <Card className="bg-white border-none shadow-md rounded-3xl overflow-hidden">
                  <CardContent className="p-6 flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-500">
                      <CheckCircle size={24} />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Cartões Ativos</p>
                      <h3 className="text-2xl font-black text-emerald-600">{cards.filter(c => c.status === 'ativo').length}</h3>
                    </div>
                  </CardContent>
                </Card>
                <Card className="bg-white border-none shadow-md rounded-3xl overflow-hidden">
                  <CardContent className="p-6 flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-amber-500/10 flex items-center justify-center text-amber-500">
                      <Star size={24} />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Benefícios Ativos</p>
                      <h3 className="text-2xl font-black text-amber-600">{benefits.filter(b => b.ativo).length}</h3>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div className="flex items-center justify-between flex-wrap gap-4">
                <div className="bg-white/50 backdrop-blur-xl p-1.5 rounded-2xl shadow-md border border-white/40 inline-flex">
                  <button 
                    onClick={() => setActiveTab("cards")}
                    className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${activeTab === 'cards' ? 'bg-[#e91c74] text-white shadow-lg shadow-[#e91c74]/20' : 'text-muted-foreground hover:bg-slate-100'}`}
                  >
                    Cartões Emitidos
                  </button>
                  <button 
                    onClick={() => setActiveTab("catalog")}
                    className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${activeTab === 'catalog' ? 'bg-[#e91c74] text-white shadow-lg shadow-[#e91c74]/20' : 'text-muted-foreground hover:bg-slate-100'}`}
                  >
                    Catálogo de Benefícios
                  </button>
                </div>

                {activeTab === 'cards' && (
                  <div className="flex gap-2 flex-1 min-w-[300px]">
                    <div className="relative flex-1">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
                      <Input 
                        placeholder="Buscar por nome ou email..." 
                        className="pl-10 rounded-2xl bg-white border-none shadow-sm h-11"
                        value={filters.search}
                        onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                      />
                    </div>
                    <Select value={filters.status} onValueChange={(val) => setFilters(prev => ({ ...prev, status: val }))}>
                      <SelectTrigger className="w-[140px] rounded-2xl bg-white border-none shadow-sm h-11">
                        <SelectValue placeholder="Status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todos</SelectItem>
                        <SelectItem value="ativo">Ativos</SelectItem>
                        <SelectItem value="inativo">Inativos</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>

              <div className={activeTab === 'cards' ? 'block' : 'hidden'}>
                {isLoading ? (
                  <div className="flex justify-center items-center py-24"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" /></div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {cards.map((card) => (
                      <div key={card.id} className="space-y-3">
                        {/* Visual do Cartão (Versão Mini Premium) */}
                        <div className="relative group perspective-1000 w-full">
                          <div 
                            className="relative w-full aspect-[1.586/1] rounded-[1.5rem] bg-[#1c1c1e] p-4 sm:p-5 shadow-xl overflow-hidden border border-white/5 text-white transition-all duration-500 hover:rotate-y-3"
                          >
                            {/* Background Effects */}
                            <div className="absolute top-0 right-0 w-full h-full bg-gradient-to-br from-[#e91c74]/15 via-white/[0.03] to-transparent opacity-80 pointer-events-none" />
                            <div className="absolute -top-16 -right-16 w-48 h-48 bg-[#e91c74]/20 rounded-full blur-[60px] animate-pulse duration-[4s] pointer-events-none" />
                            
                            {/* Foto personalizada */}
                            {card.card_image_url && (
                              <div className="absolute inset-0 z-0 select-none pointer-events-none">
                                <img 
                                  src={card.card_image_url} 
                                  alt="Background" 
                                  style={{ 
                                    left: `${card.card_image_pos_x ?? 50}%`,
                                    top: `${card.card_image_pos_y ?? 50}%`,
                                    transform: `translate(-50%, -50%) scale(${card.card_image_zoom ?? 1})`,
                                    opacity: card.card_image_opacity ?? 0.5
                                  }}
                                  className="absolute w-full h-full object-cover grayscale mix-blend-overlay transition-all duration-300" 
                                />
                                <div className="absolute inset-0 bg-gradient-to-r from-black via-black/30 to-transparent z-10" />
                              </div>
                            )}
                            
                            {/* Header do Cartão */}
                            <div className="flex justify-between items-start relative z-10">
                              <div className="flex items-center gap-2">
                                <div className="w-6 h-6 sm:w-7 sm:h-7 bg-white/5 backdrop-blur-xl rounded-lg flex items-center justify-center border border-white/10 shadow-inner">
                                  <div 
                                    className="w-3 h-3 sm:w-3.5 sm:h-3.5" 
                                    style={{ 
                                      backgroundColor: '#e91c74', 
                                      maskImage: 'url(/icon.svg)', 
                                      WebkitMaskImage: 'url(/icon.svg)',
                                      maskRepeat: 'no-repeat', 
                                      WebkitMaskRepeat: 'no-repeat',
                                      maskSize: 'contain',
                                      WebkitMaskSize: 'contain',
                                      maskPosition: 'center',
                                      WebkitMaskPosition: 'center'
                                    }} 
                                  />
                                </div>
                                <div>
                                  <h1 className="font-black text-[8px] sm:text-[10px] tracking-tighter uppercase italic text-white/90">
                                    Club <span className="text-white">Casa63+</span>
                                  </h1>
                                </div>
                              </div>
                              <Badge className="bg-white/5 backdrop-blur-md text-white/70 border-white/10 rounded-full text-[7px] sm:text-[8px] px-2 py-0.5 uppercase font-bold tracking-wider">
                                {card.status === 'ativo' ? 'Válido' : 'Inválido'}
                              </Badge>
                            </div>

                            {/* Dados do Usuário */}
                            <div className="mt-6 sm:mt-8 relative z-10">
                              <p className="text-[7px] sm:text-[8px] opacity-30 uppercase tracking-[0.4em] font-black mb-0.5">Membro</p>
                              <h2 className="text-sm sm:text-lg font-bold tracking-tight uppercase truncate text-white/90 drop-shadow-sm">{card.card_display_name || card.profiles?.full_name}</h2>
                              
                              <div className="flex gap-4 sm:gap-6 mt-3 sm:mt-4">
                                <div>
                                  <p className="text-[7px] sm:text-[8px] opacity-30 uppercase tracking-[0.2em] font-black mb-0.5">Nível</p>
                                  <p className="font-bold text-[9px] sm:text-[10px] text-white/80">{card.nivel_beneficio}</p>
                                </div>
                                <div>
                                  <p className="text-[7px] sm:text-[8px] opacity-30 uppercase tracking-[0.2em] font-black mb-0.5">Validade</p>
                                  <p className="font-bold text-[9px] sm:text-[10px] text-white/80">{new Date(card.data_validade).toLocaleDateString('pt-BR')}</p>
                                </div>
                              </div>
                            </div>

                            {/* QR Code Mini */}
                            <div className="absolute bottom-4 right-4 w-10 h-10 sm:w-12 sm:h-12 bg-white p-1 rounded-lg shadow-2xl flex items-center justify-center overflow-hidden border border-white/20">
                              <img 
                                src={`https://api.qrserver.com/v1/create-qr-code/?size=100x100&data=${card.id}&margin=0`} 
                                alt="QR Code" 
                                className="w-full h-full"
                              />
                            </div>
                          </div>
                        </div>

                        {/* Ações Administrativas Compactas */}
                        <div className="flex gap-1.5 px-1">
                          <Button 
                            variant="outline" 
                            size="sm"
                            className="flex-1 rounded-xl h-9 font-bold text-[10px] gap-1.5 border-slate-200 hover:bg-slate-50 transition-all bg-white shadow-sm"
                            onClick={() => { setEditingCard(card); setIsCardModalOpen(true); }}
                          >
                            <Settings2 size={12} /> GERENCIAR
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm"
                            className="w-9 h-9 rounded-xl p-0 border-rose-100 text-rose-500 hover:bg-rose-50 hover:border-rose-200 transition-all bg-white shadow-sm"
                            onClick={() => handleDeleteCard(card.id)}
                          >
                            <Trash2 size={14} />
                          </Button>
                        </div>
                      </div>
                    ))}
                    {cards.length === 0 && (
                      <div className="col-span-full py-24 text-center opacity-40">
                        <CreditCard className="w-16 h-16 mx-auto mb-4" />
                        <p className="font-bold">Nenhum cartão emitido nesta categoria.</p>
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className={activeTab === 'catalog' ? 'block' : 'hidden'}>
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                  {benefits.map((benefit) => (
                    <Card key={benefit.id} className="bg-white border-none rounded-[2rem] shadow-md hover:shadow-xl transition-all overflow-hidden border-l-4 border-l-primary/30">
                      <CardContent className="p-6">
                        <div className="flex justify-between items-start mb-4">
                          {benefit.image_url ? (
                            <div className="w-12 h-12 rounded-2xl overflow-hidden shadow-md">
                              <img src={benefit.image_url} alt={benefit.nome} className="w-full h-full object-cover" />
                            </div>
                          ) : (
                            <div className="bg-amber-500/10 p-3 rounded-2xl text-amber-600">
                              <Star size={20} className="fill-amber-500/20" />
                            </div>
                          )}
                          <Badge variant={benefit.ativo ? "default" : "secondary"} className="rounded-full text-[10px] uppercase font-black shadow-sm">
                            {benefit.ativo ? "Disponível" : "Suspenso"}
                          </Badge>
                        </div>
                        <h3 className="font-black text-lg leading-tight mb-2 uppercase tracking-tight">{benefit.nome}</h3>
                        <p className="text-sm text-muted-foreground line-clamp-2 mb-6 h-10">{benefit.descricao}</p>
                        
                        <div className="flex items-center justify-between pt-4 border-t border-slate-50">
                          <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Nível Mín: {benefit.nivel_minimo}</span>
                          <div className="flex gap-2">
                            <Button size="sm" variant="ghost" className="rounded-full w-8 h-8 p-0" onClick={() => { setEditingBenefit(benefit); setIsBenefitModalOpen(true); }}>
                              <Settings2 size={16} className="text-slate-400" />
                            </Button>
                            <Button size="sm" variant="ghost" className="rounded-full w-8 h-8 p-0 text-rose-400 hover:text-rose-600" onClick={() => handleDeleteBenefit(benefit.id)}>
                              <Trash2 size={16} />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                  <button 
                    onClick={() => { setEditingBenefit(null); setIsBenefitModalOpen(true); }}
                    className="group border-2 border-dashed border-slate-200 rounded-[2rem] flex flex-col items-center justify-center py-12 gap-4 hover:border-primary/50 hover:bg-primary/5 transition-all shadow-sm hover:shadow-md"
                  >
                    <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 group-hover:bg-primary group-hover:text-white transition-all shadow-inner">
                      <Plus size={24} />
                    </div>
                    <span className="font-bold text-slate-400 group-hover:text-primary uppercase tracking-widest text-xs">Novo Benefício</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* Modais */}
      {isCardModalOpen && (
        <BenefitCardModal 
          isOpen={isCardModalOpen}
          card={editingCard} 
          benefits={benefits}
          onClose={() => setIsCardModalOpen(false)} 
          onSave={() => { setIsCardModalOpen(false); fetchData(); }}
        />
      )}

      {isBenefitModalOpen && (
        <BenefitCatalogModal 
          isOpen={isBenefitModalOpen}
          benefit={editingBenefit}
          onClose={() => setIsBenefitModalOpen(false)}
          onSave={() => { setIsBenefitModalOpen(false); fetchData(); }}
        />
      )}
    </Suspense>
  )
}

// Modal de Cartão Individual - DESIGN APPLE VIDRO COM PROFUNDIDADE
function BenefitCardModal({ isOpen, card, benefits, onClose, onSave }: any) {
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [formData, setFormData] = useState({
    user_id: "",
    nivel_beneficio: 1,
    data_validade: "",
    status: "ativo",
    card_image_url: "",
    card_display_name: "",
    benefitIds: [] as string[]
  })
  const [users, setUsers] = useState<any[]>([])

  useEffect(() => {
    if (isOpen) {
      setFormData({
        user_id: card?.user_id || "",
        nivel_beneficio: card?.nivel_beneficio || 1,
        data_validade: card?.data_validade ? new Date(card.data_validade).toISOString().split('T')[0] : "",
        status: card?.status || "ativo",
        card_image_url: card?.card_image_url || "",
        card_display_name: card?.card_display_name || "",
        benefitIds: []
      })
      
      if (card?.id) {
        getCardBenefitsIds(card.id).then(res => {
          if (res.success) setFormData(p => ({ ...p, benefitIds: res.data || [] }))
        })
      }
    }
  }, [isOpen, card])

  useEffect(() => {
    const fetchUsers = async () => {
      const { data } = await supabase.from('profiles').select('id, full_name, role').order('full_name')
      setUsers(data || [])
    }
    if (isOpen) fetchUsers()
  }, [isOpen])

  const handleUploadImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploading(true)
    try {
      const fileExt = file.name.split('.').pop()
      const fileName = `card-${Math.random().toString(36).substring(2)}.${fileExt}`
      const filePath = `benefit-cards/${fileName}`

      const { error: uploadError } = await supabase.storage
        .from('user-uploads')
        .upload(filePath, file)

      if (uploadError) throw uploadError

      const { data: { publicUrl } } = supabase.storage
        .from('user-uploads')
        .getPublicUrl(filePath)

      setFormData(prev => ({ ...prev, card_image_url: publicUrl }))
      toast({ title: "Sucesso", description: "Foto carregada com sucesso." })
    } catch (error: any) {
      toast({ title: "Erro no upload", description: error.message, variant: "destructive" })
    } finally {
      setUploading(false)
    }
  }

  const handleSave = async () => {
    if (!formData.user_id || !formData.data_validade) {
      toast({ title: "Atenção", description: "Campos obrigatórios faltando.", variant: "destructive" })
      return
    }
    setLoading(true)
    try {
      const serial = card?.apple_pass_serial || `BC-${Math.random().toString(36).substring(2, 10).toUpperCase()}`
      const result = await saveBenefitCard({ ...formData, apple_pass_serial: serial, id: card?.id }, formData.benefitIds)
      if (result.success) {
        toast({ title: "Sucesso", description: "Cartão atualizado." })
        onSave()
      } else {
        toast({ title: "Erro", description: result.error, variant: "destructive" })
      }
    } catch (e: any) {
      toast({ title: "Erro", description: e.message, variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }

  const toggleBenefit = (id: string) => {
    setFormData(prev => ({
      ...prev,
      benefitIds: prev.benefitIds.includes(id) 
        ? prev.benefitIds.filter(bid => bid !== id) 
        : [...prev.benefitIds, id]
    }))
  }

  const selectedUserName = users.find(u => u.id === formData.user_id)?.full_name || "NOME DO MEMBRO";

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-5xl rounded-[2.5rem] p-0 overflow-hidden border border-white/20 shadow-[0_32px_64px_-12px_rgba(0,0,0,0.3)] bg-white/80 backdrop-blur-3xl">
        <div className="flex flex-col h-[85vh]">
          {/* Header Vidro com Sombra */}
          <div className="bg-white/40 px-8 py-5 border-b border-white/20 flex items-center justify-between shadow-sm z-10">
            <DialogHeader>
              <DialogTitle className="text-xl font-black uppercase italic tracking-tighter flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-[#e91c74] flex items-center justify-center text-white shadow-lg shadow-[#e91c74]/30">
                  <Sparkles size={20} />
                </div>
                {card ? 'Ajustar Privilégios' : 'Emitir Cartão'}
              </DialogTitle>
            </DialogHeader>
            <button onClick={onClose} className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center hover:bg-white/40 hover:shadow-md transition-all">
              <X size={20} className="text-slate-600" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto">
            <div className="grid grid-cols-1 lg:grid-cols-12 h-full">
              
              {/* Coluna Esquerda: Preview e Configs */}
              <div className="lg:col-span-5 p-8 space-y-8 border-r border-white/20 bg-white/20 shadow-inner">
                
                {/* PREVIEW CARD - MAIOR PROFUNDIDADE */}
                <div className="space-y-4">
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#e91c74] px-1 flex items-center gap-2">
                    <Eye size={12} /> Live Preview
                  </p>
                  <div className="relative w-full aspect-[1.586/1] rounded-[2rem] bg-[#1c1c1e] p-6 shadow-[0_20px_50px_rgba(0,0,0,0.5)] overflow-hidden border border-white/10 text-white transform hover:scale-[1.02] transition-transform duration-500">
                    <div className="absolute top-0 right-0 w-full h-full bg-gradient-to-br from-[#e91c74]/15 via-white/[0.03] to-transparent opacity-80" />
                    <div className="absolute -top-16 -right-16 w-48 h-48 bg-[#e91c74]/20 rounded-full blur-[60px]" />
                    
                    {formData.card_image_url && (
                      <div className="absolute inset-0 z-0">
                        <img src={formData.card_image_url} alt="" className="absolute w-full h-full object-cover grayscale mix-blend-overlay opacity-50" />
                        <div className="absolute inset-0 bg-gradient-to-r from-black via-black/30 to-transparent z-10" />
                      </div>
                    )}
                    
                    <div className="relative z-10 flex justify-between items-start">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-[#e91c74] rounded-lg flex items-center justify-center border border-white/10 shadow-[0_4px_12px_rgba(233,28,116,0.4)]">
                          <img src="/icon.svg" className="w-4 h-4 invert" alt="" />
                        </div>
                        <h1 className="font-black text-xs tracking-tighter uppercase italic drop-shadow-md">Club Casa63+</h1>
                      </div>
                      <Badge className="bg-white/10 backdrop-blur-md text-[8px] px-2.5 py-1 rounded-full font-bold border-white/10 shadow-sm">{formData.status.toUpperCase()}</Badge>
                    </div>

                    <div className="mt-10 relative z-10">
                      <p className="text-[8px] opacity-30 uppercase tracking-[0.4em] font-black mb-1">Membro do Club</p>
                      <h2 className="text-xl font-bold tracking-tight uppercase truncate drop-shadow-lg">{formData.card_display_name || selectedUserName}</h2>
                      <div className="flex gap-6 mt-4">
                        <div>
                          <p className="text-[8px] opacity-30 uppercase tracking-[0.2em] font-black mb-1">Nível</p>
                          <p className="font-bold text-xs drop-shadow-md">Nível {formData.nivel_beneficio}</p>
                        </div>
                        <div>
                          <p className="text-[8px] opacity-30 uppercase tracking-[0.2em] font-black mb-1">Validade</p>
                          <p className="font-bold text-xs drop-shadow-md">{formData.data_validade ? new Date(formData.data_validade).toLocaleDateString('pt-BR') : '--/--/----'}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* FORMULÁRIO ESTILO VIDRO COM SOMBRAS */}
                <div className="space-y-5">
                  <div className="bg-white/40 p-5 rounded-[2rem] border border-white/40 shadow-lg space-y-4">
                    <div className="space-y-1.5">
                      <label className="text-[9px] font-black uppercase tracking-widest text-slate-500 flex items-center gap-2">
                        <User size={10} className="text-[#e91c74]" /> Colaborador
                      </label>
                      <Select value={formData.user_id} onValueChange={(val) => setFormData(p => ({ ...p, user_id: val }))} disabled={!!card}>
                        <SelectTrigger className="h-11 rounded-xl bg-white/60 border-white/40 shadow-inner font-bold text-xs focus:ring-2 focus:ring-[#e91c74]/20 transition-all">
                          <SelectValue placeholder="Selecione o membro..." />
                        </SelectTrigger>
                        <SelectContent className="z-[150] rounded-xl border-white/20 bg-white/95 backdrop-blur-xl shadow-2xl">
                          {users.map(u => <SelectItem key={u.id} value={u.id} className="text-xs font-medium focus:bg-[#e91c74]/10 focus:text-[#e91c74]">{u.full_name}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[9px] font-black uppercase tracking-widest text-slate-500 flex items-center gap-2">
                        <Type size={10} className="text-[#e91c74]" /> Nome Impresso
                      </label>
                      <Input 
                        placeholder="Nome personalizado" 
                        className="h-11 rounded-xl bg-white/60 border-white/40 shadow-inner text-xs font-bold focus:ring-2 focus:ring-[#e91c74]/20 transition-all"
                        value={formData.card_display_name}
                        onChange={(e) => setFormData(p => ({ ...p, card_display_name: e.target.value }))}
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-[9px] font-black uppercase tracking-widest text-slate-500">Nível</label>
                        <Input type="number" className="h-11 rounded-xl bg-white/60 border-white/40 shadow-inner text-center font-black text-[#e91c74]" value={formData.nivel_beneficio} onChange={(e) => setFormData(p => ({ ...p, nivel_beneficio: parseInt(e.target.value) }))} />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[9px] font-black uppercase tracking-widest text-slate-500">Status</label>
                        <Select value={formData.status} onValueChange={(val: any) => setFormData(p => ({ ...p, status: val }))}>
                          <SelectTrigger className="h-11 rounded-xl bg-white/60 border-white/40 shadow-inner font-bold text-[10px] uppercase">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="z-[150] rounded-xl shadow-2xl">
                            <SelectItem value="ativo" className="text-emerald-600 font-bold text-[10px]">ATIVO</SelectItem>
                            <SelectItem value="inativo" className="text-rose-600 font-bold text-[10px]">INATIVO</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[9px] font-black uppercase tracking-widest text-slate-500 flex items-center gap-2">
                        <Calendar size={10} className="text-[#e91c74]" /> Data de Validade
                      </label>
                      <Input type="date" className="h-11 rounded-xl bg-white/60 border-white/40 shadow-inner font-bold text-xs" value={formData.data_validade} onChange={(e) => setFormData(p => ({ ...p, data_validade: e.target.value }))} />
                    </div>
                  </div>

                  {/* UPLOAD ÁREA COM SOMBRA */}
                  <label className="flex items-center gap-4 p-4 rounded-[1.5rem] bg-white/40 border border-white/40 cursor-pointer hover:bg-white/60 hover:border-[#e91c74]/30 hover:shadow-md transition-all shadow-sm group">
                    <div className="w-12 h-12 rounded-2xl bg-white flex items-center justify-center text-[#e91c74] shadow-md group-hover:scale-110 transition-transform">
                      {uploading ? <Loader2 className="animate-spin" size={20} /> : <Camera size={20} />}
                    </div>
                    <div className="flex-1">
                      <p className="text-[11px] font-black uppercase tracking-tight text-slate-700">Foto de Fundo</p>
                      <p className="text-[9px] text-slate-400 font-medium">Trocar arte do cartão</p>
                    </div>
                    <input type="file" className="hidden" accept="image/*" onChange={handleUploadImage} disabled={uploading} />
                  </label>
                </div>
              </div>

              {/* Coluna Direita: Benefícios Manuais */}
              <div className="lg:col-span-7 p-8 flex flex-col h-full bg-white/40 shadow-inner">
                <div className="flex items-center justify-between mb-6 px-2">
                  <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-[#e91c74] flex items-center gap-2">
                    <ListChecks size={14} /> Atribuição de Benefícios
                  </h4>
                  <Badge variant="secondary" className="bg-white/60 backdrop-blur-md text-slate-500 border border-white/40 font-bold rounded-full text-[10px] shadow-sm">
                    {benefits.filter(b => b.ativo).length} Disponíveis
                  </Badge>
                </div>
                
                <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pb-4">
                    {benefits.filter(b => b.ativo).map(b => {
                      const isSelected = formData.benefitIds.includes(b.id);
                      return (
                        <div 
                          key={b.id} 
                          onClick={() => toggleBenefit(b.id)}
                          className={`flex items-center gap-4 p-4 rounded-[1.5rem] transition-all cursor-pointer border ${isSelected ? 'bg-[#e91c74]/10 border-[#e91c74]/30 shadow-xl shadow-[#e91c74]/10 scale-[1.02]' : 'bg-white/40 border-white/40 hover:bg-white/60 hover:border-slate-300 hover:shadow-md'}`}
                        >
                          <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 transition-all shadow-md ${isSelected ? 'bg-[#e91c74] text-white scale-110 shadow-[#e91c74]/40' : 'bg-white text-slate-400'}`}>
                            {b.image_url ? <img src={b.image_url} alt="" className="w-full h-full object-cover rounded-2xl" /> : <Star size={18} />}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className={`text-[11px] font-black leading-tight truncate uppercase ${isSelected ? 'text-[#e91c74]' : 'text-slate-700'}`}>{b.nome}</p>
                            <p className="text-[9px] font-bold opacity-40 mt-0.5">Nível {b.nivel_minimo}+</p>
                          </div>
                          <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all shadow-inner ${isSelected ? 'bg-[#e91c74] border-[#e91c74]' : 'border-slate-300 bg-white'}`}>
                            {isSelected && <CheckCircle className="text-white w-3 h-3" />}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>

                {/* Footer Flutuante Vidro com Sombras Fortes */}
                <div className="pt-8 flex gap-4 mt-auto">
                  <Button variant="ghost" className="flex-1 rounded-2xl h-14 font-black uppercase tracking-widest text-[10px] text-slate-400 hover:text-slate-900 hover:bg-white/40 hover:shadow-sm transition-all" onClick={onClose}>Descartar</Button>
                  <Button className="flex-[2.5] rounded-2xl h-14 font-black uppercase tracking-widest text-[10px] bg-[#e91c74] hover:bg-[#e91c74]/90 text-white shadow-[0_10px_25px_rgba(233,28,116,0.4)] hover:shadow-[0_15px_30px_rgba(233,28,116,0.5)] gap-3 transition-all transform active:scale-95" onClick={handleSave} disabled={loading || uploading}>
                    {loading ? <Loader2 className="animate-spin w-5 h-5" /> : <ShieldCheck size={20} />}
                    {card ? "Salvar Alterações" : "Emitir Cartão Digital"}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

// Modal de Gestão do Catálogo
function BenefitCatalogModal({ isOpen, benefit, onClose, onSave }: any) {
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [formData, setFormData] = useState({
    nome: "",
    descricao: "",
    nivel_minimo: 1,
    ativo: true,
    image_url: ""
  })

  useEffect(() => {
    if (isOpen) {
      setFormData({
        nome: benefit?.nome || "",
        descricao: benefit?.descricao || "",
        nivel_minimo: benefit?.nivel_minimo || 1,
        ativo: benefit !== null ? benefit.ativo : true,
        image_url: benefit?.image_url || ""
      })
    }
  }, [isOpen, benefit])

  const handleUploadImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploading(true)
    try {
      const fileExt = file.name.split('.').pop()
      const fileName = `benefit-${Math.random().toString(36).substring(2)}.${fileExt}`
      const filePath = `benefits/${fileName}`

      const { error: uploadError } = await supabase.storage
        .from('user-uploads')
        .upload(filePath, file)

      if (uploadError) throw uploadError

      const { data: { publicUrl } } = supabase.storage
        .from('user-uploads')
        .getPublicUrl(filePath)

      setFormData(prev => ({ ...prev, image_url: publicUrl }))
      toast({ title: "Sucesso", description: "Ícone do benefício carregado." })
    } catch (error: any) {
      toast({ title: "Erro no upload", description: error.message, variant: "destructive" })
    } finally {
      setUploading(false)
    }
  }

  const handleSave = async () => {
    if (!formData.nome) return
    setLoading(true)
    const res = await saveBenefit({ ...formData, id: benefit?.id })
    if (res.success) {
      toast({ title: "Sucesso", description: "Benefício salvo no catálogo." })
      onSave()
    } else {
      toast({ title: "Erro", description: res.error, variant: "destructive" })
    }
    setLoading(false)
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md rounded-[2.5rem] p-0 overflow-hidden border border-white/20 shadow-2xl bg-white/80 backdrop-blur-3xl">
        <div className="p-8 space-y-6">
          <DialogHeader>
            <DialogTitle className="text-2xl font-black uppercase italic tracking-tight">
              {benefit ? 'Editar Benefício' : 'Novo Benefício no Catálogo'}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {/* Upload do Ícone */}
            <div className="flex flex-col items-center justify-center py-4">
              <label className="relative group cursor-pointer">
                <input type="file" className="hidden" accept="image/*" onChange={handleUploadImage} disabled={uploading} />
                <div className="w-24 h-24 rounded-3xl bg-white/40 border-2 border-dashed border-slate-200 flex items-center justify-center overflow-hidden group-hover:border-primary/50 group-hover:bg-primary/5 transition-all shadow-inner">
                  {formData.image_url ? (
                    <img src={formData.image_url} alt="Ícone" className="w-full h-full object-cover shadow-sm" />
                  ) : uploading ? (
                    <Loader2 className="animate-spin text-primary w-8 h-8" />
                  ) : (
                    <div className="text-center">
                      <ImageIcon className="text-slate-400 w-8 h-8 mx-auto" />
                      <span className="text-[8px] font-black uppercase text-slate-400 mt-1 block">Upload</span>
                    </div>
                  )}
                </div>
                {formData.image_url && !uploading && (
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center rounded-3xl transition-opacity">
                    <Edit2 className="text-white w-6 h-6" />
                  </div>
                )}
              </label>
              <p className="text-[10px] text-muted-foreground mt-2 font-bold uppercase tracking-widest">Ícone do Benefício</p>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground px-1">Nome do Benefício</label>
              <Input placeholder="Ex: Estacionamento VIP" className="rounded-2xl h-12 bg-white/60 border-white/40 font-bold shadow-inner" value={formData.nome} onChange={(e) => setFormData(p => ({ ...p, nome: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground px-1">Descrição</label>
              <Input placeholder="Descreva o que este benefício oferece..." className="rounded-2xl h-12 bg-white/60 border-white/40 text-xs shadow-inner" value={formData.descricao} onChange={(e) => setFormData(p => ({ ...p, descricao: e.target.value }))} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground px-1">Nível Mínimo</label>
                <Input type="number" className="rounded-2xl h-12 bg-white/60 border-white/40 font-bold shadow-inner" value={formData.nivel_minimo} onChange={(e) => setFormData(p => ({ ...p, nivel_minimo: parseInt(e.target.value) }))} />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground px-1">Status</label>
                <Select value={formData.ativo ? "true" : "false"} onValueChange={(val) => setFormData(p => ({ ...p, ativo: val === "true" }))}>
                  <SelectTrigger className="rounded-2xl h-12 bg-white/60 border-white/40 font-bold text-[10px] uppercase shadow-inner">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="z-[150] shadow-2xl">
                    <SelectItem value="true" className="text-emerald-600 font-bold uppercase text-[10px]">ATIVO</SelectItem>
                    <SelectItem value="false" className="text-rose-600 font-bold uppercase text-[10px]">SUSPENSO</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <DialogFooter className="pt-4 flex gap-3">
            <Button variant="ghost" className="flex-1 rounded-2xl h-14 font-black uppercase tracking-widest text-xs opacity-50 hover:opacity-100 transition-all" onClick={onClose}>Cancelar</Button>
            <Button className="flex-[2] rounded-2xl h-14 font-black uppercase tracking-widest text-xs bg-[#e91c74] shadow-[0_10px_20px_rgba(233,28,116,0.3)] hover:shadow-[0_15px_25px_rgba(233,28,116,0.4)] text-white transition-all" onClick={handleSave} disabled={loading || uploading}>
              {loading ? "Salvando..." : "Salvar no Catálogo"}
            </Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  )
}
