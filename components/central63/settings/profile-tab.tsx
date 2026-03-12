"use client"

import { useState, useRef, useEffect } from "react"
import { supabase } from "@/lib/supabase"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { 
  Loader2, Save, Camera, Lock, Key, RefreshCw, User, Mail, 
  ShieldCheck, UploadCloud, AtSign, CheckCircle2, BadgeCheck, 
  Fingerprint, Sparkles, UserCircle, Eye, EyeOff, ShieldAlert,
  Moon, Sun, Monitor
} from "lucide-react"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { useTheme } from "next-themes"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"

interface ProfileTabProps {
  profile: {
    id: string
    name: string
    email: string
    role: string
    avatar_url: string
  }
  setProfile: (profile: any) => void
  onRefresh: () => void
}

export function ProfileTab({ profile, setProfile, onRefresh }: ProfileTabProps) {
  const [isSaving, setIsSaving] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [isSyncingAvatar, setIsSyncingAvatar] = useState(false)
  
  const [passwordForm, setPasswordForm] = useState({ newPassword: "", confirmPassword: "" })
  const [showPassword, setShowPassword] = useState(false)
  const [isChangingPassword, setIsChangingPassword] = useState(false)
  const [isPasswordChangedDialogOpen, setIsPasswordChangedDialogOpen] = useState(false)

  const fileInputRef = useRef<HTMLInputElement>(null)

  // Função para sincronizar foto via metadados ou unavatar
  const handleSyncAvatar = async (isManual = false) => {
    if (!isManual && (profile.avatar_url || !profile.id)) return

    if (isManual) setIsSyncingAvatar(true)

    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser()
      
      if (authError || !user) {
        if (isManual) toast.error("Não foi possível identificar o utilizador.")
        return
      }

      let authAvatar = user.user_metadata?.avatar_url || 
                       user.user_metadata?.picture || 
                       user.user_metadata?.avatar ||
                       user.user_metadata?.image

      if (!authAvatar && user.email) {
        authAvatar = `https://unavatar.io/${user.email}`
      }

      if (authAvatar) {
        if (authAvatar === profile.avatar_url) {
          if (isManual) toast.info("A sua foto já está sincronizada.")
          return
        }

        const { error } = await supabase
          .from('profiles')
          .update({ avatar_url: authAvatar })
          .eq('id', user.id)

        if (!error) {
          setProfile((prev: any) => ({ ...prev, avatar_url: authAvatar }))
          toast.success(isManual ? "Foto importada com sucesso!" : "Foto de perfil sincronizada.")
          onRefresh()
        } else {
          if (isManual) toast.error("Erro ao guardar foto.")
        }
      } else if (isManual) {
        toast.info("Nenhuma foto encontrada vinculada a este e-mail.")
      }
    } catch (error) {
      if (isManual) toast.error("Erro ao processar solicitação.")
    } finally {
      if (isManual) setIsSyncingAvatar(false)
    }
  }

  useEffect(() => {
    if (profile.id && !profile.avatar_url) {
      handleSyncAvatar(false)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile.id, profile.avatar_url]) 

  const handleUpdateProfile = async () => {
    if (!profile.name.trim()) return toast.error("O nome é obrigatório")
    setIsSaving(true)
    try {
      const { error } = await supabase.from('profiles').update({ full_name: profile.name }).eq('id', profile.id)
      if (error) throw error
      toast.success("Perfil atualizado com sucesso")
      onRefresh()
    } catch (error: any) {
      toast.error(error.message)
    } finally {
      setIsSaving(false)
    }
  }

  const handleUpdatePassword = async () => {
    const { newPassword, confirmPassword } = passwordForm
    
    if (!newPassword || !confirmPassword) return toast.error("Preencha os campos de senha")
    if (newPassword !== confirmPassword) return toast.error("As senhas não coincidem")
    if (newPassword.length < 6) return toast.error("A senha deve ter pelo menos 6 caracteres")

    setIsChangingPassword(true)
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword })
      
      if (error) throw error
      
      setIsPasswordChangedDialogOpen(true)
      setPasswordForm({ newPassword: "", confirmPassword: "" })
    } catch (error: any) {
      toast.error("Erro ao alterar senha: " + error.message)
    } finally {
      setIsChangingPassword(false)
    }
  }

  const handleUploadAvatar = async (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      if (!event.target.files || event.target.files.length === 0) return
      setIsUploading(true)
      const file = event.target.files[0]
      const fileExt = file.name.split('.').pop()
      const fileName = `${profile.id}-${Date.now()}.${fileExt}`
      
      const { error: uploadError } = await supabase.storage.from('avatars').upload(fileName, file)
      if (uploadError) throw uploadError

      const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(fileName)
      await supabase.from('profiles').update({ avatar_url: publicUrl }).eq('id', profile.id)

      setProfile({ ...profile, avatar_url: publicUrl })
      toast.success("Foto atualizada com sucesso!")
      onRefresh()
    } catch (error: any) {
      toast.error("Erro no upload da imagem.")
    } finally {
      setIsUploading(false)
    }
  }

  const { theme, setTheme, resolvedTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  // Prevenir erros de hidratação
  useEffect(() => { setMounted(true) }, [])

  return (
    <div className="w-full max-w-6xl mx-auto space-y-5 animate-in fade-in duration-500 pb-16 px-4 sm:px-0">
      
      {/* ── BENTO HEADER ─────────────────────────────────────────── */}
      <div className="relative rounded-[2rem] overflow-hidden border border-white/20 dark:border-white/[0.06] bg-white/50 dark:bg-white/[0.02] backdrop-blur-2xl shadow-[0_2px_20px_rgba(0,0,0,0.06)]">
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/90 dark:via-white/30 to-transparent" />

        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between px-6 py-5">
          <div className="flex items-center gap-4">
            <div className="relative h-12 w-12 rounded-2xl bg-gradient-to-br from-primary/90 to-primary/60 shadow-lg shadow-primary/20 flex items-center justify-center shrink-0">
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-t from-transparent to-white/20" />
              <UserCircle className="h-5 w-5 text-white relative z-10" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-black tracking-tight text-foreground">Definições de Perfil</h2>
                <BadgeCheck className="h-4 w-4 text-primary animate-pulse" />
              </div>
              <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-muted-foreground/50 mt-0.5">Personalização e Segurança da Conta</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
             <div className="hidden sm:flex flex-col items-end">
                <p className="text-[10px] font-black uppercase tracking-widest text-foreground/40 leading-none">Status da Conta</p>
                <p className="text-[11px] font-bold text-emerald-500">Verificado & Ativo</p>
             </div>
             <div className="h-8 w-[1px] bg-black/[0.05] dark:bg-white/[0.05] hidden sm:block" />
             <div className="relative h-10 w-10 rounded-xl bg-black/[0.03] dark:bg-white/[0.05] flex items-center justify-center border border-black/[0.05] dark:border-white/[0.1]">
                <ShieldCheck className="h-5 w-5 text-primary/60" />
             </div>
          </div>
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-[340px_1fr]">
        
        {/* ── COLUNA ESQUERDA: Identidade Visual ─────────────────── */}
        <div className="space-y-5">
          <div className="relative rounded-[2rem] overflow-hidden border border-white/20 dark:border-white/[0.08] bg-white/60 dark:bg-white/[0.03] backdrop-blur-3xl shadow-2xl transition-all duration-500 hover:shadow-primary/5 group">
            <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/80 dark:via-white/20 to-transparent" />
            
            {/* Header Decorativo Glass */}
            <div className="h-28 bg-gradient-to-br from-primary/10 via-primary/5 to-transparent relative overflow-hidden">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_120%,rgba(var(--primary),0.05),transparent)]" />
                <div className="absolute top-4 right-4">
                  <Sparkles className="text-primary h-5 w-5 opacity-20 group-hover:opacity-100 transition-all duration-700" />
                </div>
            </div>
            
            <div className="relative px-8 pb-8 text-center">
              {/* Avatar Design Apple Glass */}
              <div className="relative -mt-14 mb-6 inline-block group/avatar">
                <div className="relative h-32 w-32 rounded-[2.5rem] ring-[6px] ring-white/40 dark:ring-white/[0.02] shadow-2xl overflow-hidden bg-white/40 dark:bg-white/[0.02] backdrop-blur-xl border border-white/20 dark:border-white/[0.08] transition-all duration-500 group-hover/avatar:scale-[1.03] group-hover/avatar:ring-primary/20">
                  <Avatar className="h-full w-full rounded-none">
                    <AvatarImage src={profile.avatar_url} className="object-cover" />
                    <AvatarFallback className="text-4xl font-black bg-transparent text-muted-foreground/20">
                      {isUploading ? <Loader2 className="animate-spin h-8 w-8" /> : profile.name?.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  
                  <div 
                    onClick={() => fileInputRef.current?.click()}
                    className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 opacity-0 group-hover/avatar:opacity-100 transition-all duration-300 cursor-pointer backdrop-blur-sm"
                  >
                    <UploadCloud className="text-white h-8 w-8 mb-1" />
                    <span className="text-[9px] text-white font-black uppercase tracking-[0.2em]">Trocar Foto</span>
                  </div>
                </div>
                
                <button
                  className="absolute -bottom-1 -right-1 h-10 w-10 rounded-2xl shadow-xl border-4 border-white dark:border-zinc-900 bg-primary text-white flex items-center justify-center hover:bg-primary/90 transition-all active:scale-90"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploading}
                >
                  <Camera className="h-4 w-4" />
                </button>
              </div>

              <div className="space-y-1 mb-8">
                <h3 className="font-black text-xl tracking-tight text-foreground truncate">{profile.name || "Configurar Nome"}</h3>
                <p className="text-[10px] font-bold text-muted-foreground/40 truncate tracking-widest uppercase">{profile.email}</p>
                
                <div className="pt-4 flex justify-center gap-2">
                  <div className={cn(
                    "rounded-full px-4 py-1 text-[9px] font-black uppercase tracking-[0.15em] border",
                    profile.role === 'Diretor' ? 'bg-purple-500/10 text-purple-600 border-purple-500/20' :
                    profile.role === 'Gestor' ? 'bg-blue-500/10 text-blue-600 border-blue-500/20' :
                    'bg-primary/10 text-primary border-primary/20'
                  )}>
                    {profile.role || "Membro"}
                  </div>
                </div>
              </div>

              {/* Tema Switch Glass */}
              {mounted && (
                <div className="mb-8 p-4 rounded-2xl bg-black/[0.02] dark:bg-white/[0.02] border border-black/[0.05] dark:border-white/[0.05]">
                  <div className="flex items-center justify-between">
                    <div className="flex flex-col items-start">
                      <p className="text-[9px] font-black uppercase tracking-widest text-foreground/40 leading-none mb-1">Aparência</p>
                      <p className="text-[11px] font-bold text-foreground/60">{resolvedTheme === 'dark' ? 'Modo Escuro' : 'Modo Claro'}</p>
                    </div>
                    <div className="flex items-center gap-3 bg-white/40 dark:bg-black/20 p-1 rounded-xl border border-white/20 dark:border-white/[0.05]">
                      <button 
                        onClick={() => setTheme('light')}
                        className={cn("p-1.5 rounded-lg transition-all", resolvedTheme === 'light' ? "bg-white shadow-sm text-orange-500" : "text-muted-foreground/40")}
                      >
                        <Sun size={14} />
                      </button>
                      <button 
                        onClick={() => setTheme('dark')}
                        className={cn("p-1.5 rounded-lg transition-all", resolvedTheme === 'dark' ? "bg-zinc-800 shadow-sm text-primary" : "text-muted-foreground/40")}
                      >
                        <Moon size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              )}

              <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleUploadAvatar} disabled={isUploading} />
              
              <Button 
                variant="ghost" 
                className="w-full text-[10px] font-black uppercase tracking-widest h-12 gap-2.5 rounded-2xl border border-black/[0.06] dark:border-white/[0.08] hover:bg-primary/5 hover:text-primary transition-all active:scale-[0.98] shadow-sm bg-white/40 dark:bg-white/[0.02]" 
                onClick={() => handleSyncAvatar(true)}
                disabled={isSyncingAvatar || isUploading}
              >
                {isSyncingAvatar ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
                Sincronizar Cloud
              </Button>
            </div>
          </div>

          {/* Card de ID Técnico Glass */}
          <div className="relative rounded-[1.75rem] overflow-hidden border border-white/20 dark:border-white/[0.06] bg-white/40 dark:bg-white/[0.02] backdrop-blur-xl p-5 group/id transition-all hover:bg-white/60 dark:hover:bg-white/[0.04]">
             <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/80 dark:via-white/20 to-transparent" />
             <div className="flex items-center gap-4">
                <div className="h-10 w-10 rounded-xl bg-black/[0.03] dark:bg-white/[0.05] border border-black/[0.05] dark:border-white/[0.1] flex items-center justify-center shadow-sm shrink-0 group-hover/id:scale-105 transition-transform">
                  <Fingerprint className="h-5 w-5 text-primary/40" />
                </div>
                <div className="space-y-1 min-w-0">
                  <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/40 leading-none">ID Identificador</p>
                  <p className="text-[11px] font-mono font-bold text-foreground/30 truncate">{profile.id}</p>
                </div>
             </div>
          </div>
        </div>

        {/* ── COLUNA DIREITA: Formulários de Dados e Segurança ──────── */}
        <div className="space-y-5">
          
          {/* Card: Dados da Identidade Glass */}
          <div className="relative rounded-[2rem] overflow-hidden border border-white/20 dark:border-white/[0.08] bg-white/60 dark:bg-white/[0.03] backdrop-blur-3xl shadow-2xl transition-all duration-500">
            <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/80 dark:via-white/20 to-transparent" />
            
            <div className="px-8 pt-8 pb-5 border-b border-black/[0.04] dark:border-white/[0.04] flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary border border-primary/20">
                  <User size={24} />
                </div>
                <div>
                  <h3 className="text-sm font-black tracking-[0.1em] uppercase text-foreground">Informação Geral</h3>
                  <p className="text-[10px] font-bold text-muted-foreground/40 uppercase tracking-widest">Dados de identificação no ecossistema</p>
                </div>
              </div>
            </div>

            <div className="p-8 space-y-6">
              <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-foreground/60 ml-1">Nome Completo</Label>
                  <div className="relative group">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/30 group-focus-within:text-primary transition-all duration-300" />
                    <Input 
                      value={profile.name} 
                      onChange={(e) => setProfile({ ...profile, name: e.target.value })} 
                      className="h-12 pl-12 rounded-xl bg-black/[0.03] dark:bg-white/[0.04] border-black/[0.05] dark:border-white/[0.06] focus:bg-white dark:focus:bg-white/[0.06] text-xs font-bold transition-all"
                      placeholder="Introduza o seu nome"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-foreground/60 ml-1">Endereço de E-mail</Label>
                  <div className="relative group opacity-60">
                    <AtSign className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/30" />
                    <Input 
                      value={profile.email} 
                      disabled 
                      className="h-12 pl-12 rounded-xl bg-black/[0.02] dark:bg-white/[0.02] border-dashed border-black/[0.1] dark:border-white/[0.1] text-xs font-bold cursor-not-allowed" 
                    />
                  </div>
                </div>
              </div>
              
              <div className="flex justify-end pt-4">
                <Button 
                  onClick={handleUpdateProfile} 
                  disabled={isSaving} 
                  className="rounded-xl gap-2.5 px-10 h-12 shadow-lg shadow-primary/20 font-black uppercase text-[10px] tracking-widest transition-all hover:scale-[1.02] active:scale-95 bg-primary text-white"
                >
                  {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                  Guardar Perfil
                </Button>
              </div>
            </div>
          </div>

          {/* Card: Segurança & Autenticação Glass */}
          <div className="relative rounded-[2rem] overflow-hidden border border-white/20 dark:border-white/[0.08] bg-white/60 dark:bg-white/[0.03] backdrop-blur-3xl shadow-2xl transition-all duration-500">
            <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/80 dark:via-white/20 to-transparent" />
            
            <div className="px-8 pt-8 pb-5 border-b border-black/[0.04] dark:border-white/[0.04] flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-2xl bg-orange-500/10 flex items-center justify-center text-orange-500 border border-orange-500/20">
                  <Lock size={22} />
                </div>
                <div>
                  <h3 className="text-sm font-black tracking-[0.1em] uppercase text-foreground">Segurança da Conta</h3>
                  <p className="text-[10px] font-bold text-muted-foreground/40 uppercase tracking-widest">Gestão de credenciais e acesso</p>
                </div>
              </div>
            </div>

            <div className="p-8 space-y-6">
              <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-foreground/60 ml-1">Nova Senha</Label>
                  <div className="relative group">
                    <Key className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/30 group-focus-within:text-orange-500 transition-all duration-300" />
                    <Input 
                      type={showPassword ? "text" : "password"} 
                      placeholder="Mínimo 6 caracteres"
                      value={passwordForm.newPassword}
                      onChange={(e) => setPasswordForm({...passwordForm, newPassword: e.target.value})}
                      className="h-12 pl-12 pr-12 rounded-xl bg-black/[0.03] dark:bg-white/[0.04] border-black/[0.05] dark:border-white/[0.06] focus:bg-white dark:focus:bg-white/[0.06] text-xs font-bold transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground/30 hover:text-orange-500 transition-colors"
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-foreground/60 ml-1">Confirmar Nova Senha</Label>
                  <div className="relative group">
                    <ShieldCheck className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/30 group-focus-within:text-orange-500 transition-all duration-300" />
                    <Input 
                      type={showPassword ? "text" : "password"} 
                      placeholder="Repita a senha"
                      value={passwordForm.confirmPassword}
                      onChange={(e) => setPasswordForm({...passwordForm, confirmPassword: e.target.value})}
                      className="h-12 pl-12 rounded-xl bg-black/[0.03] dark:bg-white/[0.04] border-black/[0.05] dark:border-white/[0.06] focus:bg-white dark:focus:bg-white/[0.06] text-xs font-bold transition-all"
                    />
                  </div>
                </div>
              </div>
              
              <div className="flex flex-col sm:flex-row items-center justify-between gap-6 pt-4">
                <div className="flex items-start gap-3 p-3 rounded-xl bg-orange-500/5 border border-orange-500/10">
                  <ShieldAlert className="h-4 w-4 text-orange-500 shrink-0 mt-0.5" />
                  <p className="text-[9px] font-bold text-orange-600/60 dark:text-orange-400/60 uppercase tracking-widest leading-relaxed">
                    Recomendamos o uso de senhas complexas e únicas para maior proteção dos seus dados.
                  </p>
                </div>
                <Button 
                  onClick={handleUpdatePassword} 
                  disabled={isChangingPassword} 
                  className="w-full sm:w-auto rounded-xl gap-2.5 px-10 h-12 shadow-lg shadow-orange-500/20 font-black uppercase text-[10px] tracking-widest transition-all bg-orange-500 text-white hover:bg-orange-600 active:scale-95 border-none"
                >
                  {isChangingPassword ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
                  Atualizar Senha
                </Button>
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* ── DIALOG DE SUCESSO GLASS ─────────────────────────────── */}
      <Dialog open={isPasswordChangedDialogOpen} onOpenChange={setIsPasswordChangedDialogOpen}>
        <DialogContent className="sm:max-w-md text-center p-0 rounded-[2.5rem] border-white/20 dark:border-white/[0.08] bg-white/80 dark:bg-zinc-900/80 backdrop-blur-2xl shadow-3xl overflow-hidden">
          <div className="absolute top-0 inset-x-0 h-1.5 bg-gradient-to-r from-emerald-400 to-emerald-600" />
          
          <div className="p-10 flex flex-col items-center">
            <div className="h-24 w-24 rounded-[2rem] bg-emerald-500/10 flex items-center justify-center mb-8 ring-8 ring-emerald-500/5 animate-in zoom-in-50 duration-500 border border-emerald-500/20">
              <CheckCircle2 className="h-12 w-12 text-emerald-500" />
            </div>
            
            <div className="space-y-3 mb-10">
              <h3 className="text-2xl font-black tracking-tight text-foreground uppercase">Acesso Atualizado</h3>
              <p className="text-muted-foreground/60 text-[12px] font-bold uppercase tracking-widest leading-relaxed max-w-[260px] mx-auto">
                A sua senha foi modificada com sucesso. A sua conta está agora protegida.
              </p>
            </div>
            
            <Button 
              className="w-full max-w-[200px] rounded-2xl h-12 font-black shadow-xl shadow-emerald-500/20 uppercase text-[10px] tracking-widest transition-all hover:scale-[1.02] active:scale-95 bg-emerald-500 text-white hover:bg-emerald-600" 
              onClick={() => setIsPasswordChangedDialogOpen(false)}
            >
              Concluído
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}