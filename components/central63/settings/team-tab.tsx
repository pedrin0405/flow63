"use client"

import { useState, useMemo } from "react"
import { supabase } from "@/lib/supabase"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { toast } from "sonner"
import { 
  UserPlus, Loader2, MoreHorizontal, UserCog, Key, UserX, Mail, 
  Users, ShieldCheck, Search, Eye, EyeOff, User, AtSign, 
  ChevronRight, CheckCircle2, Shield, Calendar, Clock
} from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { inviteUserAction } from "@/app/actions/invite"
import { adminUpdateUserPassword } from "@/app/actions/users"
import { Separator } from "@/components/ui/separator"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

interface TeamTabProps {
  users: any[]
  currentUserId: string
  onRefresh: () => void
}

export function TeamTab({ users, currentUserId, onRefresh }: TeamTabProps) {
  // Estados Locais
  const [isInviteDialogOpen, setIsInviteDialogOpen] = useState(false)
  const [isEditUserDialogOpen, setIsEditUserDialogOpen] = useState(false)
  const [isResetPasswordDialogOpen, setIsResetPasswordDialogOpen] = useState(false)
  const [isPasswordSuccessOpen, setIsPasswordSuccessOpen] = useState(false)
  
  const [inviteData, setInviteData] = useState({ email: "", role: "Secretária" })
  const [editingUser, setEditingUser] = useState<{ id: string, name: string, role: string, email: string, avatar_url: string } | null>(null)
  
  const [resetPasswordUserId, setResetPasswordUserId] = useState<string | null>(null)
  const [newPassword, setNewPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  
  const [isInviting, setIsInviting] = useState(false)
  const [isSavingEdit, setIsSavingEdit] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")

  // Filtro de utilizadores
  const filteredUsers = useMemo(() => {
    return users.filter(u => 
      u.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
      u.email?.toLowerCase().includes(searchTerm.toLowerCase())
    )
  }, [users, searchTerm])

  // --- Handlers ---

  const handleInviteMember = async () => {
    if (!inviteData.email || !inviteData.email.includes('@')) {
      return toast.error("Por favor, insira um e-mail válido.")
    }
    
    setIsInviting(true)
    try {
      const result = await inviteUserAction(inviteData.email, inviteData.role)
      
      if (!result.success) {
        toast.error(result.error || "Erro ao enviar convite.")
        return
      }
      
      toast.success(`Convite enviado para ${inviteData.email}!`)
      setIsInviteDialogOpen(false)
      setInviteData({ email: "", role: "Secretária" })
      setTimeout(() => onRefresh(), 2000)
    } catch (error: any) {
      toast.error("Ocorreu um erro inesperado.")
    } finally {
      setIsInviting(false)
    }
  }

  const handleOpenEditUser = (user: any) => {
    setEditingUser({
      id: user.id,
      name: user.full_name || "",
      role: user.role || "Secretária",
      email: user.email || "",
      avatar_url: user.avatar_url || ""
    })
    setIsEditUserDialogOpen(true)
  }

  const handleSaveEditedUser = async () => {
    if (!editingUser) return
    setIsSavingEdit(true)
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ 
          full_name: editingUser.name,
          role: editingUser.role 
        })
        .eq('id', editingUser.id)

      if (error) throw error
      toast.success("Membro atualizado com sucesso!")
      setIsEditUserDialogOpen(false)
      setEditingUser(null)
      onRefresh()
    } catch (error: any) {
      toast.error("Erro ao atualizar dados.")
    } finally {
      setIsSavingEdit(false)
    }
  }

  const handleOpenResetPassword = (userId: string) => {
    setResetPasswordUserId(userId)
    setNewPassword("")
    setShowPassword(false)
    setIsResetPasswordDialogOpen(true)
  }

  const handleResetPassword = async () => {
    if (!resetPasswordUserId) return
    if (newPassword.length < 6) return toast.error("A senha deve ter no mínimo 6 caracteres")

    setIsSavingEdit(true)
    try {
      await adminUpdateUserPassword(resetPasswordUserId, newPassword)
      setIsResetPasswordDialogOpen(false)
      setResetPasswordUserId(null)
      setNewPassword("")
      setIsPasswordSuccessOpen(true)
    } catch (error: any) {
      toast.error("Erro ao alterar senha do utilizador.")
    } finally {
      setIsSavingEdit(false)
    }
  }

  const handleExcluirUsuario = async (userId: string) => {
    if (userId === currentUserId) return toast.error("Não pode excluir a própria conta")
    if (!confirm("Remover permanentemente este membro da equipa?")) return

    try {
      const { error } = await supabase.from('profiles').delete().eq('id', userId)
      if (error) throw error
      toast.success("Membro removido da unidade")
      onRefresh()
    } catch (error: any) {
      toast.error("Erro ao remover utilizador")
    }
  }

  return (
    <div className="w-full max-w-6xl mx-auto space-y-4 animate-in fade-in duration-500 pb-12">
      
      {/* Cabeçalho de Acções - Responsivo e mais compacto */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between bg-card p-4 rounded-3xl border border-border/50 shadow-sm">
        <div className="space-y-0.5 ml-2">
          <h2 className="text-lg font-bold tracking-tight text-foreground flex items-center gap-2">
            Equipe <Badge variant="secondary" className="rounded-full bg-primary/10 text-primary border-none text-[10px] h-5 px-1.5">{users.length}</Badge>
          </h2>
          <p className="text-muted-foreground text-[10px] font-bold uppercase tracking-widest opacity-60">Gestão de Colaboradores</p>
        </div>
        
        <div className="flex flex-col sm:flex-row items-center gap-2 w-full md:w-auto">
          <div className="relative group w-full sm:w-64">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground group-focus-within:text-primary transition-colors" />
            <Input 
              placeholder="Pesquisar..." 
              className="pl-9 bg-muted/30 border-border/60 focus:ring-primary/20 h-9 rounded-xl text-xs transition-all shadow-inner"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <Button 
            onClick={() => setIsInviteDialogOpen(true)} 
            className="w-full sm:w-auto rounded-xl h-9 px-5 gap-2 shadow-lg shadow-primary/10 transition-all hover:shadow-primary/20 active:scale-95"
          >
            <UserPlus size={16} />
            <span className="text-[11px] font-black uppercase tracking-wider">Novo</span>
          </Button>
        </div>
      </div>

      {/* Grid de Membros - Cards mais compactos */}
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-2">
        {filteredUsers.length === 0 ? (
          <Card className="border-2 border-dashed border-border/40 shadow-none col-span-full bg-muted/5 rounded-[2rem]">
            <CardContent className="flex flex-col items-center justify-center py-16 text-center space-y-4">
              <div className="h-12 w-12 rounded-2xl bg-primary/5 flex items-center justify-center">
                <Users className="h-6 w-6 text-primary/40" />
              </div>
              <div className="space-y-1">
                <h3 className="text-lg font-bold text-foreground">Equipe não localizada</h3>
                <p className="text-xs text-muted-foreground">Tente um termo diferente ou adicione um novo membro.</p>
              </div>
              <Button 
                variant="outline" 
                size="sm"
                className="rounded-xl px-6 h-9 text-xs font-bold uppercase tracking-widest"
                onClick={() => setIsInviteDialogOpen(true)}
              >
                Convidar agora
              </Button>
            </CardContent>
          </Card>
        ) : (
          filteredUsers.map((u) => (
            <Card key={u.id} className="group relative overflow-hidden border-border/50 hover:border-primary/40 hover:shadow-xl transition-all duration-500 rounded-3xl bg-card/70 backdrop-blur-md shadow-sm">
              
              {/* Menu de Opções */}
              <div className="absolute top-2.5 right-2.5 z-20">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="rounded-full h-8 w-8 hover:bg-background/80 border border-border/10 bg-background/40 backdrop-blur-xl transition-all shadow-sm">
                      <MoreHorizontal className="h-4 w-4 text-muted-foreground/80" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-52 rounded-2xl p-1.5 shadow-2xl border-border/50 backdrop-blur-xl">
                    <DropdownMenuLabel className="text-[9px] font-black uppercase text-muted-foreground/40 px-3 py-1.5 tracking-[0.2em]">Ações</DropdownMenuLabel>
                    <DropdownMenuItem onClick={() => handleOpenEditUser(u)} className="rounded-xl gap-2.5 py-2.5 cursor-pointer font-bold text-[11px] hover:bg-primary/5">
                      <UserCog className="h-3.5 w-3.5 text-primary" /> Editar Cadastro
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleOpenResetPassword(u.id)} className="rounded-xl gap-2.5 py-2.5 cursor-pointer font-bold text-[11px] hover:bg-primary/5">
                      <Key className="h-3.5 w-3.5 text-primary" /> Redefinir Senha
                    </DropdownMenuItem>
                    <DropdownMenuSeparator className="my-1.5 opacity-50" />
                    <DropdownMenuItem 
                      className="rounded-xl gap-2.5 py-2.5 text-destructive focus:text-destructive focus:bg-destructive/5 cursor-pointer font-bold text-[11px]" 
                      onClick={() => handleExcluirUsuario(u.id)}
                      disabled={u.id === currentUserId}
                    >
                      <UserX className="h-3.5 w-3.5" /> Revogar Acesso
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              <CardContent className="p-4 flex items-center gap-5">
                {/* Avatar GRANDE mas ajustado para card compacto */}
                <div className="relative shrink-0">
                  <div className="h-20 w-20 rounded-[1.5rem] bg-gradient-to-br from-primary/10 to-primary/5 p-0.5 ring-1 ring-background/50 shadow-xl transition-transform group-hover:scale-105 duration-500 overflow-hidden">
                    <Avatar className="h-full w-full rounded-[1.4rem]">
                      <AvatarImage src={u.avatar_url} className="object-cover" />
                      <AvatarFallback className="bg-muted text-muted-foreground font-black text-2xl">
                        {u.full_name?.charAt(0).toUpperCase() || "U"}
                      </AvatarFallback>
                    </Avatar>
                  </div>
                  <div className="absolute -bottom-0.5 -right-0.5 h-4.5 w-4.5 rounded-full bg-emerald-500 border-2 border-background shadow-lg" />
                </div>

                {/* Informações centrais */}
                <div className="min-w-0 flex-1 space-y-1 pr-6">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <Badge 
                      variant="secondary" 
                      className={`text-[8px] h-4 px-2 font-black uppercase border-none tracking-widest ${
                        u.role === 'Diretor' ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300' :
                        u.role === 'Gestor' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300' :
                        'bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400'
                      }`}
                    >
                      {u.role || "Membro"}
                    </Badge>
                    {u.id === currentUserId && (
                      <Badge variant="outline" className="text-[7px] h-4 px-1.5 font-black uppercase border-primary/40 text-primary bg-primary/5">Dono</Badge>
                    )}
                  </div>
                  
                  <CardTitle className="text-base font-black truncate tracking-tight text-foreground leading-none" title={u.full_name}>
                    {u.full_name || "Pendente"}
                  </CardTitle>

                  <div className="space-y-1">
                    <div className="flex items-center gap-1.5 text-muted-foreground font-bold text-[10px] truncate">
                      <AtSign className="h-3 w-3 opacity-40 shrink-0" />
                      <span className="truncate">{u.email}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-[9px] font-black uppercase tracking-widest opacity-40">
                      <Calendar className="h-3 w-3 shrink-0" />
                      <span>{u.created_at ? new Date(u.created_at).toLocaleDateString('pt-BR') : 'Hoje'}</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* DIALOG DE EDIÇÃO */}
      <Dialog open={isEditUserDialogOpen} onOpenChange={setIsEditUserDialogOpen}>
        <DialogContent className="sm:max-w-[550px] max-h-[85vh] flex flex-col p-0 overflow-hidden rounded-[2rem] border-none shadow-3xl">
          <DialogHeader className="px-10 pt-10 pb-6 bg-gradient-to-b from-primary/5 to-transparent flex flex-row items-center gap-5">
            <div className="h-14 w-14 rounded-2xl bg-primary flex items-center justify-center shadow-xl shadow-primary/20 shrink-0 text-white">
              <UserCog className="h-7 w-7" />
            </div>
            <div>
              <DialogTitle className="text-xl font-bold tracking-tight">Editar Membro</DialogTitle>
              <DialogDescription className="text-sm font-medium text-muted-foreground">
                Atualize as permissões e dados cadastrais.
              </DialogDescription>
            </div>
          </DialogHeader>
          
          <div className="flex-1 overflow-y-auto px-10 py-4 space-y-6 pb-8">
            {editingUser && (
              <div className="space-y-6">
                <div className="flex items-center gap-5 p-6 rounded-3xl bg-muted/30 border border-border/40">
                  <Avatar className="h-16 w-16 rounded-xl border-4 border-background shadow-lg">
                    <AvatarImage src={editingUser.avatar_url} className="object-cover" />
                    <AvatarFallback className="bg-primary/10 text-primary font-black text-xl">{editingUser.name?.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <div className="space-y-1">
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60">Perfil de Acesso</p>
                    <p className="text-base font-bold truncate max-w-[200px]">{editingUser.email}</p>
                    <Badge variant="outline" className="text-[9px] h-5 rounded-full px-3">ID: {editingUser.id.substring(0,8)}</Badge>
                  </div>
                </div>

                <div className="grid gap-5">
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest ml-1 text-muted-foreground/70">Nome Completo</Label>
                    <div className="relative">
                      <User className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground/30" />
                      <Input 
                        value={editingUser.name} 
                        onChange={e => setEditingUser({...editingUser, name: e.target.value})} 
                        placeholder="Nome do membro"
                        className="pl-12 h-12 bg-background border-border/60 focus:ring-primary/20 rounded-2xl font-bold text-lg shadow-sm"
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest ml-1 text-muted-foreground/70">Cargo & Responsabilidade</Label>
                    <Select 
                      value={editingUser.role} 
                      onValueChange={val => setEditingUser({...editingUser, role: val})}
                    >
                      <SelectTrigger className="h-12 rounded-2xl bg-background border-border/60 font-bold text-base shadow-sm">
                        <div className="flex items-center gap-3">
                          <Shield className="h-5 w-5 text-primary/50" />
                          <SelectValue />
                        </div>
                      </SelectTrigger>
                      <SelectContent className="rounded-2xl p-2 border-border/40 backdrop-blur-xl">
                        <SelectItem value="Secretária" className="rounded-xl py-3 font-semibold">Secretária</SelectItem>
                        <SelectItem value="Gestor" className="rounded-xl py-3 font-semibold">Gestor</SelectItem>
                        <SelectItem value="Diretor" className="rounded-xl py-3 font-semibold">Diretor</SelectItem>
                        <SelectItem value="Marketing" className="rounded-xl py-3 font-semibold">Marketing</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            )}
          </div>

          <DialogFooter className="px-10 py-8 border-t border-border/40 bg-muted/30 flex flex-col-reverse sm:flex-row gap-4">
            <Button variant="ghost" onClick={() => setIsEditUserDialogOpen(false)} className="rounded-2xl px-8 font-black h-12 text-xs uppercase tracking-widest hover:bg-muted/50">
              Cancelar
            </Button>
            <Button 
              onClick={handleSaveEditedUser} 
              disabled={isSavingEdit} 
              className="rounded-2xl gap-3 px-10 h-12 shadow-xl shadow-primary/20 font-black tracking-tight text-sm uppercase transition-all hover:scale-[1.02] active:scale-95"
            >
              {isSavingEdit ? <Loader2 className="animate-spin h-6 w-6" /> : <ChevronRight className="h-6 w-6" />}
              Guardar Alterações
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* DIALOG DE CONVITE */}
      <Dialog open={isInviteDialogOpen} onOpenChange={setIsInviteDialogOpen}>
        <DialogContent className="sm:max-w-[500px] rounded-[2.5rem] p-0 overflow-hidden border-none shadow-3xl">
          <div className="px-10 pt-10 pb-6 bg-gradient-to-br from-primary/10 via-primary/5 to-transparent">
            <div className="h-14 w-14 rounded-[1.25rem] bg-primary flex items-center justify-center shadow-2xl shadow-primary/30 mb-5 text-white">
              <Mail className="h-7 w-7" />
            </div>
            <DialogTitle className="text-2xl font-black tracking-tight">Convidar Membro</DialogTitle>
            <DialogDescription className="text-sm font-medium text-muted-foreground mt-2 leading-relaxed">
              Inicie uma nova colaboração convidando um membro para sua unidade.
            </DialogDescription>
          </div>
          
          <div className="p-10 space-y-6">
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-widest ml-1 text-muted-foreground/70">E-mail de Trabalho</Label>
              <div className="relative">
                <AtSign className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground/30" />
                <Input 
                  placeholder="exemplo@empresa.com.br" 
                  value={inviteData.email} 
                  onChange={e => setInviteData({...inviteData, email: e.target.value})} 
                  className="pl-12 h-12 bg-muted/20 border-transparent focus:bg-background focus:border-border rounded-2xl font-semibold transition-all"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-widest ml-1 text-muted-foreground/70">Nível de Acesso</Label>
              <Select value={inviteData.role} onValueChange={v => setInviteData({...inviteData, role: v})}>
                <SelectTrigger className="h-12 rounded-2xl bg-muted/20 border-transparent focus:border-border font-bold text-base transition-all">
                  <div className="flex items-center gap-3">
                    <ShieldCheck className="w-5 h-5 text-primary/40" />
                    <SelectValue />
                  </div>
                </SelectTrigger>
                <SelectContent className="rounded-2xl p-2 border-border/40 backdrop-blur-xl">
                  <SelectItem value="Secretária" className="rounded-xl py-3 font-semibold">Secretária</SelectItem>
                  <SelectItem value="Gestor" className="rounded-xl py-3 font-semibold">Gestor</SelectItem>
                  <SelectItem value="Diretor" className="rounded-xl py-3 font-semibold">Diretor</SelectItem>
                  <SelectItem value="Marketing" className="rounded-xl py-3 font-semibold">Marketing</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter className="px-10 py-8 border-t border-border/40 bg-muted/30">
            <Button onClick={handleInviteMember} disabled={isInviting} className="w-full rounded-2xl gap-3 h-12 shadow-2xl shadow-primary/30 font-black uppercase text-[11px] tracking-[0.2em] transition-all hover:scale-[1.02] active:scale-95">
              {isInviting ? <Loader2 className="animate-spin h-5 w-5" /> : <Mail className="h-5 w-5" />}
              Enviar agora
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* DIALOG DE REDEFINIÇÃO DE SENHA */}
      <Dialog open={isResetPasswordDialogOpen} onOpenChange={setIsResetPasswordDialogOpen}>
        <DialogContent className="max-w-[90vw] sm:max-w-[420px] rounded-[2.5rem] border-none shadow-3xl p-8 transition-all overflow-hidden">
          <div className="flex flex-col items-center text-center">
            <div className="h-16 w-16 rounded-[1.25rem] bg-orange-50 dark:bg-orange-950/20 flex items-center justify-center text-orange-500 mb-5 shadow-inner ring-1 ring-orange-200 dark:ring-orange-800">
              <Key className="h-8 w-8" />
            </div>
            <DialogTitle className="text-xl font-bold tracking-tight text-foreground">Segurança</DialogTitle>
            <DialogDescription className="text-xs font-medium text-muted-foreground mt-2 max-w-[280px]">
              Defina uma nova senha temporária para este colaborador.
            </DialogDescription>
          </div>

          <div className="py-6 space-y-2">
            <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Senha Temporária</Label>
            <div className="relative group">
              <Input 
                type={showPassword ? "text" : "password"}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Mínimo 6 caracteres"
                className="pr-12 h-11 rounded-2xl bg-muted/20 border-transparent focus:bg-background font-bold text-base transition-all"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-primary p-2 transition-colors"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <DialogFooter className="flex flex-col gap-2 sm:flex-row sm:gap-3">
            <Button 
              variant="ghost" 
              onClick={() => setIsResetPasswordDialogOpen(false)} 
              className="rounded-2xl font-black h-11 text-[10px] uppercase tracking-widest w-full sm:w-1/2 hover:bg-muted/50 border border-border/20"
            >
              Cancelar
            </Button>
            <Button 
              onClick={handleResetPassword} 
              disabled={isSavingEdit || newPassword.length < 6} 
              className="rounded-2xl h-11 font-black shadow-lg shadow-primary/20 uppercase text-[10px] tracking-widest w-full sm:w-1/2 transition-all hover:scale-[1.02] active:scale-95"
            >
              {isSavingEdit ? <Loader2 className="animate-spin h-4 w-4" /> : "Confirmar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* POPUP SUCESSO SENHA */}
      <Dialog open={isPasswordSuccessOpen} onOpenChange={setIsPasswordSuccessOpen}>
        <DialogContent className="sm:max-w-md text-center flex flex-col items-center justify-center p-12 rounded-[3.5rem] border-none shadow-3xl">
          <div className="h-16 w-16 rounded-full bg-emerald-50 dark:bg-emerald-950/20 flex items-center justify-center mb-6 ring-12 ring-emerald-50/50 dark:ring-emerald-900/10 animate-in zoom-in-50 duration-500">
            <CheckCircle2 className="h-8 w-8 text-emerald-500" />
          </div>
          <DialogHeader>
            <DialogTitle className="text-center text-2xl font-black tracking-tight">Tudo pronto!</DialogTitle>
            <DialogDescription className="text-center text-muted-foreground text-sm font-medium mt-2 leading-relaxed">
              A conta foi protegida com sucesso. Não se esqueça de informar o colaborador.
            </DialogDescription>
          </DialogHeader>
          <Button 
            className="w-full max-w-[200px] rounded-full mt-8 h-12 font-black shadow-2xl shadow-primary/30 uppercase text-[10px] tracking-[0.2em] transition-all hover:scale-[1.02] active:scale-95" 
            onClick={() => setIsPasswordSuccessOpen(false)}
          >
            Concluído
          </Button>
        </DialogContent>
      </Dialog>

    </div>
  )
}