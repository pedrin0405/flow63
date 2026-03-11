"use client"

import { useState, useMemo } from "react"
import { supabase } from "@/lib/supabase"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"
import { 
  Loader2, ShieldCheck, Database, Plus, Trash2, Globe, Pencil, 
  Eye, EyeOff, Key, Link as LinkIcon, Image as ImageIcon, 
  MoreHorizontal, CopyPlus, Search, Activity, Lock, Check, Zap, X,
  Clock, ChevronRight, Info
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { cn } from "@/lib/utils"

interface DynamicField {
  id: string
  key: string
  value: string
  isSecret: boolean
  isVisible?: boolean
}

interface IntegrationsTabProps {
  integrations: any[]
  onRefresh: () => void
}

// ─── Sub-Componente de Card de Integração (Apple Glass) ───────────────────
function IntegrationCard({ item, onEdit, onDuplicate, onDelete, variant = "default" }: any) {
  const keysCount = item.api_config ? Object.keys(item.api_config).length : 0;

  return (
    <div className={cn(
      "group relative rounded-[1.75rem] overflow-hidden transition-all duration-500",
      "border border-white/20 dark:border-white/[0.06]",
      variant === "pending"
        ? "bg-gradient-to-br from-amber-50/80 via-white/60 to-orange-50/40 dark:from-amber-950/20 dark:via-zinc-900/60 dark:to-orange-950/10 shadow-[0_2px_20px_rgba(245,158,11,0.08)]"
        : "bg-white/60 dark:bg-white/[0.03] backdrop-blur-2xl shadow-[0_2px_16px_rgba(0,0,0,0.06)] hover:shadow-[0_8px_32px_rgba(0,0,0,0.10)] hover:-translate-y-0.5"
    )}>
      {/* Glass refraction top highlight */}
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/80 dark:via-white/20 to-transparent" />

      {/* Subtle noise texture */}
      <div className="absolute inset-0 opacity-[0.015] pointer-events-none" style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='1'/%3E%3C/svg%3E")`,
      }} />

      <div className="relative p-4">
        {/* Header row */}
        <div className="flex items-start justify-between mb-4">
          <div className={cn(
            "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-[0.15em]",
            variant === "pending" 
              ? "bg-gradient-to-r from-amber-500/20 to-orange-500/10 text-amber-600 dark:text-amber-300"
              : "bg-gradient-to-r from-emerald-500/20 to-teal-500/10 text-emerald-600 dark:text-emerald-300"
          )}>
            <div className="h-1.5 w-1.5 rounded-full bg-current opacity-70" />
            {variant === "pending" ? "Configuração Pendente" : "Integração Ativa"}
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 rounded-full bg-black/[0.04] dark:bg-white/[0.06] hover:bg-black/[0.08] dark:hover:bg-white/[0.1] border border-black/[0.06] dark:border-white/[0.08] backdrop-blur-xl transition-all"
              >
                <MoreHorizontal className="h-3.5 w-3.5 text-foreground/50" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-52 rounded-2xl p-1.5 shadow-2xl border-border/50 backdrop-blur-xl bg-white/90 dark:bg-zinc-900/90">
              <DropdownMenuLabel className="text-[9px] font-black uppercase text-muted-foreground/40 px-3 py-1.5 tracking-[0.2em]">Configuração</DropdownMenuLabel>
              <DropdownMenuItem onClick={() => onEdit(item)} className="rounded-xl gap-2.5 py-2.5 cursor-pointer font-bold text-[11px] hover:bg-primary/5">
                <Pencil className="h-3.5 w-3.5 text-primary" /> Editar Dados
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onDuplicate(item)} className="rounded-xl gap-2.5 py-2.5 cursor-pointer font-bold text-[11px] hover:bg-primary/5">
                <CopyPlus className="h-3.5 w-3.5 text-primary" /> Duplicar Instância
              </DropdownMenuItem>
              <DropdownMenuSeparator className="my-1.5 opacity-50" />
              <DropdownMenuItem
                className="rounded-xl gap-2.5 py-2.5 text-destructive focus:text-destructive focus:bg-destructive/5 cursor-pointer font-bold text-[11px]"
                onClick={() => onDelete(item.id)}
              >
                <Trash2 className="h-3.5 w-3.5" /> Remover Ligação
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Logo + Info */}
        <div className="flex items-center gap-4 mb-4">
          <div className="relative shrink-0">
            <div className="h-14 w-14 rounded-2xl p-2.5 bg-gradient-to-br from-white/80 via-white/40 to-white/10 dark:from-white/10 dark:via-white/5 dark:to-transparent shadow-lg ring-1 ring-black/[0.08] dark:ring-white/[0.1] overflow-hidden transition-transform duration-500 group-hover:scale-[1.04] flex items-center justify-center bg-white dark:bg-zinc-900">
              {item.logo_url ? (
                <img src={item.logo_url} alt="" className="h-full w-full object-contain" />
              ) : (
                <Globe className="h-6 w-6 text-primary/20" />
              )}
            </div>
            {/* Status dot */}
            <div className={cn(
              "absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 rounded-full border-2 border-white dark:border-zinc-900 shadow",
              variant === "pending" ? "bg-amber-400" : "bg-emerald-400"
            )} />
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5 mb-0.5">
              <p className="text-[13px] font-black truncate tracking-tight text-foreground leading-none" title={item.instance_name}>
                {item.instance_name}
              </p>
            </div>
            <div className="flex items-center gap-1 text-muted-foreground/50 text-[9px] font-medium truncate">
              <LinkIcon className="h-2.5 w-2.5 shrink-0" />
              <span className="truncate">{item.url_site?.replace(/^https?:\/\//, '') || "Sem URL"}</span>
            </div>
          </div>
        </div>

        {/* Metadata Tiles */}
        <div className="flex items-center gap-2">
            <div className="flex-1 px-3 py-2 rounded-xl bg-black/[0.02] dark:bg-white/[0.02] border border-black/[0.04] dark:border-white/[0.04]">
                <p className="text-[7px] font-black uppercase tracking-widest text-muted-foreground/40 mb-0.5">Parâmetros</p>
                <div className="flex items-center gap-1">
                    <Key size={10} className="text-primary/40" />
                    <span className="text-[10px] font-black text-foreground/70">{keysCount} chaves</span>
                </div>
            </div>
            {variant === "pending" && (
                <button
                    onClick={() => onEdit(item)}
                    className="h-9 px-4 rounded-xl bg-gradient-to-r from-amber-400/20 to-orange-400/10 hover:from-amber-400/30 hover:to-orange-400/20 text-amber-600 dark:text-amber-400 border border-amber-400/30 font-black text-[9px] uppercase tracking-[0.15em] flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
                >
                    Configurar
                </button>
            )}
        </div>
      </div>
    </div>
  );
}

