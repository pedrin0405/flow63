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
  Fingerprint, Sparkles, UserCircle, Eye, EyeOff, ShieldAlert
} from "lucide-react"
import { toast } from "sonner"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
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

  return (
    <div className="w-full max-w-6xl mx-auto space-y-6 animate-in fade-in duration-700 pb-16 px-4 sm:px-0">
      
      {/* Cabeçalho da Secção */}
      <div className="flex flex-col space-y-1 ml-2">
        <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-foreground">Definições de Perfil</h2>
        <p className="text-muted-foreground text-[13px] font-medium flex items-center gap-2 opacity-80 uppercase tracking-widest">
          <Sparkles className="h-3.5 w-3.5 text-primary" />
          Personalização e Segurança da Conta
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[340px_1fr]">
        
        {/* COLUNA ESQUERDA: Identidade Visual */}
        <div className="space-y-5">
          <Card className="overflow-hidden border-border/50 shadow-xl rounded-[2.25rem] bg-card/50 backdrop-blur-md border group transition-all duration-500 hover:shadow-primary/5">
            {/* Header Decorativo */}
            <div className="h-28 bg-gradient-to-br from-primary/15 via-primary/5 to-transparent relative overflow-hidden">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_120%,rgba(var(--primary),0.05),transparent)]" />
                <div className="absolute top-4 right-4">
                  <BadgeCheck className="text-primary h-6 w-6 opacity-10 group-hover:opacity-100 transition-all duration-700" />
                </div>
            </div>
            
            <CardContent className="relative px-8 pb-8 text-center">
              {/* Secção do Avatar com Design Elevado */}
              <div className="relative -mt-14 mb-5 inline-block group/avatar">
                <div className="relative h-28 w-28 rounded-[2rem] ring-[5px] ring-background shadow-2xl overflow-hidden bg-muted border border-border/50 transition-all duration-500 group-hover/avatar:scale-[1.03] group-hover/avatar:ring-primary/10">
                  <Avatar className="h-full w-full rounded-none">
                    <AvatarImage src={profile.avatar_url} className="object-cover" />
                    <AvatarFallback className="text-3xl font-black bg-muted text-muted-foreground/30">
                      {isUploading ? <Loader2 className="animate-spin h-8 w-8" /> : profile.name?.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  
                  <div 
                    onClick={() => fileInputRef.current?.click()}
                    className="absolute inset-0 flex flex-col items-center justify-center bg-black/70 opacity-0 group-hover/avatar:opacity-100 transition-all duration-300 cursor-pointer backdrop-blur-[2px]"
                  >
                    <UploadCloud className="text-white h-7 w-7 mb-1 animate-pulse" />
                    <span className="text-[9px] text-white font-black uppercase tracking-[0.2em]">Upload</span>
                  </div>
                </div>
                
                <Button
                  size="icon"
                  className="absolute -bottom-1 -right-1 h-9 w-9 rounded-2xl shadow-xl border-4 border-background bg-primary text-white hover:bg-primary/90 transition-all active:scale-90"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploading}
                >
                  <Camera className="h-4 w-4" />
                </Button>
              </div>

              <div className="space-y-1 mb-6 min-w-0">
                <h3 className="font-black text-lg tracking-tight text-foreground truncate px-2">{profile.name || "Configurar Nome"}</h3>
                <p className="text-[11px] font-bold text-muted-foreground/50 truncate tracking-wide uppercase">{profile.email}</p>
                <div className="pt-3 flex justify-center">
                  <Badge className={`rounded-full px-4 py-0.5 font-black text-[9px] uppercase tracking-[0.15em] border-none ${
                    profile.role === 'Diretor' ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400' :
                    profile.role === 'Gestor' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' :
                    'bg-primary/10 text-primary'
                  }`}>
                    {profile.role || "Membro"}
                  </Badge>
                </div>
              </div>

              <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleUploadAvatar} disabled={isUploading} />
              
              <Button 
                variant="outline" 
                size="sm" 
                className="w-full text-[10px] font-black uppercase tracking-[0.2em] h-10 gap-2.5 rounded-2xl border-border/60 hover:bg-primary/5 hover:text-primary transition-all active:scale-[0.98] shadow-sm" 
                onClick={() => handleSyncAvatar(true)}
                disabled={isSyncingAvatar || isUploading}
              >
                {isSyncingAvatar ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
                Sincronizar Cloud
              </Button>
            </CardContent>
          </Card>

          {/* Card de ID Técnico */}
          <Card className="border-border/40 shadow-sm rounded-[1.75rem] bg-muted/20 border-none p-5 group/id hover:bg-muted/30 transition-colors">
             <div className="flex items-center gap-4">
                <div className="h-9 w-9 rounded-xl bg-background border border-border/40 flex items-center justify-center shadow-sm shrink-0 group-hover/id:scale-105 transition-transform">
                  <Fingerprint className="h-4.5 w-4.5 text-primary/40" />
                </div>
                <div className="space-y-0.5 min-w-0">
                  <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/60 leading-none">ID Identificador</p>
                  <p className="text-[11px] font-mono font-bold opacity-40 truncate">{profile.id}</p>
                </div>
             </div>
          </Card>
        </div>

        {/* COLUNA DIREITA: Formulários de Dados e Segurança */}
        <div className="space-y-6">
          
          {/* Card: Dados da Identidade */}
          <Card className="border-border/50 shadow-xl rounded-[2.25rem] bg-card border overflow-hidden">
            <CardHeader className="px-8 pt-8 pb-5 border-b border-border/30 bg-muted/10">
              <div className="flex items-center gap-3.5">
                <div className="h-11 w-11 rounded-2xl bg-primary/10 flex items-center justify-center text-primary shadow-sm">
                  <UserCircle className="h-6 w-6" />
                </div>
                <div>
                  <CardTitle className="text-base font-black tracking-tight uppercase">Informação Geral</CardTitle>
                  <CardDescription className="text-[12px] font-medium opacity-60">Dados de identificação no ecossistema Flow63.</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-8 space-y-6">
              <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/70 ml-1">Nome Completo</Label>
                  <div className="relative group">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/30 group-focus-within:text-primary transition-all duration-300" />
                    <Input 
                      id="name"
                      value={profile.name} 
                      onChange={(e) => setProfile({ ...profile, name: e.target.value })} 
                      className="h-11 pl-11 bg-muted/30 border-transparent focus:bg-background focus:ring-primary/10 transition-all rounded-xl font-bold text-sm shadow-inner"
                      placeholder="Introduza o seu nome"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/70 ml-1">Endereço de E-mail</Label>
                  <div className="relative group opacity-60">
                    <AtSign className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/30" />
                    <Input 
                      id="email"
                      value={profile.email} 
                      disabled 
                      className="h-11 pl-11 bg-muted/50 text-muted-foreground font-bold cursor-not-allowed border-dashed border-border/40 rounded-xl text-sm" 
                    />
                  </div>
                </div>
              </div>
              
              <div className="flex justify-end pt-2">
                <Button 
                  onClick={handleUpdateProfile} 
                  disabled={isSaving} 
                  className="rounded-xl gap-2.5 px-8 h-11 shadow-lg shadow-primary/20 font-black uppercase text-[10px] tracking-[0.15em] transition-all hover:scale-[1.02] active:scale-95"
                >
                  {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                  Guardar Perfil
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Card: Segurança & Autenticação */}
          <Card className="border-border/50 shadow-xl rounded-[2.25rem] bg-card border relative overflow-hidden group/security">
            {/* Efeito Visual de Segurança */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-orange-500/[0.03] rounded-full blur-[80px] -z-10 group-hover/security:bg-orange-500/[0.06] transition-all duration-700" />
            
            <CardHeader className="px-8 pt-8 pb-5 border-b border-border/30 bg-muted/10">
              <div className="flex items-center gap-3.5">
                <div className="h-11 w-11 rounded-2xl bg-orange-500/10 flex items-center justify-center text-orange-600 shadow-sm">
                  <Lock className="h-5 w-5" />
                </div>
                <div>
                  <CardTitle className="text-base font-black tracking-tight uppercase">Segurança da Conta</CardTitle>
                  <CardDescription className="text-[12px] font-medium opacity-60">Altere a sua senha de acesso periodicamente.</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-8 space-y-6">
              <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/70 ml-1">Nova Senha</Label>
                  <div className="relative group">
                    <Key className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/30 group-focus-within:text-orange-500 transition-all duration-300" />
                    <Input 
                      type={showPassword ? "text" : "password"} 
                      placeholder="Mínimo 6 caracteres"
                      value={passwordForm.newPassword}
                      onChange={(e) => setPasswordForm({...passwordForm, newPassword: e.target.value})}
                      className="h-11 pl-11 pr-11 bg-muted/30 border-transparent focus:bg-background focus:ring-orange-500/10 transition-all rounded-xl font-bold text-sm shadow-inner"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground/40 hover:text-orange-500 p-1"
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/70 ml-1">Confirmar Nova Senha</Label>
                  <div className="relative group">
                    <ShieldCheck className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/30 group-focus-within:text-orange-500 transition-all duration-300" />
                    <Input 
                      type={showPassword ? "text" : "password"} 
                      placeholder="Repita a senha"
                      value={passwordForm.confirmPassword}
                      onChange={(e) => setPasswordForm({...passwordForm, confirmPassword: e.target.value})}
                      className="h-11 pl-11 bg-muted/30 border-transparent focus:bg-background focus:ring-orange-500/10 transition-all rounded-xl font-bold text-sm shadow-inner"
                    />
                  </div>
                </div>
              </div>
              
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
                <div className="flex items-center gap-2 text-[10px] font-bold text-orange-600/60 uppercase tracking-tighter">
                  <ShieldAlert className="h-3.5 w-3.5" />
                  Garante que a senha é forte e única.
                </div>
                <Button 
                  onClick={handleUpdatePassword} 
                  disabled={isChangingPassword} 
                  className="w-full sm:w-auto rounded-xl gap-2.5 px-8 h-11 shadow-lg shadow-orange-500/10 border-none font-black uppercase text-[10px] tracking-[0.15em] transition-all bg-orange-500 text-white hover:bg-orange-600 active:scale-95"
                >
                  {isChangingPassword ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
                  Atualizar Senha
                </Button>
              </div>
            </CardContent>
          </Card>

        </div>
      </div>

      {/* DIALOG DE SUCESSO PREMIUM */}
      <Dialog open={isPasswordChangedDialogOpen} onOpenChange={setIsPasswordChangedDialogOpen}>
        <DialogContent className="sm:max-w-md text-center flex flex-col items-center justify-center p-10 rounded-[2.5rem] border-none shadow-3xl overflow-hidden">
          <div className="absolute top-0 inset-x-0 h-1 bg-emerald-500" />
          <div className="h-20 w-20 rounded-[1.75rem] bg-emerald-50 dark:bg-emerald-950/20 flex items-center justify-center mb-6 ring-12 ring-emerald-50/50 dark:ring-emerald-900/10 animate-in zoom-in-50 duration-500">
            <CheckCircle2 className="h-10 w-10 text-emerald-500" />
          </div>
          <div className="space-y-2 mb-8">
            <h3 className="text-2xl font-black tracking-tight leading-none text-foreground">Acesso Atualizado</h3>
            <p className="text-muted-foreground text-sm font-medium leading-relaxed max-w-[280px] mx-auto">
              A sua senha foi modificada com sucesso. A sua conta está agora mais segura.
            </p>
          </div>
          <Button 
            className="w-full max-w-[180px] rounded-full h-12 font-black shadow-xl shadow-primary/20 uppercase text-[10px] tracking-[0.2em] transition-all hover:scale-[1.02] active:scale-95" 
            onClick={() => setIsPasswordChangedDialogOpen(false)}
          >
            Confirmar
          </Button>
        </DialogContent>
      </Dialog>
    </div>
  )
}