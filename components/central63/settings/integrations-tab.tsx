"use client"

import { useState, useMemo } from "react"
import { supabase } from "@/lib/supabase"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"
import { 
  Loader2, ShieldCheck, Database, Plus, Trash2, Globe, Pencil, 
  Eye, EyeOff, Settings, Key, Link as LinkIcon, Image as ImageIcon, 
  ExternalLink, MoreHorizontal, Copy, Check, Zap, X, CopyPlus, Search,
  Activity, Lock, Calendar, Clock
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Separator } from "@/components/ui/separator"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

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

export function IntegrationsTab({ integrations, onRefresh }: IntegrationsTabProps) {
  const [isIntegrationDialogOpen, setIsIntegrationDialogOpen] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  
  // Estados do formulário
  const [instanceName, setInstanceName] = useState("")
  const [urlSite, setUrlSite] = useState("")
  const [logoUrl, setLogoUrl] = useState("")
  const [dynamicFields, setDynamicFields] = useState<DynamicField[]>([])

  // Filtro de integrações
  const filteredIntegrations = useMemo(() => {
    return integrations.filter(item => 
      item.instance_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.url_site?.toLowerCase().includes(searchTerm.toLowerCase())
    )
  }, [integrations, searchTerm])

  const addField = () => {
    setDynamicFields([
      ...dynamicFields, 
      { id: crypto.randomUUID(), key: "", value: "", isSecret: false, isVisible: false }
    ])
  }

  const removeField = (id: string) => {
    setDynamicFields(dynamicFields.filter(f => f.id !== id))
  }

  const updateField = (id: string, updates: Partial<DynamicField>) => {
    setDynamicFields(dynamicFields.map(f => f.id === id ? { ...f, ...updates } : f))
  }

  const openEditIntegration = (item: any) => {
    setEditingId(item.id)
    setInstanceName(item.instance_name || "")
    setUrlSite(item.url_site || "")
    setLogoUrl(item.logo_url || "")
    
    const fields = item.api_config ? Object.entries(item.api_config).map(([key, config]: [string, any]) => ({
      id: crypto.randomUUID(),
      key,
      value: config.value || "",
      isSecret: config.isSecret || false,
      isVisible: false
    })) : []
    
    setDynamicFields(fields)
    setIsIntegrationDialogOpen(true)
  }

  const handleDuplicateIntegration = (item: any) => {
    setEditingId(null)
    setInstanceName(`${item.instance_name || "Instância"} (Cópia)`)
    setUrlSite(item.url_site || "")
    setLogoUrl(item.logo_url || "")
    
    const fields = item.api_config ? Object.entries(item.api_config).map(([key, config]: [string, any]) => ({
      id: crypto.randomUUID(),
      key,
      value: config.value || "",
      isSecret: config.isSecret || false,
      isVisible: false
    })) : []
    
    setDynamicFields(fields)
    setIsIntegrationDialogOpen(true)
    toast.info("Configuração clonada. Ajuste os detalhes antes de gravar.")
  }

  const closeIntegrationDialog = () => {
    setIsIntegrationDialogOpen(false)
    setEditingId(null)
    setInstanceName("")
    setUrlSite("")
    setLogoUrl("")
    setDynamicFields([])
  }

  const handleUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const url = e.target.value
    setUrlSite(url)

    if (url && url.length > 3 && !logoUrl) {
      try {
        const urlObj = new URL(url.startsWith('http') ? url : `https://${url}`)
        const domain = urlObj.hostname
        setLogoUrl(`https://www.google.com/s2/favicons?domain=${domain}&sz=128`)
      } catch (error) {}
    }
  }

  const handleSaveIntegration = async () => {
    if (!instanceName) return toast.error("O nome da instância é obrigatório")
    
    const hasEmptyKeys = dynamicFields.some(f => !f.key.trim())
    if (hasEmptyKeys) return toast.error("Preencha todos os nomes de chave")

    setIsSaving(true)
    try {
      const apiConfig: Record<string, any> = {}
      dynamicFields.forEach(f => {
        apiConfig[f.key] = { value: f.value, isSecret: f.isSecret }
      })

      const payload = {
        instance_name: instanceName,
        url_site: urlSite,
        logo_url: logoUrl,
        api_config: apiConfig,
        updated_at: new Date()
      }

      let error
      if (editingId) {
        const res = await supabase.from('company_settings').update(payload).eq('id', editingId)
        error = res.error
      } else {
        const res = await supabase.from('company_settings').insert([payload])
        error = res.error
      }

      if (error) throw error
      toast.success(editingId ? "Integração atualizada" : "Nova API conectada")
      closeIntegrationDialog()
      onRefresh()
    } catch (error: any) {
      toast.error("Erro ao gravar: " + error.message)
    } finally {
      setIsSaving(false)
    }
  }

  const handleRemoveIntegration = async (id: string) => {
    if (!confirm("Eliminar esta integração permanentemente?")) return
    try {
      const { error } = await supabase.from('company_settings').delete().eq('id', id)
      if (error) throw error
      toast.success("Removido com sucesso")
      onRefresh()
    } catch (error: any) {
      toast.error("Erro ao remover")
    }
  }

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text)
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 2000)
    toast.success("Valor copiado")
  }

  return (
    <div className="w-full max-w-6xl mx-auto space-y-5 animate-in fade-in duration-500 pb-12">
      
      {/* Cabeçalho de Acções - Estilo Forms */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between bg-card p-4 rounded-3xl border border-border/50 shadow-sm">
        <div className="space-y-0.5 ml-2">
          <h2 className="text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
            Integrações <Badge variant="secondary" className="rounded-full bg-primary/10 text-primary border-none text-[10px] h-5 px-2">{integrations.length}</Badge>
          </h2>
          <p className="text-muted-foreground text-[11px] font-bold uppercase tracking-widest opacity-60">Conexões Externas e APIs</p>
        </div>
        
        <div className="flex flex-col sm:flex-row items-center gap-2.5 w-full md:w-auto">
          <div className="relative group w-full sm:w-64">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground group-focus-within:text-primary transition-colors" />
            <Input 
              placeholder="Pesquisar..." 
              className="pl-10 bg-muted/40 border-border/60 focus:ring-primary/20 h-11 rounded-2xl text-sm transition-all shadow-inner"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <Button 
            onClick={() => {
              setEditingId(null);
              setInstanceName("");
              setUrlSite("");
              setLogoUrl("");
              setDynamicFields([{ id: crypto.randomUUID(), key: "", value: "", isSecret: false, isVisible: false }]);
              setIsIntegrationDialogOpen(true);
            }} 
            className="w-full sm:w-auto rounded-2xl h-11 px-6 gap-2 shadow-lg shadow-primary/10 transition-all hover:shadow-primary/20 active:scale-95"
          >
            <Zap size={18} />
            <span className="text-xs font-black uppercase tracking-widest">Ligar API</span>
          </Button>
        </div>
      </div>

      {/* Grid de Integrações */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {filteredIntegrations.length === 0 ? (
          <Card className="border-2 border-dashed border-border/40 shadow-none col-span-full bg-muted/5 rounded-[2.5rem]">
            <CardContent className="flex flex-col items-center justify-center py-20 text-center space-y-4">
              <div className="h-16 w-16 rounded-[1.5rem] bg-primary/5 flex items-center justify-center ring-1 ring-primary/10">
                <Database className="h-8 w-8 text-primary/40" />
              </div>
              <div className="space-y-1">
                <h3 className="text-xl font-bold text-foreground">Sem APIs configuradas</h3>
                <p className="text-sm text-muted-foreground">Adicione uma nova instância para gerenciar chaves e tokens.</p>
              </div>
              <Button 
                variant="outline" 
                size="sm"
                className="rounded-2xl px-8 h-10 text-xs font-bold uppercase tracking-widest"
                onClick={() => setIsIntegrationDialogOpen(true)}
              >
                Configurar agora
              </Button>
            </CardContent>
          </Card>
        ) : (
          filteredIntegrations.map((item) => (
            <Card key={item.id} className="group relative overflow-hidden border-border/50 hover:border-primary/40 hover:shadow-xl transition-all duration-500 rounded-[2.25rem] bg-card/70 backdrop-blur-md shadow-sm">
              
              {/* Menu de Opções */}
              <div className="absolute top-4 right-4 z-20">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="rounded-full h-9 w-9 hover:bg-background/80 border border-border/10 bg-background/40 backdrop-blur-xl transition-all shadow-sm group-hover:border-primary/20">
                      <MoreHorizontal className="h-5 w-5 text-muted-foreground/80" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56 rounded-3xl p-2 shadow-2xl border-border/50 backdrop-blur-xl">
                    <DropdownMenuLabel className="text-[10px] font-black uppercase text-muted-foreground/40 px-3 py-2 tracking-[0.2em]">Configuração</DropdownMenuLabel>
                    <DropdownMenuItem onClick={() => openEditIntegration(item)} className="rounded-2xl gap-3 py-3 cursor-pointer font-bold text-xs hover:bg-primary/5">
                      <Pencil className="h-4 w-4 text-primary" /> Editar Dados
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleDuplicateIntegration(item)} className="rounded-2xl gap-3 py-3 cursor-pointer font-bold text-xs hover:bg-primary/5">
                      <CopyPlus className="h-4 w-4 text-primary" /> Duplicar Instância
                    </DropdownMenuItem>
                    <DropdownMenuSeparator className="my-2 opacity-50" />
                    <DropdownMenuItem 
                      className="rounded-2xl gap-3 py-3 text-destructive focus:text-destructive focus:bg-destructive/5 cursor-pointer font-bold text-xs" 
                      onClick={() => handleRemoveIntegration(item.id)}
                    >
                      <Trash2 className="h-4 w-4" /> Remover Ligação
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              <CardContent className="p-6 flex items-center gap-7">
                <div className="relative shrink-0">
                  <div className="h-24 w-24 rounded-[2rem] bg-white dark:bg-zinc-900 border border-border/60 shadow-xl flex items-center justify-center overflow-hidden transition-transform group-hover:scale-105 duration-500">
                    {item.logo_url ? (
                      <img src={item.logo_url} alt="" className="h-full w-full object-contain p-3" />
                    ) : (
                      <Globe className="h-10 w-10 text-primary/10" />
                    )}
                  </div>
                  <div className="absolute -bottom-1 -right-1 h-6 w-6 rounded-full bg-emerald-500 border-4 border-background shadow-lg" />
                </div>

                <div className="min-w-0 flex-1 space-y-2.5 pr-10">
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="text-[9px] h-5 px-2.5 font-black uppercase bg-primary/5 text-primary border-none tracking-[0.1em]">Cloud API</Badge>
                  </div>
                  
                  <CardTitle className="text-xl font-black truncate tracking-tight text-foreground leading-tight" title={item.instance_name}>
                    {item.instance_name}
                  </CardTitle>

                  <div className="flex flex-col gap-2">
                    {item.url_site && (
                      <div className="flex items-center gap-2 text-muted-foreground/60 font-bold text-[11px] truncate">
                        <LinkIcon className="h-3.5 w-3.5 opacity-40 shrink-0" />
                        <span className="truncate">{item.url_site.replace(/^https?:\/\//, '')}</span>
                      </div>
                    )}
                    
                    <div className="flex flex-wrap gap-1.5 mt-1">
                      {item.api_config && Object.keys(item.api_config).slice(0, 2).map((key) => (
                        <div key={key} className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-muted/30 border border-border/10 text-[9px] font-black uppercase tracking-tighter text-muted-foreground/50">
                           <Activity className="h-2.5 w-2.5 opacity-40" />
                           {key}
                        </div>
                      ))}
                      {item.api_config && Object.keys(item.api_config).length > 2 && (
                        <div className="text-[8px] font-black text-primary/40 pt-1">+ {Object.keys(item.api_config).length - 2}</div>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
              <div className="h-1 w-full bg-gradient-to-r from-primary/30 via-transparent to-transparent opacity-40" />
            </Card>
          ))
        )}
      </div>

      {/* DIALOG DE EDIÇÃO - Design Otimizado */}
      <Dialog open={isIntegrationDialogOpen} onOpenChange={setIsIntegrationDialogOpen}>
        <DialogContent className="sm:max-w-[720px] max-h-[90vh] flex flex-col p-0 overflow-hidden rounded-[2.5rem] border-none shadow-3xl">
          {/* Header de Edição Estilizado */}
          <DialogHeader className="px-10 pt-10 pb-6 bg-gradient-to-b from-primary/5 to-transparent flex flex-row items-center gap-6">
            <div className="h-16 w-16 rounded-[1.5rem] bg-primary flex items-center justify-center shadow-2xl shadow-primary/30 shrink-0 text-white">
              {editingId ? <Pencil className="h-7 w-7" /> : <Plus className="h-8 w-8" />}
            </div>
            <div className="min-w-0 flex-1">
              <DialogTitle className="text-2xl font-black tracking-tight leading-none mb-2">
                {editingId ? "Configurar Instância" : "Conectar Nova API"}
              </DialogTitle>
              <DialogDescription className="text-sm font-medium text-muted-foreground/80 flex items-center gap-2">
                <Activity className="h-3 w-3 text-emerald-500" />
                Defina os parâmetros técnicos e a identidade da integração.
              </DialogDescription>
            </div>
            <button 
              onClick={closeIntegrationDialog}
              className="h-10 w-10 rounded-full flex items-center justify-center hover:bg-muted/50 transition-colors"
            >
              <X className="h-5 w-5 text-muted-foreground/40" />
            </button>
          </DialogHeader>
          
          <div className="flex-1 overflow-y-auto px-10 py-4 space-y-10 pb-10">
            {/* Secção 1: Identidade & Visual (Layout Lado a Lado) */}
            <div className="space-y-6">
              <div className="flex items-center gap-3">
                <div className="h-6 w-1 bg-primary rounded-full shadow-[0_0_10px_rgba(var(--primary),0.5)]" />
                <h3 className="text-[10px] font-black uppercase tracking-[0.25em] text-foreground/50">Identidade & Visual</h3>
              </div>
              
              <div className="grid grid-cols-1 lg:grid-cols-[160px_1fr] gap-8 p-8 rounded-[2rem] bg-muted/20 border border-border/30 hover:bg-muted/30 transition-colors duration-500">
                <div className="flex flex-col items-center gap-4">
                   <div className="h-32 w-32 rounded-[2rem] bg-white dark:bg-zinc-900 border border-border shadow-xl flex items-center justify-center overflow-hidden relative group">
                      {logoUrl ? (
                        <img src={logoUrl} alt="Preview" className="h-full w-full object-contain p-6 group-hover:scale-110 transition-transform duration-500" />
                      ) : (
                        <ImageIcon className="h-12 w-12 text-muted-foreground/10" />
                      )}
                      <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                   </div>
                   <Badge variant="outline" className="text-[8px] font-black uppercase rounded-full px-3 py-1 border-primary/20 text-primary/60 bg-primary/5 tracking-widest">Logo API</Badge>
                </div>
                
                <div className="grid gap-6">
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest ml-1 text-muted-foreground/70">Nome da Instância</Label>
                    <Input 
                      value={instanceName} 
                      onChange={e => setInstanceName(e.target.value)} 
                      placeholder="Ex: CRM Principal - São Paulo"
                      className="h-12 bg-background border-border/60 focus:ring-primary/20 rounded-2xl font-black text-lg shadow-sm"
                    />
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label className="text-[10px] font-black uppercase tracking-widest ml-1 text-muted-foreground/70">URL do Site</Label>
                      <div className="relative">
                        <Globe className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground/30" />
                        <Input 
                          value={urlSite} 
                          onChange={handleUrlChange}
                          placeholder="exemplo.com.br"
                          className="pl-12 h-11 bg-background border-border/60 focus:ring-primary/20 rounded-2xl font-bold shadow-sm"
                        />
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-[10px] font-black uppercase tracking-widest ml-1 text-muted-foreground/70">Link do Logo (Opcional)</Label>
                      <div className="relative">
                        <ImageIcon className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground/30" />
                        <Input 
                          value={logoUrl} 
                          onChange={e => setLogoUrl(e.target.value)}
                          placeholder="https://.../logo.png"
                          className="pl-12 h-11 bg-background border-border/60 focus:ring-primary/20 rounded-2xl font-mono text-[11px] shadow-sm"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Secção 2: Parâmetros Dinâmicos (Editor Estilizado) */}
            <div className="space-y-6 pb-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-6 w-1 bg-primary rounded-full shadow-[0_0_10px_rgba(var(--primary),0.5)]" />
                  <h3 className="text-[10px] font-black uppercase tracking-[0.25em] text-foreground/50">Definições de Conexão</h3>
                </div>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={addField} 
                  className="rounded-full h-10 text-[10px] font-black uppercase gap-2 border-primary/20 text-primary hover:bg-primary/5 hover:border-primary transition-all px-6 shadow-md hover:shadow-primary/5"
                >
                  <Plus className="h-4 w-4" /> Novo Campo
                </Button>
              </div>

              <div className="grid gap-4">
                {dynamicFields.length === 0 ? (
                  <div className="text-center py-20 rounded-[2.5rem] border-2 border-dashed border-border/40 bg-muted/5 flex flex-col items-center">
                    <div className="h-16 w-16 rounded-3xl bg-muted/10 flex items-center justify-center mb-4">
                      <Database className="h-8 w-8 text-muted-foreground/20" />
                    </div>
                    <p className="text-[11px] font-black text-muted-foreground/40 uppercase tracking-[0.3em] mb-1">Dicionário JSON Vazio</p>
                    <p className="text-xs text-muted-foreground font-medium">Adicione parâmetros como API Key ou Tokens abaixo.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {dynamicFields.map((field) => (
                      <div key={field.id} className="group/field grid grid-cols-[1fr_1fr_auto_auto] items-end gap-5 p-6 rounded-[2rem] bg-card border border-border/40 shadow-sm hover:border-primary/30 transition-all duration-300 animate-in zoom-in-95 duration-200">
                        <div className="space-y-2">
                          <Label className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.1em] ml-1">Chave do Parâmetro</Label>
                          <div className="relative">
                            <Database className="absolute left-4 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground/30" />
                            <Input 
                              value={field.key} 
                              onChange={e => updateField(field.id, { key: e.target.value })}
                              placeholder="api_key, token..."
                              className="h-11 pl-10 text-xs bg-muted/10 border-transparent focus:bg-background focus:border-border rounded-xl font-black tracking-wider transition-all"
                            />
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.1em] ml-1">Valor Correspondente</Label>
                          <div className="relative">
                            <Input 
                              type={field.isVisible ? "text" : (field.isSecret ? "password" : "text")}
                              value={field.value} 
                              onChange={e => updateField(field.id, { value: e.target.value })}
                              placeholder="Introduza o valor..."
                              className="h-11 text-xs bg-muted/10 border-transparent focus:bg-background focus:border-border pr-12 rounded-xl font-bold transition-all"
                            />
                            {field.isSecret && (
                              <button 
                                className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground/40 hover:text-primary transition-colors"
                                onClick={() => updateField(field.id, { isVisible: !field.isVisible })}
                              >
                                {field.isVisible ? <EyeOff size={18} /> : <Eye size={18} />}
                              </button>
                            )}
                          </div>
                        </div>
                        <div className="flex flex-col items-center gap-2">
                          <Label className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.1em]">Privado</Label>
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button 
                                  variant="ghost" 
                                  size="icon" 
                                  className={`h-11 w-11 rounded-xl border transition-all ${field.isSecret ? 'bg-orange-500/10 border-orange-500/30 text-orange-600 shadow-sm' : 'border-border/40 text-muted-foreground/20 hover:text-foreground'}`}
                                  onClick={() => updateField(field.id, { isSecret: !field.isSecret })}
                                >
                                  {field.isSecret ? <Lock className="h-5 w-5" /> : <ShieldCheck className="h-5 w-5" />}
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent className="rounded-xl border-border/50 font-bold text-[10px] uppercase">Ocultar Valor</TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </div>
                        <div className="flex flex-col items-center gap-2">
                          <Label className="text-[10px] font-black text-transparent">Remover</Label>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-11 w-11 rounded-xl text-muted-foreground/20 hover:text-destructive hover:bg-destructive/5 transition-all mb-0.5"
                            onClick={() => removeField(field.id)}
                          >
                            <X className="h-5 w-5" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Footer do Modal Estilizado */}
          <div className="px-10 py-8 border-t border-border/40 bg-muted/30 flex flex-col-reverse sm:flex-row gap-4 items-center justify-end">
            <Button 
              variant="ghost" 
              onClick={closeIntegrationDialog} 
              className="rounded-2xl px-8 font-black h-12 text-xs uppercase tracking-widest hover:bg-muted/50 w-full sm:w-auto text-muted-foreground transition-all"
            >
              Cancelar Operação
            </Button>
            <Button 
              onClick={handleSaveIntegration} 
              disabled={isSaving} 
              className="rounded-2xl gap-3 px-12 h-12 shadow-2xl shadow-primary/20 font-black tracking-tight text-sm uppercase transition-all hover:scale-[1.02] active:scale-95 w-full sm:w-auto"
            >
              {isSaving ? <Loader2 className="animate-spin h-6 w-6" /> : <Check className="h-6 w-6" />}
              {editingId ? "Guardar Alterações" : "Ativar Integração"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}