export function IntegrationsTab({ integrations, onRefresh }: IntegrationsTabProps) {
  const [isIntegrationDialogOpen, setIsIntegrationDialogOpen] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  
  const [instanceName, setInstanceName] = useState("")
  const [urlSite, setUrlSite] = useState("")
  const [logoUrl, setLogoUrl] = useState("")
  const [dynamicFields, setDynamicFields] = useState<DynamicField[]>([])

  const filteredIntegrations = useMemo(() => {
    return integrations.filter(item => 
      item.instance_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.url_site?.toLowerCase().includes(searchTerm.toLowerCase())
    )
  }, [integrations, searchTerm])

  const groupedIntegrations = useMemo(() => {
    const active = filteredIntegrations.filter(i => i.api_config && Object.keys(i.api_config).length > 0);
    const pending = filteredIntegrations.filter(i => !i.api_config || Object.keys(i.api_config).length === 0);
    return { active, pending };
  }, [filteredIntegrations]);

  const addField = () => setDynamicFields([...dynamicFields, { id: crypto.randomUUID(), key: "", value: "", isSecret: false, isVisible: false }])
  const removeField = (id: string) => setDynamicFields(dynamicFields.filter(f => f.id !== id))
  const updateField = (id: string, updates: Partial<DynamicField>) => setDynamicFields(dynamicFields.map(f => f.id === id ? { ...f, ...updates } : f))

  const openEditIntegration = (item: any) => {
    setEditingId(item.id); setInstanceName(item.instance_name || ""); setUrlSite(item.url_site || ""); setLogoUrl(item.logo_url || "");
    const fields = item.api_config ? Object.entries(item.api_config).map(([key, config]: [string, any]) => ({
      id: crypto.randomUUID(), key, value: config.value || "", isSecret: config.isSecret || false, isVisible: false
    })) : []
    setDynamicFields(fields); setIsIntegrationDialogOpen(true)
  }

  const handleDuplicateIntegration = (item: any) => {
    setEditingId(null); setInstanceName(`${item.instance_name || "Instância"} (Cópia)`); setUrlSite(item.url_site || ""); setLogoUrl(item.logo_url || "");
    const fields = item.api_config ? Object.entries(item.api_config).map(([key, config]: [string, any]) => ({
      id: crypto.randomUUID(), key, value: config.value || "", isSecret: config.isSecret || false, isVisible: false
    })) : []
    setDynamicFields(fields); setIsIntegrationDialogOpen(true); toast.info("Configuração clonada. Ajuste os detalhes.")
  }

  const closeIntegrationDialog = () => { setIsIntegrationDialogOpen(false); setEditingId(null); setInstanceName(""); setUrlSite(""); setLogoUrl(""); setDynamicFields([]) }

  const handleUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const url = e.target.value; setUrlSite(url)
    if (url && url.length > 3 && !logoUrl) {
      try { const domain = new URL(url.startsWith('http') ? url : `https://${url}`).hostname; setLogoUrl(`https://www.google.com/s2/favicons?domain=${domain}&sz=128`) } catch {}
    }
  }

  const handleSaveIntegration = async () => {
    if (!instanceName) return toast.error("O nome da instância é obrigatório")
    if (dynamicFields.some(f => !f.key.trim())) return toast.error("Preencha todos os nomes de chave")
    setIsSaving(true)
    try {
      const apiConfig: Record<string, any> = {}; dynamicFields.forEach(f => { apiConfig[f.key] = { value: f.value, isSecret: f.isSecret } })
      const payload = { instance_name: instanceName, url_site: urlSite, logo_url: logoUrl, api_config: apiConfig, updated_at: new Date() }
      const { error } = editingId ? await supabase.from('company_settings').update(payload).eq('id', editingId) : await supabase.from('company_settings').insert([payload])
      if (error) throw error
      toast.success(editingId ? "Integração atualizada" : "Nova API conectada"); closeIntegrationDialog(); onRefresh()
    } catch (error: any) { toast.error("Erro ao gravar: " + error.message) }
    finally { setIsSaving(false) }
  }

  const handleRemoveIntegration = async (id: string) => {
    if (!confirm("Eliminar esta integração permanentemente?")) return
    try { const { error } = await supabase.from('company_settings').delete().eq('id', id); if (error) throw error; toast.success("Removido com sucesso"); onRefresh() }
    catch (error: any) { toast.error("Erro ao remover") }
  }

  return (
    <div className="w-full max-w-6xl mx-auto space-y-5 animate-in fade-in duration-500 pb-16">
      
      {/* ── BENTO HEADER ─────────────────────────────────────────── */}
      <div className="relative rounded-[2rem] overflow-hidden border border-white/20 dark:border-white/[0.06] bg-white/50 dark:bg-white/[0.02] backdrop-blur-2xl shadow-[0_2px_20px_rgba(0,0,0,0.06)]">
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/90 dark:via-white/30 to-transparent" />

        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between px-6 py-5">
          <div className="flex items-center gap-4">
            <div className="relative h-12 w-12 rounded-2xl bg-gradient-to-br from-primary/90 to-primary/60 shadow-lg shadow-primary/20 flex items-center justify-center shrink-0">
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-t from-transparent to-white/20" />
              <Zap className="h-5 w-5 text-white relative z-10" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-black tracking-tight text-foreground">Integrações</h2>
                <span className="inline-flex items-center justify-center h-5 min-w-5 px-1.5 rounded-full bg-primary/10 text-primary text-[10px] font-black border border-primary/20">
                  {integrations.length}
                </span>
              </div>
              <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-muted-foreground/50 mt-0.5">Conexões Externas e APIs</p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-2 w-full md:w-auto">
            <div className="relative group w-full sm:w-56">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground/40 group-focus-within:text-primary transition-colors" />
              <Input
                placeholder="Pesquisar instâncias..."
                className="pl-9 h-9 rounded-xl bg-black/[0.03] dark:bg-white/[0.04] border-black/[0.05] dark:border-white/[0.06] focus:bg-white dark:focus:bg-white/[0.06] text-xs font-medium transition-all"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <button
              onClick={() => { setEditingId(null); setInstanceName(""); setUrlSite(""); setLogoUrl(""); setDynamicFields([{ id: crypto.randomUUID(), key: "", value: "", isSecret: false, isVisible: false }]); setIsIntegrationDialogOpen(true) }}
              className="flex items-center gap-2 h-9 px-4 rounded-xl bg-primary text-white font-black text-[10px] uppercase tracking-wider shadow-lg shadow-primary/25 hover:shadow-primary/35 hover:scale-[1.02] active:scale-[0.98] transition-all whitespace-nowrap"
            >
              <Plus size={14} />
              Ligar API
            </button>
          </div>
        </div>
      </div>

      {/* ── BENTO GRID LAYOUT ────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">

        {/* ── TILE: PENDING ── */}
        <div className="lg:col-span-4 flex flex-col gap-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="relative rounded-[1.5rem] overflow-hidden border border-emerald-200/40 dark:border-emerald-500/[0.1] bg-gradient-to-br from-emerald-50/70 to-teal-50/30 dark:from-emerald-950/20 dark:to-teal-950/10 backdrop-blur-xl p-4 shadow-[0_2px_12px_rgba(16,185,129,0.07)]">
              <Activity size={16} className="text-emerald-500 mb-3" />
              <p className="text-2xl font-black text-emerald-700 dark:text-emerald-400 leading-none">{groupedIntegrations.active.length}</p>
              <p className="text-[8px] font-black uppercase tracking-widest text-emerald-600/50 dark:text-emerald-500/50 mt-1">Ativas</p>
            </div>
            <div className="relative rounded-[1.5rem] overflow-hidden border border-white/20 dark:border-white/[0.06] bg-white/50 dark:bg-white/[0.02] backdrop-blur-xl p-4 shadow-[0_2px_12px_rgba(0,0,0,0.05)]">
              <Database size={16} className="text-primary/60 mb-3" />
              <p className="text-2xl font-black text-foreground leading-none">{integrations.length}</p>
              <p className="text-[8px] font-black uppercase tracking-widest text-muted-foreground/40 mt-1">Total</p>
            </div>
          </div>

          <div className="relative rounded-[1.75rem] overflow-hidden border border-amber-200/40 dark:border-amber-500/[0.12] bg-gradient-to-br from-amber-50/70 via-white/50 to-orange-50/30 dark:from-amber-950/25 dark:via-zinc-900/40 dark:to-orange-950/10 backdrop-blur-xl p-5 shadow-[0_2px_16px_rgba(245,158,11,0.08)]">
            <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-amber-300/60 dark:via-amber-400/20 to-transparent" />
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-xl bg-amber-400/20 dark:bg-amber-500/15 flex items-center justify-center border border-amber-400/20">
                  <Clock size={14} className="text-amber-600 dark:text-amber-400" />
                </div>
                <div>
                  <p className="text-[11px] font-black uppercase tracking-[0.15em] text-amber-700 dark:text-amber-400 leading-none">Pendentes</p>
                  <p className="text-[9px] text-amber-600/60 dark:text-amber-500/60 font-medium mt-0.5">Aguardando chaves</p>
                </div>
              </div>
              <div className="h-7 w-7 rounded-full bg-amber-400/20 flex items-center justify-center border border-amber-400/30">
                <span className="text-[11px] font-black text-amber-600 dark:text-amber-400">{groupedIntegrations.pending.length}</span>
              </div>
            </div>

            <div className="space-y-2.5 min-h-[120px]">
              {groupedIntegrations.pending.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-10 text-center opacity-30">
                  <ShieldCheck size={32} className="mb-2" />
                  <p className="text-[9px] font-black uppercase tracking-widest">Tudo configurado</p>
                </div>
              ) : (
                groupedIntegrations.pending.map(item => (
                  <IntegrationCard key={item.id} item={item} onEdit={openEditIntegration} onDuplicate={handleDuplicateIntegration} onDelete={handleRemoveIntegration} variant="pending" />
                ))
              )}
            </div>
          </div>
        </div>

        {/* ── TILE: ACTIVE ── */}
        <div className="lg:col-span-8 flex flex-col gap-3">
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-2">
              <div className="h-1.5 w-1.5 rounded-full bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.8)]" />
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-foreground/40">Integrações Ativas</p>
            </div>
            <p className="text-[9px] font-bold text-muted-foreground/30">{groupedIntegrations.active.length} conectadas</p>
          </div>

          <div className="relative rounded-[2rem] overflow-hidden border border-white/20 dark:border-white/[0.06] bg-white/40 dark:bg-white/[0.02] backdrop-blur-2xl p-4 shadow-[0_2px_20px_rgba(0,0,0,0.05)]">
            <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/80 dark:via-white/20 to-transparent" />
            {groupedIntegrations.active.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-24 text-center opacity-20">
                <Database size={40} className="mb-3" />
                <p className="text-xs font-black uppercase tracking-widest">Nenhuma API ativa</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {groupedIntegrations.active.map(item => (
                  <IntegrationCard key={item.id} item={item} onEdit={openEditIntegration} onDuplicate={handleDuplicateIntegration} onDelete={handleRemoveIntegration} />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── DIALOG DE CONFIGURAÇÃO (Apple Glass Refined) ────────────────── */}
      <Dialog open={isIntegrationDialogOpen} onOpenChange={setIsIntegrationDialogOpen}>
        <DialogContent className="sm:max-w-[720px] max-h-[90vh] flex flex-col p-0 overflow-hidden rounded-[2.5rem] border border-white/20 dark:border-white/[0.08] shadow-[0_32px_80px_rgba(0,0,0,0.25)] bg-white/90 dark:bg-zinc-900/95 backdrop-blur-3xl">
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/80 dark:via-white/20 to-transparent" />

          <DialogHeader className="px-9 pt-9 pb-6 flex flex-row items-center gap-4">
            <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center shadow-lg shadow-primary/20 shrink-0 text-white">
              {editingId ? <Pencil className="h-6 w-6" /> : <Zap className="h-6 w-6" />}
            </div>
            <div>
              <DialogTitle className="text-lg font-black tracking-tight uppercase italic">{editingId ? "Ajustar Conexão" : "Ligar Nova API"}</DialogTitle>
              <DialogDescription className="text-xs font-medium text-muted-foreground mt-0.5">Configure os parâmetros de segurança para a conexão externa.</DialogDescription>
            </div>
          </DialogHeader>
          
          <div className="flex-1 overflow-y-auto px-9 py-2 space-y-8 pb-8">
            {/* Seção 1: Identidade */}
            <div className="space-y-4">
              <Label className="text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground/60 ml-1">Identidade da Instância</Label>
              <div className="grid grid-cols-1 lg:grid-cols-[120px_1fr] gap-6 p-6 rounded-[2rem] bg-black/[0.02] dark:bg-white/[0.03] border border-black/[0.05] dark:border-white/[0.06]">
                <div className="flex flex-col items-center gap-3">
                  <div className="h-24 w-24 rounded-[1.5rem] bg-white dark:bg-zinc-900 border border-border/40 shadow-xl flex items-center justify-center overflow-hidden p-4 group">
                    {logoUrl ? <img src={logoUrl} alt="" className="h-full w-full object-contain group-hover:scale-110 transition-transform duration-500" /> : <ImageIcon className="h-8 w-8 text-muted-foreground/10" />}
                  </div>
                  <Badge variant="outline" className="text-[7px] font-black uppercase rounded-full px-2 border-primary/20 text-primary/60">Favicon</Badge>
                </div>
                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <Label className="text-[9px] font-black uppercase text-muted-foreground/40">Nome de Exibição</Label>
                    <Input value={instanceName} onChange={e => setInstanceName(e.target.value)} placeholder="Ex: CRM Principal" className="h-11 rounded-xl bg-background border-black/[0.08] dark:border-white/[0.08] font-black text-sm" />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label className="text-[9px] font-black uppercase text-muted-foreground/40">URL do Site</Label>
                      <div className="relative">
                        <Globe className="absolute left-3.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground/30" />
                        <Input value={urlSite} onChange={handleUrlChange} placeholder="exemplo.com.br" className="pl-9 h-10 rounded-xl bg-background text-xs font-bold" />
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-[9px] font-black uppercase text-muted-foreground/40">Custom Logo URL</Label>
                      <div className="relative">
                        <ImageIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground/30" />
                        <Input value={logoUrl} onChange={e => setLogoUrl(e.target.value)} placeholder="https://..." className="pl-9 h-10 rounded-xl bg-background text-[10px] font-mono" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Seção 2: Parâmetros */}
            <div className="space-y-4">
              <div className="flex items-center justify-between px-1">
                <Label className="text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground/60">Dicionário de Parâmetros</Label>
                <Button variant="outline" size="sm" onClick={addField} className="h-7 rounded-lg text-[9px] font-black uppercase gap-1.5 border-primary/20 text-primary hover:bg-primary/5">
                  <Plus size={12} /> Novo Campo
                </Button>
              </div>

              <div className="space-y-3">
                {dynamicFields.length === 0 ? (
                  <div className="text-center py-12 rounded-[2rem] border-2 border-dashed border-black/[0.05] dark:border-white/[0.05] bg-black/[0.01]">
                    <Database className="h-8 w-8 text-muted-foreground/10 mx-auto mb-2" />
                    <p className="text-[10px] font-bold text-muted-foreground/30 uppercase tracking-widest">Nenhum parâmetro definido</p>
                  </div>
                ) : (
                  dynamicFields.map((field) => (
                    <div key={field.id} className="grid grid-cols-[1fr_1fr_auto_auto] items-end gap-3 p-4 rounded-2xl bg-black/[0.02] dark:bg-white/[0.02] border border-black/[0.04] dark:border-white/[0.04] animate-in zoom-in-95">
                      <div className="space-y-1.5">
                        <Label className="text-[8px] font-black text-muted-foreground/50 uppercase ml-1">Chave</Label>
                        <Input value={field.key} onChange={e => updateField(field.id, { key: e.target.value })} placeholder="api_key..." className="h-9 rounded-lg text-xs font-black tracking-wider" />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-[8px] font-black text-muted-foreground/50 uppercase ml-1">Valor</Label>
                        <div className="relative">
                          <Input type={field.isVisible ? "text" : (field.isSecret ? "password" : "text")} value={field.value} onChange={e => updateField(field.id, { value: e.target.value })} className="h-9 rounded-lg text-xs font-bold pr-9" />
                          {field.isSecret && (
                            <button className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground/40 hover:text-primary transition-colors" onClick={() => updateField(field.id, { isVisible: !field.isVisible })}>
                              {field.isVisible ? <EyeOff size={14} /> : <Eye size={14} />}
                            </button>
                          )}
                        </div>
                      </div>
                      <div className="flex flex-col items-center gap-1.5 px-1">
                        <Label className="text-[8px] font-black text-muted-foreground/40 uppercase">Privado</Label>
                        <Button variant="ghost" size="icon" className={cn("h-9 w-9 rounded-lg border", field.isSecret ? 'bg-orange-500/10 border-orange-500/20 text-orange-600' : 'border-black/[0.06] dark:border-white/[0.06] text-muted-foreground/20')} onClick={() => updateField(field.id, { isSecret: !field.isSecret })}>
                          {field.isSecret ? <Lock size={14} /> : <ShieldCheck size={14} />}
                        </Button>
                      </div>
                      <div className="flex flex-col items-center gap-1.5 px-1">
                        <Label className="text-[8px] font-transparent uppercase select-none">X</Label>
                        <Button variant="ghost" size="icon" className="h-9 w-9 rounded-lg text-muted-foreground/20 hover:text-destructive hover:bg-destructive/5" onClick={() => removeField(field.id)}><X size={14} /></Button>
                      </div>
                    </div>
                  ))
                )}
              </div>
              
              <div className="p-4 rounded-2xl bg-primary/5 border border-primary/10 flex items-start gap-3">
                <Info size={14} className="text-primary shrink-0 mt-0.5" />
                <p className="text-[9px] font-medium text-primary/70 leading-relaxed uppercase tracking-wider">
                  As chaves marcadas como <span className="font-black text-primary">Privado</span> serão criptografadas e nunca exibidas em texto limpo nas interfaces de usuário comuns.
                </p>
              </div>
            </div>
          </div>

          <DialogFooter className="px-9 py-6 border-t border-black/[0.05] dark:border-white/[0.06] flex flex-col-reverse sm:flex-row gap-3">
            <Button variant="ghost" onClick={closeIntegrationDialog} className="rounded-xl h-11 font-black text-[10px] uppercase tracking-widest">Cancelar</Button>
            <Button onClick={handleSaveIntegration} disabled={isSaving} className="rounded-xl h-11 gap-2 font-black text-[10px] uppercase tracking-wider shadow-lg shadow-primary/20 flex-1 sm:flex-none sm:px-12">
              {isSaving ? <Loader2 className="animate-spin h-4 w-4" /> : <Check className="h-4 w-4" />}
              {editingId ? "Guardar Alterações" : "Ativar Integração"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
