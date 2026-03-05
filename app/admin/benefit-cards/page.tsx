"use client"

import { useState, useEffect, Suspense, useCallback } from "react"
import { 
  CreditCard, Menu, Plus, Search, Filter, Edit2, 
  CheckCircle, XCircle, Clock, Trash2, Star, 
  Settings2, LayoutGrid, ListChecks, Info, 
  AlertCircle, ChevronRight, UserPlus, Download, FileSpreadsheet
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
import { UploadCloud, Image as ImageIcon, Loader2 } from "lucide-react"

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
                <Card className="bg-white border-none shadow-sm rounded-3xl overflow-hidden relative">
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
                <Card className="bg-white border-none shadow-sm rounded-3xl overflow-hidden">
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
                <Card className="bg-white border-none shadow-sm rounded-3xl overflow-hidden">
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
                <div className="bg-white p-1 rounded-2xl shadow-sm border border-border inline-flex">
                  <button 
                    onClick={() => setActiveTab("cards")}
                    className={`px-6 py-2 rounded-xl text-sm font-bold transition-all ${activeTab === 'cards' ? 'bg-primary text-white shadow-md' : 'text-muted-foreground hover:bg-accent'}`}
                  >
                    Cartões Emitidos
                  </button>
                  <button 
                    onClick={() => setActiveTab("catalog")}
                    className={`px-6 py-2 rounded-xl text-sm font-bold transition-all ${activeTab === 'catalog' ? 'bg-primary text-white shadow-md' : 'text-muted-foreground hover:bg-accent'}`}
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
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                    {cards.map((card) => (
                      <Card key={card.id} className="group bg-white border-none rounded-[2rem] shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden">
                        <CardContent className="p-6">
                          <div className="flex justify-between items-start mb-6">
                            <div className="flex items-center gap-3">
                              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center text-primary font-bold text-xl">
                                {card.profiles?.full_name?.charAt(0)}
                              </div>
                              <div>
                                <h3 className="font-bold text-foreground leading-tight">{card.profiles?.full_name}</h3>
                                <p className="text-xs text-muted-foreground truncate max-w-[150px]">{card.profiles?.email}</p>
                              </div>
                            </div>
                            <Badge className={`rounded-full px-3 py-1 text-[10px] font-black uppercase border ${handleStatusColor(card.status)}`}>
                              {card.status}
                            </Badge>
                          </div>

                          <div className="bg-[#F8F9FC] rounded-2xl p-4 space-y-3 mb-6 border border-slate-100">
                            <div className="flex justify-between items-center text-xs">
                              <span className="text-muted-foreground font-bold uppercase tracking-tighter">Nível de Benefício</span>
                              <Badge variant="secondary" className="bg-primary/10 text-primary border-none rounded-lg">Nível {card.nivel_beneficio}</Badge>
                            </div>
                            <div className="flex justify-between items-center text-xs">
                              <span className="text-muted-foreground font-bold uppercase tracking-tighter">Vencimento</span>
                              <span className="font-bold text-slate-700">{new Date(card.data_validade).toLocaleDateString('pt-BR')}</span>
                            </div>
                          </div>

                          <div className="flex gap-2">
                            <Button 
                              variant="outline" 
                              className="flex-1 rounded-2xl h-11 font-bold text-xs gap-2 border-slate-200 hover:bg-slate-50 transition-all"
                              onClick={() => { setEditingCard(card); setIsCardModalOpen(true); }}
                            >
                              <Edit2 size={14} /> GERENCIAR
                            </Button>
                            <Button 
                              variant="outline" 
                              className="w-11 h-11 rounded-2xl p-0 border-rose-100 text-rose-500 hover:bg-rose-50 hover:border-rose-200 transition-all"
                              onClick={() => handleDeleteCard(card.id)}
                            >
                              <Trash2 size={16} />
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
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
                    <Card key={benefit.id} className="bg-white border-none rounded-[2rem] shadow-sm hover:shadow-md transition-all overflow-hidden border-l-4 border-l-primary/30">
                      <CardContent className="p-6">
                        <div className="flex justify-between items-start mb-4">
                          {benefit.image_url ? (
                            <div className="w-12 h-12 rounded-2xl overflow-hidden shadow-sm">
                              <img src={benefit.image_url} alt={benefit.nome} className="w-full h-full object-cover" />
                            </div>
                          ) : (
                            <div className="bg-amber-500/10 p-3 rounded-2xl text-amber-600">
                              <Star size={20} className="fill-amber-500/20" />
                            </div>
                          )}
                          <Badge variant={benefit.ativo ? "default" : "secondary"} className="rounded-full text-[10px] uppercase font-black">
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
                    className="group border-2 border-dashed border-slate-200 rounded-[2rem] flex flex-col items-center justify-center py-12 gap-4 hover:border-primary/50 hover:bg-primary/5 transition-all"
                  >
                    <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 group-hover:bg-primary group-hover:text-white transition-all">
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

// Modal de Cartão Individual
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

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl rounded-[2.5rem] p-0 overflow-hidden border-none shadow-2xl">
        <div className="p-8 space-y-8">
          <DialogHeader>
            <DialogTitle className="text-2xl font-black uppercase italic tracking-tight flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center text-white">
                <CreditCard size={20} />
              </div>
              {card ? 'Gerenciar Benefícios' : 'Emitir Novo Cartão'}
            </DialogTitle>
            <DialogDescription>Configure os privilégios, validade e foto do colaborador abaixo.</DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground px-1">Colaborador Selecionado</label>
                <Select value={formData.user_id} onValueChange={(val) => setFormData(p => ({ ...p, user_id: val }))} disabled={!!card}>
                  <SelectTrigger className="rounded-2xl h-12 bg-[#F8F9FC] border-none shadow-inner">
                    <SelectValue placeholder="Escolha um perfil..." />
                  </SelectTrigger>
                  <SelectContent className="z-[150]">
                    {users.map(u => <SelectItem key={u.id} value={u.id}>{u.full_name} ({u.role || 'Membro'})</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground px-1">Nível de Benefício</label>
                  <Input type="number" className="rounded-2xl h-12 bg-[#F8F9FC] border-none shadow-inner font-bold" value={formData.nivel_beneficio} onChange={(e) => setFormData(p => ({ ...p, nivel_beneficio: parseInt(e.target.value) }))} />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground px-1">Status</label>
                  <Select value={formData.status} onValueChange={(val: any) => setFormData(p => ({ ...p, status: val }))}>
                    <SelectTrigger className="rounded-2xl h-12 bg-[#F8F9FC] border-none shadow-inner font-bold uppercase text-[10px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="z-[150]">
                      <SelectItem value="ativo" className="text-emerald-600 font-bold">ATIVO</SelectItem>
                      <SelectItem value="inativo" className="text-rose-600 font-bold">INATIVO</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground px-1">Data de Validade</label>
                <Input type="date" className="rounded-2xl h-12 bg-[#F8F9FC] border-none shadow-inner font-bold" value={formData.data_validade} onChange={(e) => setFormData(p => ({ ...p, data_validade: e.target.value }))} />
              </div>

              {/* Upload da Foto */}
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground px-1">Foto do Cartão</label>
                <div className="flex items-center gap-4">
                  {formData.card_image_url ? (
                    <div className="relative group w-20 h-20 rounded-2xl overflow-hidden shadow-md">
                      <img src={formData.card_image_url} alt="Cartão" className="w-full h-full object-cover" />
                      <button 
                        onClick={() => setFormData(p => ({ ...p, card_image_url: "" }))}
                        className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <Trash2 className="text-white w-5 h-5" />
                      </button>
                    </div>
                  ) : (
                    <label className="flex flex-col items-center justify-center w-20 h-20 rounded-2xl bg-[#F8F9FC] border-2 border-dashed border-slate-200 cursor-pointer hover:border-primary/50 hover:bg-primary/5 transition-all">
                      <input type="file" className="hidden" accept="image/*" onChange={handleUploadImage} disabled={uploading} />
                      {uploading ? <Loader2 className="animate-spin text-primary w-6 h-6" /> : <UploadCloud className="text-slate-400 w-6 h-6" />}
                    </label>
                  )}
                  <div className="flex-1">
                    <p className="text-[10px] text-muted-foreground leading-tight">Envie uma foto ou arte personalizada para o cartão digital.</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground px-1 flex items-center gap-2">
                <ListChecks size={14} /> Atribuir Benefícios Manuais
              </label>
              <div className="bg-[#F8F9FC] rounded-3xl p-4 h-[220px] overflow-y-auto border border-slate-100 space-y-2">
                {benefits.filter(b => b.ativo).map(b => (
                  <div 
                    key={b.id} 
                    className={`flex items-center gap-3 p-3 rounded-2xl transition-all cursor-pointer border ${formData.benefitIds.includes(b.id) ? 'bg-primary/10 border-primary/20 text-primary' : 'bg-white border-transparent hover:border-slate-200'}`}
                    onClick={() => toggleBenefit(b.id)}
                  >
                    <Checkbox checked={formData.benefitIds.includes(b.id)} className="rounded-md" />
                    <div>
                      <p className="text-xs font-bold leading-none">{b.nome}</p>
                      <p className="text-[10px] opacity-60 mt-1">Nível {b.nivel_minimo}+</p>
                    </div>
                  </div>
                ))}
                {benefits.length === 0 && <p className="text-center text-[10px] py-12 text-muted-foreground">Catálogo vazio.</p>}
              </div>
            </div>
          </div>

          <DialogFooter className="flex gap-3 pt-4">
            <Button variant="ghost" className="flex-1 rounded-2xl h-14 font-black uppercase tracking-widest text-xs opacity-50 hover:opacity-100" onClick={onClose}>Descartar</Button>
            <Button className="flex-[2] rounded-2xl h-14 font-black uppercase tracking-widest text-xs bg-primary shadow-xl shadow-primary/20" onClick={handleSave} disabled={loading || uploading}>
              {loading ? "Processando..." : card ? "Atualizar Privilégios" : "Emitir Cartão Digital"}
            </Button>
          </DialogFooter>
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
      <DialogContent className="sm:max-w-md rounded-[2.5rem] p-0 overflow-hidden border-none shadow-2xl">
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
                <div className="w-24 h-24 rounded-3xl bg-[#F8F9FC] border-2 border-dashed border-slate-200 flex items-center justify-center overflow-hidden group-hover:border-primary/50 group-hover:bg-primary/5 transition-all">
                  {formData.image_url ? (
                    <img src={formData.image_url} alt="Ícone" className="w-full h-full object-cover" />
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
              <Input placeholder="Ex: Estacionamento VIP" className="rounded-2xl h-12 bg-[#F8F9FC] border-none font-bold" value={formData.nome} onChange={(e) => setFormData(p => ({ ...p, nome: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground px-1">Descrição</label>
              <Input placeholder="Descreva o que este benefício oferece..." className="rounded-2xl h-12 bg-[#F8F9FC] border-none text-xs" value={formData.descricao} onChange={(e) => setFormData(p => ({ ...p, descricao: e.target.value }))} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground px-1">Nível Mínimo</label>
                <Input type="number" className="rounded-2xl h-12 bg-[#F8F9FC] border-none font-bold" value={formData.nivel_minimo} onChange={(e) => setFormData(p => ({ ...p, nivel_minimo: parseInt(e.target.value) }))} />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground px-1">Status</label>
                <Select value={formData.ativo ? "true" : "false"} onValueChange={(val) => setFormData(p => ({ ...p, ativo: val === "true" }))}>
                  <SelectTrigger className="rounded-2xl h-12 bg-[#F8F9FC] border-none font-bold text-[10px] uppercase">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="z-[150]">
                    <SelectItem value="true" className="text-emerald-600 font-bold uppercase text-[10px]">ATIVO</SelectItem>
                    <SelectItem value="false" className="text-rose-600 font-bold uppercase text-[10px]">SUSPENSO</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <DialogFooter className="pt-4 flex gap-3">
            <Button variant="ghost" className="flex-1 rounded-2xl h-14 font-black uppercase tracking-widest text-xs opacity-50 hover:opacity-100" onClick={onClose}>Cancelar</Button>
            <Button className="flex-[2] rounded-2xl h-14 font-black uppercase tracking-widest text-xs bg-primary shadow-xl shadow-primary/20" onClick={handleSave} disabled={loading || uploading}>
              {loading ? "Salvando..." : "Salvar no Catálogo"}
            </Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  )
}
