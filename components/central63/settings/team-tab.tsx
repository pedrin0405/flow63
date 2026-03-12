"use client"

import { useState, useMemo, useCallback, useRef } from "react"
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
  ChevronRight, CheckCircle2, Shield, Calendar, Clock, Sparkles, Camera, Info
} from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { inviteUserAction } from "@/app/actions/invite"
import { adminUpdateUserPassword } from "@/app/actions/users"
import { cn } from "@/lib/utils"

interface TeamTabProps {
  users: any[]
  currentUserId: string
  onRefresh: () => void
}

// ─── Sub-Componente de Card do Usuário ────────────────────────────────────
function UserCard({ user, currentUserId, onEdit, onStatus, onPassword, onDelete, onAuthorize, variant = "default" }: any) {
  const isPending = user.status === 'pendente';

  const roleColors: Record<string, string> = {
    Diretor: "from-violet-500/20 to-purple-500/10 text-violet-600 dark:text-violet-300",
    Gestor: "from-blue-500/20 to-sky-500/10 text-blue-600 dark:text-blue-300",
    Corretor: "from-emerald-500/20 to-teal-500/10 text-emerald-600 dark:text-emerald-300",
    Marketing: "from-rose-500/20 to-pink-500/10 text-rose-600 dark:text-rose-300",
    Secretária: "from-amber-500/20 to-yellow-500/10 text-amber-600 dark:text-amber-300",
  };
  const roleBg = roleColors[user.role] || "from-zinc-500/10 to-zinc-400/5 text-zinc-500";

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
            `bg-gradient-to-r ${roleBg}`
          )}>
            <div className="h-1.5 w-1.5 rounded-full bg-current opacity-70" />
            {user.role || "Membro"}
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
              <DropdownMenuLabel className="text-[9px] font-black uppercase text-muted-foreground/40 px-3 py-1.5 tracking-[0.2em]">Ações</DropdownMenuLabel>
              <DropdownMenuItem onClick={() => onEdit(user)} className="rounded-xl gap-2.5 py-2.5 cursor-pointer font-bold text-[11px] hover:bg-primary/5">
                <UserCog className="h-3.5 w-3.5 text-primary" /> Editar Cadastro
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onStatus(user.id, user.status || 'ativo')} className="rounded-xl gap-2.5 py-2.5 cursor-pointer font-bold text-[11px] hover:bg-primary/5">
                {user.status === 'ativo' ? (
                  <><Shield className="h-3.5 w-3.5 text-rose-500" /> Desativar Usuário</>
                ) : (
                  <><CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" /> Ativar Usuário</>
                )}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onPassword(user.id)} className="rounded-xl gap-2.5 py-2.5 cursor-pointer font-bold text-[11px] hover:bg-primary/5">
                <Key className="h-3.5 w-3.5 text-primary" /> Redefinir Senha
              </DropdownMenuItem>
              <DropdownMenuSeparator className="my-1.5 opacity-50" />
              <DropdownMenuItem
                className="rounded-xl gap-2.5 py-2.5 text-destructive focus:text-destructive focus:bg-destructive/5 cursor-pointer font-bold text-[11px]"
                onClick={() => onDelete(user.id)}
                disabled={user.id === currentUserId}
              >
                <UserX className="h-3.5 w-3.5" /> Revogar Acesso
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Avatar + Info */}
        <div className="flex items-center gap-3.5 mb-4">
          <div className="relative shrink-0">
            <div className="h-14 w-14 rounded-2xl p-0.5 bg-gradient-to-br from-white/80 via-white/40 to-white/10 dark:from-white/10 dark:via-white/5 dark:to-transparent shadow-lg ring-1 ring-black/[0.08] dark:ring-white/[0.1] overflow-hidden transition-transform duration-500 group-hover:scale-[1.04]">
              <Avatar className="h-full w-full rounded-[0.8rem]">
                <AvatarImage src={user.avatar_url} className="object-cover" />
                <AvatarFallback className="bg-gradient-to-br from-zinc-100 to-zinc-200 dark:from-zinc-700 dark:to-zinc-800 text-foreground/60 font-black text-lg">
                  {user.full_name?.charAt(0).toUpperCase() || "U"}
                </AvatarFallback>
              </Avatar>
            </div>
            {/* Status dot */}
            <div className={cn(
              "absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 rounded-full border-2 border-white dark:border-zinc-900 shadow",
              user.status === 'ativo' ? "bg-emerald-400" : user.status === 'pendente' ? "bg-amber-400" : "bg-rose-400"
            )} />
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5 mb-0.5">
              <p className="text-[13px] font-black truncate tracking-tight text-foreground leading-none">
                {user.full_name && user.full_name !== "Pendente" ? user.full_name : (user.email?.split('@')[0] || "Membro")}
              </p>
              {user.id === currentUserId && (
                <span className="inline-flex items-center px-1.5 py-0.5 rounded-md text-[7px] font-black uppercase bg-primary/10 text-primary border border-primary/20 leading-none tracking-widest">you</span>
              )}
            </div>
            <div className="flex items-center gap-1 text-muted-foreground/50 text-[9px] font-medium truncate">
              <AtSign className="h-2.5 w-2.5 shrink-0" />
              <span className="truncate">{user.email}</span>
            </div>
          </div>
        </div>

        {/* Pending CTA */}
        {isPending && (
          <button
            onClick={() => onAuthorize(user)}
            className="w-full h-9 rounded-xl bg-gradient-to-r from-amber-400/20 to-orange-400/10 hover:from-amber-400/30 hover:to-orange-400/20 text-amber-600 dark:text-amber-400 border border-amber-400/30 font-black text-[9px] uppercase tracking-[0.15em] flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
          >
            <ShieldCheck size={11} />
            Autorizar Acesso
          </button>
        )}
      </div>
    </div>
  );
}

export function TeamTab({ users, currentUserId, onRefresh }: TeamTabProps) {
  const [isInviteDialogOpen, setIsInviteDialogOpen] = useState(false)
  const [isEditUserDialogOpen, setIsEditUserDialogOpen] = useState(false)
  const [isAuthorizeDialogOpen, setIsAuthorizeDialogOpen] = useState(false)
  const [isResetPasswordDialogOpen, setIsResetPasswordDialogOpen] = useState(false)
  const [isPasswordSuccessOpen, setIsPasswordSuccessOpen] = useState(false)

  const [inviteData, setInviteData] = useState({ email: "", role: "Secretária" })
  const [editingUser, setEditingUser] = useState<{ id: string, name: string, role: string, email: string, avatar_url: string } | null>(null)
  const [authorizingUser, setAuthorizingUser] = useState<any>(null)
  const [authFormData, setAuthFormData] = useState({ name: "", role: "Corretor", password: "", avatar_url: "" })

  const [resetPasswordUserId, setResetPasswordUserId] = useState<string | null>(null)
  const [newPassword, setNewPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)

  const [isInviting, setIsInviting] = useState(false)
  const [isSavingEdit, setIsSavingEdit] = useState(false)
  const [isAuthorizing, setIsAuthorizing] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<"todos" | "ativo" | "pendente" | "inativo">("todos")

  const fileInputRef = useRef<HTMLInputElement>(null)

  const filteredUsers = useMemo(() => {
    return users.filter(u => {
      const matchesSearch = u.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.email?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter === "todos" || u.status === statusFilter;
      return matchesSearch && matchesStatus;
    })
  }, [users, searchTerm, statusFilter])

  const groupedUsers = useMemo(() => {
    const pending = filteredUsers.filter(u => u.status === 'pendente');
    const active = filteredUsers.filter(u => u.status === 'ativo' || !u.status);
    const inactive = filteredUsers.filter(u => u.status === 'inativo');
    return { pending, active, inactive };
  }, [filteredUsers]);

  const handleToggleStatus = async (userId: string, currentStatus: string) => {
    const newStatus = currentStatus === 'ativo' ? 'inativo' : 'ativo';
    const actionLabel = currentStatus === 'pendente' ? 'autorizar' : (newStatus === 'ativo' ? 'ativar' : 'desativar');
    if (!confirm(`Deseja realmente ${actionLabel} este usuário?`)) return;
    try {
      const { error } = await supabase.from('profiles').update({ status: currentStatus === 'pendente' ? 'ativo' : newStatus }).eq('id', userId);
      if (error) throw error;
      toast.success(`Usuário ${currentStatus === 'pendente' ? 'autorizado' : (newStatus === 'ativo' ? 'ativado' : 'desativado')} com sucesso!`);
      onRefresh();
    } catch (error) { toast.error("Erro ao atualizar status do usuário."); }
  }

  const handleInviteMember = async () => {
    if (!inviteData.email || !inviteData.email.includes('@')) return toast.error("Por favor, insira um e-mail válido.")
    setIsInviting(true)
    try {
      const result = await inviteUserAction(inviteData.email, inviteData.role)
      if (!result.success) { toast.error(result.error || "Erro ao enviar convite."); return }
      toast.success(`Convite enviado para ${inviteData.email}!`)
      setIsInviteDialogOpen(false)
      setInviteData({ email: "", role: "Secretária" })
      setTimeout(() => onRefresh(), 2000)
    } catch (error: any) { toast.error("Ocorreu um erro inesperado.") }
    finally { setIsInviting(false) }
  }

  const handleOpenEditUser = (user: any) => {
    setEditingUser({ id: user.id, name: user.full_name || "", role: user.role || "Secretária", email: user.email || "", avatar_url: user.avatar_url || "" })
    setIsEditUserDialogOpen(true)
  }

  const handleSaveEditedUser = async () => {
    if (!editingUser) return
    setIsSavingEdit(true)
    try {
      const { error } = await supabase.from('profiles').update({ full_name: editingUser.name, role: editingUser.role }).eq('id', editingUser.id)
      if (error) throw error
      toast.success("Membro atualizado com sucesso!")
      setIsEditUserDialogOpen(false)
      setEditingUser(null)
      onRefresh()
    } catch (error: any) { toast.error("Erro ao atualizar dados.") }
    finally { setIsSavingEdit(false) }
  }

  const handleOpenResetPassword = (userId: string) => {
    setResetPasswordUserId(userId); setNewPassword(""); setShowPassword(false); setIsResetPasswordDialogOpen(true)
  }

  const handleResetPassword = async () => {
    if (!resetPasswordUserId) return
    if (newPassword.length < 6) return toast.error("A senha deve ter no mínimo 6 caracteres")
    setIsSavingEdit(true)
    try {
      await adminUpdateUserPassword(resetPasswordUserId, newPassword)
      setIsResetPasswordDialogOpen(false); setResetPasswordUserId(null); setNewPassword(""); setIsPasswordSuccessOpen(true)
    } catch (error: any) { toast.error("Erro ao alterar senha do utilizador.") }
    finally { setIsSavingEdit(false) }
  }

  const handleExcluirUsuario = async (userId: string) => {
    if (userId === currentUserId) return toast.error("Não pode excluir a própria conta")
    if (!confirm("Remover permanentemente este membro da equipa?")) return
    try {
      const { error } = await supabase.from('profiles').delete().eq('id', userId)
      if (error) throw error
      toast.success("Membro removido da unidade"); onRefresh()
    } catch (error: any) { toast.error("Erro ao remover utilizador") }
  }

  const handleOpenAuthorize = (user: any) => {
    setAuthorizingUser(user);
    // Forçar o cargo padrão como "Corretor" ao abrir o diálogo de autorização
    setAuthFormData({ 
      name: (user.full_name && user.full_name !== "Pendente") ? user.full_name : "", 
      role: "Corretor", 
      password: "", 
      avatar_url: user.avatar_url || "" 
    });
    setIsAuthorizeDialogOpen(true);
  };

  const handleUploadAuthAvatar = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !authorizingUser) return;
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${authorizingUser.id}-${Math.random()}.${fileExt}`;
      const filePath = `avatars/${fileName}`;
      const { error: uploadError } = await supabase.storage.from('user-uploads').upload(filePath, file);
      if (uploadError) throw uploadError;
      const { data: { publicUrl } } = supabase.storage.from('user-uploads').getPublicUrl(filePath);
      setAuthFormData(prev => ({ ...prev, avatar_url: publicUrl }));
      toast.success("Foto carregada!");
    } catch (error: any) { toast.error("Foto: " + error.message); }
  };

  const handleAuthorizeUser = async () => {
    // Agora apenas o nome é obrigatório. A senha é opcional.
    if (!authFormData.name) return toast.error("O nome é obrigatório.");
    setIsAuthorizing(true);
    try {
      // Se houver senha preenchida, atualiza. Caso contrário, ignora a atualização da senha.
      if (authFormData.password && authFormData.password.length >= 6) {
        await adminUpdateUserPassword(authorizingUser.id, authFormData.password);
      }
      
      const { error } = await supabase.from('profiles').update({ 
        full_name: authFormData.name, 
        role: authFormData.role, 
        avatar_url: authFormData.avatar_url, 
        status: 'ativo' 
      }).eq('id', authorizingUser.id);
      
      if (error) throw error;
      toast.success("Acesso autorizado com sucesso!"); setIsAuthorizeDialogOpen(false); onRefresh();
    } catch (error: any) { toast.error("Erro na autorização: " + error.message); }
    finally { setIsAuthorizing(false); }
  };

  return (
    <div className="w-full max-w-6xl mx-auto space-y-5 animate-in fade-in duration-500 pb-16">

      {/* ── BENTO HEADER ─────────────────────────────────────────── */}
      <div className="relative rounded-[2rem] overflow-hidden border border-white/20 dark:border-white/[0.06] bg-white/50 dark:bg-white/[0.02] backdrop-blur-2xl shadow-[0_2px_20px_rgba(0,0,0,0.06)]">
        {/* Top glass highlight */}
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/90 dark:via-white/30 to-transparent" />

        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between px-6 py-5">
          {/* Title group */}
          <div className="flex items-center gap-4">
            {/* Icon bento tile */}
            <div className="relative h-12 w-12 rounded-2xl bg-gradient-to-br from-primary/90 to-primary/60 shadow-lg shadow-primary/20 flex items-center justify-center shrink-0">
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-t from-transparent to-white/20" />
              <Users className="h-5 w-5 text-white relative z-10" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-black tracking-tight text-foreground">Equipe</h2>
                <span className="inline-flex items-center justify-center h-5 min-w-5 px-1.5 rounded-full bg-primary/10 text-primary text-[10px] font-black border border-primary/20">
                  {users.length}
                </span>
              </div>
              <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-muted-foreground/50 mt-0.5">Gestão de Colaboradores</p>
            </div>
          </div>

          {/* Controls */}
          <div className="flex flex-col sm:flex-row items-center gap-2 w-full md:w-auto">
            {/* Status pills */}
            <div className="flex items-center gap-1 p-1 rounded-xl bg-black/[0.03] dark:bg-white/[0.04] border border-black/[0.05] dark:border-white/[0.06]">
              {(["todos", "ativo", "pendente", "inativo"] as const).map(s => (
                <button
                  key={s}
                  onClick={() => setStatusFilter(s)}
                  className={cn(
                    "px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-wider transition-all duration-200",
                    statusFilter === s
                      ? "bg-white dark:bg-white/10 shadow-sm text-foreground border border-black/[0.06] dark:border-white/[0.1]"
                      : "text-muted-foreground/50 hover:text-muted-foreground"
                  )}
                >
                  {s === "todos" ? "Todos" : s === "ativo" ? "Ativos" : s === "pendente" ? "Pendentes" : "Inativos"}
                </button>
              ))}
            </div>

            {/* Search */}
            <div className="relative group w-full sm:w-56">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground/40 group-focus-within:text-primary transition-colors" />
              <Input
                placeholder="Pesquisar membro..."
                className="pl-9 h-9 rounded-xl bg-black/[0.03] dark:bg-white/[0.04] border-black/[0.05] dark:border-white/[0.06] focus:bg-white dark:focus:bg-white/[0.06] text-xs font-medium transition-all"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            {/* CTA Button */}
            <button
              onClick={() => setIsInviteDialogOpen(true)}
              className="flex items-center gap-2 h-9 px-4 rounded-xl bg-primary text-white font-black text-[10px] uppercase tracking-wider shadow-lg shadow-primary/25 hover:shadow-primary/35 hover:scale-[1.02] active:scale-[0.98] transition-all whitespace-nowrap"
            >
              <UserPlus size={14} />
              Convidar
            </button>
          </div>
        </div>
      </div>

      {/* ── BENTO GRID LAYOUT ────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">



        {/* ── TILE: PENDING ── */}
        <div className="lg:col-span-4 flex flex-col gap-3">
          {/* ── STAT TILES ── (Small bento accents) */}
          <div className="grid grid-cols-2 gap-3">
            {/* Active count */}
            <div className="relative rounded-[1.5rem] overflow-hidden border border-emerald-200/40 dark:border-emerald-500/[0.1] bg-gradient-to-br from-emerald-50/70 to-teal-50/30 dark:from-emerald-950/20 dark:to-teal-950/10 backdrop-blur-xl p-4 shadow-[0_2px_12px_rgba(16,185,129,0.07)]">
              <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-emerald-300/50 dark:via-emerald-500/20 to-transparent" />
              <CheckCircle2 size={16} className="text-emerald-500 mb-3" />
              <p className="text-2xl font-black text-emerald-700 dark:text-emerald-400 leading-none">{groupedUsers.active.length}</p>
              <p className="text-[8px] font-black uppercase tracking-widest text-emerald-600/50 dark:text-emerald-500/50 mt-1">Ativos</p>
            </div>

            {/* Total */}
            <div className="relative rounded-[1.5rem] overflow-hidden border border-white/20 dark:border-white/[0.06] bg-white/50 dark:bg-white/[0.02] backdrop-blur-xl p-4 shadow-[0_2px_12px_rgba(0,0,0,0.05)]">
              <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/80 dark:via-white/20 to-transparent" />
              <Users size={16} className="text-primary/60 mb-3" />
              <p className="text-2xl font-black text-foreground leading-none">{users.length}</p>
              <p className="text-[8px] font-black uppercase tracking-widest text-muted-foreground/40 mt-1">Total</p>
            </div>
          </div>
          {/* Pending tile header */}
          <div className="relative rounded-[1.75rem] overflow-hidden border border-amber-200/40 dark:border-amber-500/[0.12] bg-gradient-to-br from-amber-50/70 via-white/50 to-orange-50/30 dark:from-amber-950/25 dark:via-zinc-900/40 dark:to-orange-950/10 backdrop-blur-xl p-5 shadow-[0_2px_16px_rgba(245,158,11,0.08)]">
            {/* Glass highlight */}
            <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-amber-300/60 dark:via-amber-400/20 to-transparent" />

            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-xl bg-amber-400/20 dark:bg-amber-500/15 flex items-center justify-center border border-amber-400/20">
                  <Clock size={14} className="text-amber-600 dark:text-amber-400" />
                </div>
                <div>
                  <p className="text-[11px] font-black uppercase tracking-[0.15em] text-amber-700 dark:text-amber-400 leading-none">Pendentes</p>
                  <p className="text-[9px] text-amber-600/60 dark:text-amber-500/60 font-medium mt-0.5">Aguardando autorização</p>
                </div>
              </div>
              <div className="h-7 w-7 rounded-full bg-amber-400/20 flex items-center justify-center border border-amber-400/30">
                <span className="text-[11px] font-black text-amber-600 dark:text-amber-400">{groupedUsers.pending.length}</span>
              </div>
            </div>

            {/* Pending cards */}
            <div className="space-y-2.5 min-h-[120px]">
              {groupedUsers.pending.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-10 text-center">
                  <div className="h-10 w-10 rounded-2xl bg-amber-400/10 flex items-center justify-center mb-3 border border-amber-400/15">
                    <ShieldCheck size={18} className="text-amber-500/50" />
                  </div>
                  <p className="text-[9px] font-black uppercase tracking-widest text-amber-600/30">Tudo em dia</p>
                </div>
              ) : (
                groupedUsers.pending.map(u => (
                  <UserCard key={u.id} user={u} currentUserId={currentUserId} onEdit={handleOpenEditUser} onStatus={handleToggleStatus} onPassword={handleOpenResetPassword} onDelete={handleExcluirUsuario} onAuthorize={handleOpenAuthorize} onRefresh={onRefresh} variant="pending" />
                ))
              )}
            </div>
          </div>
        </div>

        {/* ── TILE: ACTIVE MEMBERS ── */}
        <div className="lg:col-span-8 flex flex-col gap-3">
          {/* Header */}
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-2">
              <div className="h-1.5 w-1.5 rounded-full bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.8)]" />
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-foreground/40">Membros Ativos</p>
            </div>
            <p className="text-[9px] font-bold text-muted-foreground/30">{groupedUsers.active.length} membros</p>
          </div>

          {/* Active card grid */}
          <div className="relative rounded-[2rem] overflow-hidden border border-white/20 dark:border-white/[0.06] bg-white/40 dark:bg-white/[0.02] backdrop-blur-2xl p-4 shadow-[0_2px_20px_rgba(0,0,0,0.05)]">
            <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/80 dark:via-white/20 to-transparent" />

            {groupedUsers.active.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-24 text-center opacity-20">
                <Users size={40} className="mb-3" />
                <p className="text-xs font-black uppercase tracking-widest">Nenhum membro ativo</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {groupedUsers.active.map(u => (
                  <UserCard key={u.id} user={u} currentUserId={currentUserId} onEdit={handleOpenEditUser} onStatus={handleToggleStatus} onPassword={handleOpenResetPassword} onDelete={handleExcluirUsuario} onRefresh={onRefresh} />
                ))}
              </div>
            )}

            {/* Inactive section */}
            {groupedUsers.inactive.length > 0 && (
              <div className="mt-8 pt-8 border-t border-black/[0.04] dark:border-white/[0.05]">
                <div className="flex items-center gap-2 mb-4 px-1">
                  <div className="h-1.5 w-1.5 rounded-full bg-rose-400/60" />
                  <p className="text-[9px] font-black uppercase tracking-[0.25em] text-muted-foreground/30">Acessos Revogados</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 opacity-50 grayscale-[0.6]">
                  {groupedUsers.inactive.map(u => (
                    <UserCard key={u.id} user={u} currentUserId={currentUserId} onEdit={handleOpenEditUser} onStatus={handleToggleStatus} onPassword={handleOpenResetPassword} onDelete={handleExcluirUsuario} onRefresh={onRefresh} />
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ════════════════════════════════════════
          DIALOGS — lógica 100% preservada
          só o visual dos dialogs foi refinado
      ════════════════════════════════════════ */}

      {/* DIALOG DE EDIÇÃO */}
      <Dialog open={isEditUserDialogOpen} onOpenChange={setIsEditUserDialogOpen}>
        <DialogContent className="sm:max-w-[520px] max-h-[85vh] flex flex-col p-0 overflow-hidden rounded-[2.5rem] border border-white/20 dark:border-white/[0.08] shadow-[0_32px_80px_rgba(0,0,0,0.25)] bg-white/90 dark:bg-zinc-900/95 backdrop-blur-3xl">
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/80 dark:via-white/20 to-transparent" />

          <DialogHeader className="px-9 pt-9 pb-6 flex flex-row items-center gap-4">
            <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center shadow-lg shadow-primary/20 shrink-0 text-white">
              <UserCog className="h-6 w-6" />
            </div>
            <div>
              <DialogTitle className="text-lg font-black tracking-tight">Editar Membro</DialogTitle>
              <DialogDescription className="text-xs font-medium text-muted-foreground mt-0.5">Atualize permissões e dados cadastrais.</DialogDescription>
            </div>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto px-9 py-2 space-y-5 pb-8">
            {editingUser && (
              <>
                <div className="flex items-center gap-4 p-5 rounded-2xl bg-black/[0.02] dark:bg-white/[0.03] border border-black/[0.05] dark:border-white/[0.06]">
                  <Avatar className="h-14 w-14 rounded-xl border-2 border-white/50 dark:border-white/10 shadow">
                    <AvatarImage src={editingUser.avatar_url} className="object-cover" />
                    <AvatarFallback className="bg-primary/10 text-primary font-black text-xl">{editingUser.name?.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="text-xs font-bold text-foreground/80">{editingUser.email}</p>
                    <Badge variant="outline" className="text-[9px] mt-1 rounded-full px-2.5 border-border/50">ID: {editingUser.id.substring(0, 8)}</Badge>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <Label className="text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground/60 ml-1">Nome Completo</Label>
                    <div className="relative">
                      <User className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/25" />
                      <Input value={editingUser.name} onChange={e => setEditingUser({ ...editingUser, name: e.target.value })} placeholder="Nome do membro" className="pl-11 h-11 rounded-xl bg-black/[0.02] dark:bg-white/[0.03] border-black/[0.06] dark:border-white/[0.08] font-semibold" />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground/60 ml-1">Cargo</Label>
                    <Select value={editingUser.role} onValueChange={val => setEditingUser({ ...editingUser, role: val })}>
                      <SelectTrigger className="h-11 rounded-xl bg-black/[0.02] dark:bg-white/[0.03] border-black/[0.06] dark:border-white/[0.08] font-semibold">
                        <div className="flex items-center gap-2"><Shield className="h-4 w-4 text-primary/40" /><SelectValue /></div>
                      </SelectTrigger>
                      <SelectContent className="rounded-xl border-border/40">
                        {["Secretária", "Corretor", "Gestor", "Diretor", "Marketing"].map(r => <SelectItem key={r} value={r} className="rounded-lg">{r}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </>
            )}
          </div>

          <DialogFooter className="px-9 py-6 border-t border-black/[0.05] dark:border-white/[0.06] flex flex-col-reverse sm:flex-row gap-3">
            <Button variant="ghost" onClick={() => setIsEditUserDialogOpen(false)} className="rounded-xl h-11 font-black text-[10px] uppercase tracking-widest">Cancelar</Button>
            <Button onClick={handleSaveEditedUser} disabled={isSavingEdit} className="rounded-xl h-11 gap-2 font-black text-[10px] uppercase tracking-wider shadow-lg shadow-primary/20">
              {isSavingEdit ? <Loader2 className="animate-spin h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
              Guardar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* DIALOG DE AUTORIZAÇÃO */}
      <Dialog open={isAuthorizeDialogOpen} onOpenChange={setIsAuthorizeDialogOpen}>
        <DialogContent className="sm:max-w-[520px] max-h-[90vh] flex flex-col p-0 overflow-hidden rounded-[2.5rem] border border-white/20 dark:border-white/[0.08] shadow-[0_32px_80px_rgba(0,0,0,0.25)] bg-white/90 dark:bg-zinc-900/95 backdrop-blur-3xl">
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-amber-300/60 dark:via-amber-400/20 to-transparent" />

          <DialogHeader className="px-9 pt-9 pb-6 flex flex-row items-center gap-4">
            <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-400 flex items-center justify-center shadow-lg shadow-amber-400/20 shrink-0 text-white">
              <ShieldCheck size={24} />
            </div>
            <div>
              <DialogTitle className="text-lg font-black tracking-tight">Autorizar Acesso</DialogTitle>
              <DialogDescription className="text-xs font-medium text-muted-foreground mt-0.5">Configure os dados e ative o colaborador.</DialogDescription>
            </div>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto px-9 py-4 space-y-6 pb-8">
            {authorizingUser && (
              <div className="space-y-6">
                {/* Avatar upload */}
                <div className="flex flex-col items-center gap-3">
                  <div className="relative">
                    <div className="h-24 w-24 rounded-[1.5rem] bg-gradient-to-br from-zinc-100 to-zinc-200 dark:from-zinc-800 dark:to-zinc-700 p-0.5 shadow-xl ring-1 ring-black/[0.08] dark:ring-white/[0.1] overflow-hidden">
                      <Avatar className="h-full w-full rounded-[1.4rem]">
                        <AvatarImage src={authFormData.avatar_url} className="object-cover" />
                        <AvatarFallback className="bg-amber-500/10 text-amber-600 font-black text-3xl">{authFormData.name?.charAt(0).toUpperCase() || "?"}</AvatarFallback>
                      </Avatar>
                    </div>
                    <button onClick={() => fileInputRef.current?.click()} className="absolute -bottom-2 -right-2 h-9 w-9 bg-white dark:bg-zinc-800 rounded-xl shadow-lg flex items-center justify-center border border-black/[0.08] dark:border-white/[0.1] hover:scale-110 transition-all text-amber-500">
                      <Camera size={16} />
                    </button>
                    <input type="file" ref={fileInputRef} onChange={handleUploadAuthAvatar} className="hidden" accept="image/*" />
                  </div>
                  <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/40">Foto de Identificação</p>
                </div>

                <div className="grid gap-4">
                  <div className="space-y-1.5">
                    <Label className="text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground/60 ml-1">Nome</Label>
                    <div className="relative">
                      <User className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/25" />
                      <Input value={authFormData.name} onChange={e => setAuthFormData({ ...authFormData, name: e.target.value })} placeholder="Nome completo" className="pl-11 h-11 rounded-xl bg-black/[0.02] dark:bg-white/[0.03] border-black/[0.06] dark:border-white/[0.08] font-semibold" />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label className="text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground/60 ml-1">Cargo</Label>
                      <Select value={authFormData.role} onValueChange={val => setAuthFormData({ ...authFormData, role: val })}>
                        <SelectTrigger className="h-11 rounded-xl bg-black/[0.02] dark:bg-white/[0.03] border-black/[0.06] dark:border-white/[0.08] font-semibold"><SelectValue /></SelectTrigger>
                        <SelectContent className="rounded-xl border-border/40">
                          {["Corretor", "Secretária", "Gestor", "Diretor", "Marketing"].map(r => <SelectItem key={r} value={r} className="rounded-lg">{r}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground/60 ml-1">Senha</Label>
                      <div className="relative">
                        <Key className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/25" />
                        <Input type={showPassword ? "text" : "password"} value={authFormData.password} onChange={e => setAuthFormData({ ...authFormData, password: e.target.value })} placeholder="Mín. 6 dígitos" className="pl-11 pr-10 h-11 rounded-xl bg-black/[0.02] dark:bg-white/[0.03] border-black/[0.06] dark:border-white/[0.08] font-semibold" />
                        <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground/40 hover:text-amber-500 transition-colors">
                          {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="p-4 rounded-2xl bg-amber-400/8 border border-amber-400/15 flex items-start gap-3">
                    <Info size={14} className="text-amber-500 shrink-0 mt-0.5" />
                    <p className="text-[9px] font-medium text-amber-600/70 dark:text-amber-400/70 leading-relaxed uppercase tracking-wider">
                      Ao autorizar, o colaborador acessa imediatamente as ferramentas de <span className="font-black text-amber-600 dark:text-amber-400">{authFormData.role}</span>.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          <DialogFooter className="px-9 py-6 border-t border-black/[0.05] dark:border-white/[0.06] flex flex-col sm:flex-row gap-3">
            <Button variant="ghost" onClick={() => setIsAuthorizeDialogOpen(false)} className="rounded-xl h-11 font-black text-[10px] uppercase tracking-widest">Cancelar</Button>
            <Button onClick={handleAuthorizeUser} disabled={isAuthorizing} className="flex-1 rounded-xl h-11 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-500/90 hover:to-orange-500/90 text-white font-black text-[10px] uppercase tracking-wider shadow-lg shadow-amber-500/20 gap-2">
              {isAuthorizing ? <Loader2 className="animate-spin h-4 w-4" /> : <ShieldCheck className="h-4 w-4" />}
              Autorizar e Ativar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* DIALOG DE CONVITE */}
      <Dialog open={isInviteDialogOpen} onOpenChange={setIsInviteDialogOpen}>
        <DialogContent className="sm:max-w-[460px] rounded-[2.5rem] p-0 overflow-hidden border border-white/20 dark:border-white/[0.08] shadow-[0_32px_80px_rgba(0,0,0,0.25)] bg-white/90 dark:bg-zinc-900/95 backdrop-blur-3xl">
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/80 dark:via-white/20 to-transparent" />

          <div className="px-9 pt-9 pb-6">
            <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center shadow-lg shadow-primary/20 mb-5 text-white">
              <Mail className="h-6 w-6" />
            </div>
            <DialogTitle className="text-xl font-black tracking-tight">Convidar Membro</DialogTitle>
            <DialogDescription className="text-xs font-medium text-muted-foreground mt-1.5">Convide alguém para sua unidade via e-mail.</DialogDescription>
          </div>

          <div className="px-9 pb-6 space-y-4">
            <div className="space-y-1.5">
              <Label className="text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground/60 ml-1">E-mail</Label>
              <div className="relative">
                <AtSign className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/25" />
                <Input placeholder="nome@empresa.com.br" value={inviteData.email} onChange={e => setInviteData({ ...inviteData, email: e.target.value })} className="pl-11 h-11 rounded-xl bg-black/[0.02] dark:bg-white/[0.03] border-black/[0.06] dark:border-white/[0.08] font-medium" />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground/60 ml-1">Nível de Acesso</Label>
              <Select value={inviteData.role} onValueChange={v => setInviteData({ ...inviteData, role: v })}>
                <SelectTrigger className="h-11 rounded-xl bg-black/[0.02] dark:bg-white/[0.03] border-black/[0.06] dark:border-white/[0.08] font-semibold">
                  <div className="flex items-center gap-2"><ShieldCheck className="h-4 w-4 text-primary/40" /><SelectValue /></div>
                </SelectTrigger>
                <SelectContent className="rounded-xl border-border/40">
                  {["Corretor", "Secretária", "Gestor", "Diretor", "Marketing"].map(r => <SelectItem key={r} value={r} className="rounded-lg">{r}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter className="px-9 py-6 border-t border-black/[0.05] dark:border-white/[0.06]">
            <Button onClick={handleInviteMember} disabled={isInviting} className="w-full rounded-xl h-11 gap-2 font-black text-[10px] uppercase tracking-wider shadow-lg shadow-primary/20">
              {isInviting ? <Loader2 className="animate-spin h-4 w-4" /> : <Mail className="h-4 w-4" />}
              Enviar Convite
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* DIALOG DE REDEFINIÇÃO DE SENHA */}
      <Dialog open={isResetPasswordDialogOpen} onOpenChange={setIsResetPasswordDialogOpen}>
        <DialogContent className="max-w-[90vw] sm:max-w-[400px] rounded-[2.5rem] border border-white/20 dark:border-white/[0.08] shadow-[0_32px_80px_rgba(0,0,0,0.25)] bg-white/90 dark:bg-zinc-900/95 backdrop-blur-3xl p-8">
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/80 dark:via-white/20 to-transparent" />

          <div className="flex flex-col items-center text-center mb-6">
            <div className="h-14 w-14 rounded-2xl bg-orange-50 dark:bg-orange-950/20 flex items-center justify-center text-orange-500 mb-4 ring-1 ring-orange-200/50 dark:ring-orange-800/30 shadow-inner">
              <Key className="h-7 w-7" />
            </div>
            <DialogTitle className="text-lg font-black tracking-tight">Redefinir Senha</DialogTitle>
            <DialogDescription className="text-xs font-medium text-muted-foreground mt-1.5 max-w-[260px]">Defina uma nova senha temporária para este colaborador.</DialogDescription>
          </div>

          <div className="space-y-1.5 mb-6">
            <Label className="text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground/60 ml-1">Senha Temporária</Label>
            <div className="relative">
              <Input type={showPassword ? "text" : "password"} value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="Mínimo 6 caracteres" className="pr-11 h-11 rounded-xl bg-black/[0.02] dark:bg-white/[0.03] border-black/[0.06] dark:border-white/[0.08] font-medium" />
              <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground/40 hover:text-primary transition-colors">
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <DialogFooter className="flex flex-col gap-2 sm:flex-row sm:gap-2.5">
            <Button variant="ghost" onClick={() => setIsResetPasswordDialogOpen(false)} className="rounded-xl h-11 font-black text-[9px] uppercase tracking-widest w-full sm:w-auto border border-border/20">Cancelar</Button>
            <Button onClick={handleResetPassword} disabled={isSavingEdit || newPassword.length < 6} className="rounded-xl h-11 font-black text-[9px] uppercase tracking-wider w-full sm:flex-1 shadow-lg shadow-primary/20">
              {isSavingEdit ? <Loader2 className="animate-spin h-4 w-4" /> : "Confirmar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* POPUP SUCESSO SENHA */}
      <Dialog open={isPasswordSuccessOpen} onOpenChange={setIsPasswordSuccessOpen}>
        <DialogContent className="sm:max-w-sm text-center flex flex-col items-center justify-center p-12 rounded-[3rem] border border-white/20 dark:border-white/[0.08] shadow-[0_32px_80px_rgba(0,0,0,0.25)] bg-white/90 dark:bg-zinc-900/95 backdrop-blur-3xl">
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-emerald-300/50 dark:via-emerald-400/20 to-transparent" />
          <div className="h-16 w-16 rounded-full bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-950/20 dark:to-teal-950/20 flex items-center justify-center mb-6 ring-8 ring-emerald-100/50 dark:ring-emerald-900/20 animate-in zoom-in-50 duration-500 border border-emerald-200/30 dark:border-emerald-700/20 shadow-lg shadow-emerald-500/10">
            <CheckCircle2 className="h-8 w-8 text-emerald-500" />
          </div>
          <DialogTitle className="text-xl font-black tracking-tight mb-2">Tudo pronto!</DialogTitle>
          <DialogDescription className="text-xs font-medium text-muted-foreground leading-relaxed">A conta foi protegida com sucesso. Informe o colaborador.</DialogDescription>
          <Button className="mt-8 rounded-full h-11 px-8 font-black text-[10px] uppercase tracking-[0.2em] shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all" onClick={() => setIsPasswordSuccessOpen(false)}>
            Concluído
          </Button>
        </DialogContent>
      </Dialog>

    </div>
  )
}