"use client"

import { useState, useEffect, useRef } from "react"
import { supabase } from "@/lib/supabase"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"
import { UserPlus, Save, Camera, Menu, Settings, Loader2, RefreshCw, AlertTriangle } from "lucide-react"
import { Sidebar } from "@/components/central63/sidebar"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

export default function ConfiguracoesPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("configuracoes")
  const [users, setUsers] = useState<any[]>([])
  
  // Estados de Perfil
  const [profile, setProfile] = useState({ id: "", name: "", email: "", role: "", avatar_url: "" })
  const [isSavingProfile, setIsSavingProfile] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Estados de Convite
  const [isInviteDialogOpen, setIsInviteDialogOpen] = useState(false)
  const [isInviting, setIsInviting] = useState(false)
  const [inviteEmail, setInviteEmail] = useState("")
  const [inviteRole, setInviteRole] = useState("Secretária")

  useEffect(() => {
    fetchData()
  }, [])

  async function fetchData() {
    setLoading(true)
    try {
      // 1. Busca sessão e utilizador logado
      const { data: { user }, error: authError } = await supabase.auth.getUser()
      
      if (authError) throw authError

      if (user) {
        // Busca o perfil do utilizador logado
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .maybeSingle()
        
        if (profileError) throw profileError

        if (profileData) {
          setProfile({ 
            id: user.id,
            name: profileData.full_name || "", 
            email: profileData.email || user.email || "", 
            role: profileData.role || "",
            avatar_url: profileData.avatar_url || ""
          })
        } else {
          setProfile(prev => ({
            ...prev,
            id: user.id,
            email: user.email || ""
          }))
        }

        // 2. Busca lista de todos os utilizadores (Equipa)
        // Alterado de 'created_at' para 'updated_at' conforme sugestão do erro do banco
        const { data: allUsers, error: usersError } = await supabase
          .from('profiles')
          .select('*')
          .order('updated_at', { ascending: false })
        
        if (usersError) {
            // Se falhar a ordenação por updated_at também, tentamos sem ordem
            console.warn("Falha ao ordenar por updated_at, tentando sem ordenação")
            const { data: retryUsers, error: retryError } = await supabase
                .from('profiles')
                .select('*')
            
            if (retryError) throw retryError
            setUsers(retryUsers || [])
        } else {
            setUsers(allUsers || [])
        }
      }
      
    } catch (error: any) {
      console.error("Erro ao carregar dados:", error)
      const errorMessage = error?.message || "Erro desconhecido ao carregar membros."
      toast.error(`Erro: ${errorMessage}`)
    } finally {
      setLoading(false)
    }
  }

  const handleUpdateProfile = async () => {
    if (!profile.name.trim()) return toast.error("O nome não pode estar vazio")
    
    setIsSavingProfile(true)
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ full_name: profile.name })
        .eq('id', profile.id)

      if (error) throw error
      toast.success("Perfil atualizado com sucesso!")
      fetchData()
    } catch (error: any) {
      toast.error("Erro ao atualizar: " + error.message)
    } finally {
      setIsSavingProfile(false)
    }
  }

  const handleUploadAvatar = async (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      if (!event.target.files || event.target.files.length === 0) return
      
      setIsUploading(true)
      const file = event.target.files[0]
      const fileExt = file.name.split('.').pop()
      const fileName = `${profile.id}-${Date.now()}.${fileExt}`
      const filePath = `${fileName}`

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file)

      if (uploadError) throw uploadError

      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath)

      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: publicUrl })
        .eq('id', profile.id)

      if (updateError) throw updateError

      setProfile(prev => ({ ...prev, avatar_url: publicUrl }))
      toast.success("Foto de perfil atualizada!")
      fetchData()
    } catch (error: any) {
      toast.error("Erro no upload: " + error.message)
    } finally {
      setIsUploading(false)
    }
  }

  const handleUpdateUserRole = async (userId: string, newRole: string) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ role: newRole })
        .eq('id', userId)

      if (error) throw error
      toast.success("Cargo atualizado!")
      setUsers(users.map(u => u.id === userId ? { ...u, role: newRole } : u))
    } catch (error: any) {
      toast.error("Erro ao alterar cargo: " + error.message)
    }
  }

  const handleInviteMember = async () => {
    if (!inviteEmail || !inviteEmail.includes('@')) {
      return toast.error("Por favor, insira um e-mail válido")
    }

    setIsInviting(true)
    try {
      // 1. Cadastra o utilizador no Auth do Supabase
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: inviteEmail,
        password: Math.random().toString(36).slice(-12), 
        options: {
          data: {
            full_name: inviteEmail.split('@')[0],
            role: inviteRole,
          },
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        }
      })

      if (authError) throw authError

      if (authData.user) {
        // 2. Insere na tabela de perfis
        // Removido a coluna 'status' que não existe no esquema do seu banco
        const { error: profileError } = await supabase
          .from('profiles')
          .insert([{
            id: authData.user.id,
            full_name: inviteEmail.split('@')[0],
            email: inviteEmail,
            role: inviteRole
          }])
        
        if (profileError && profileError.code !== '23505') { 
          throw profileError
        }
      }

      toast.success("Convite enviado com sucesso!")
      setInviteEmail("")
      setIsInviteDialogOpen(false)
      
      setTimeout(() => fetchData(), 1500)
      
    } catch (error: any) {
      console.error("Erro ao convidar:", error)
      toast.error(`Erro ao convidar: ${error.message}`)
    } finally {
      setIsInviting(false)
    }
  }

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="animate-spin text-primary" size={32} />
      </div>
    )
  }

  return (
  <div className="flex h-screen bg-background overflow-hidden">
    <Sidebar 
      isOpen={sidebarOpen} 
      onClose={() => setSidebarOpen(false)} 
      activeTab={activeTab} 
      onTabChange={setActiveTab} 
    />
    
    <main className="flex-1 flex flex-col h-full overflow-y-auto">
      {/* NOVO HEADER ADICIONADO AQUI */}
      <header className="w-full bg-card border-b border-border px-6 py-4 flex items-center justify-between shadow-sm flex-shrink-0 z-20">
        <div className="flex items-center gap-4">
          <button 
            className="lg:hidden p-2 text-muted-foreground hover:bg-accent rounded-lg" 
            onClick={() => setSidebarOpen(true)}
          >
            <Menu />
          </button>
          <Settings className="text-primary hidden lg:block" />
          <h2 className="text-2xl font-bold text-foreground tracking-tight">Configuração</h2>
        </div>
        <Button variant="outline" size="icon" onClick={fetchData} title="Atualizar dados">
            <RefreshCw size={18} />
        </Button>
      </header>

      {/* Conteúdo Principal - Ajustado padding superior (pt-4) */}
      <div className="p-4 lg:p-8 pt-4 lg:pt-6 max-w-6xl mx-auto w-full space-y-8">
        <div className="flex items-center justify-between">
          
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Card: Meu Perfil */}
          <Card className="md:col-span-1">
            <CardHeader>
              <CardTitle>Meu Perfil</CardTitle>
              <CardDescription>As suas informações pessoais</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-col items-center gap-4 mb-6">
                <div 
                  className="relative group cursor-pointer" 
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Avatar className="w-24 h-24 border-2 border-primary/10 transition-all group-hover:border-primary/50">
                    <AvatarImage src={profile.avatar_url} alt={profile.name} />
                    <AvatarFallback className="bg-accent">
                      {isUploading ? <Loader2 className="animate-spin" /> : <Camera className="text-muted-foreground" />}
                    </AvatarFallback>
                  </Avatar>
                  <div className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                    <Camera className="text-white" size={20} />
                  </div>
                </div>
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  className="hidden" 
                  accept="image/*" 
                  onChange={handleUploadAvatar}
                  disabled={isUploading}
                />
                <p className="text-xs text-muted-foreground text-center italic">Clique para alterar a foto</p>
              </div>
              
              <div className="space-y-2">
                <Label>Nome Completo</Label>
                <Input 
                  value={profile.name} 
                  onChange={(e) => setProfile(prev => ({ ...prev, name: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label>E-mail</Label>
                <Input value={profile.email} disabled className="bg-muted opacity-70" />
              </div>
              <div className="space-y-2">
                <Label>Cargo Atual</Label>
                <Badge variant="outline" className="w-full justify-center py-1">{profile.role}</Badge>
              </div>
              <Button 
                className="w-full gap-2" 
                onClick={handleUpdateProfile}
                disabled={isSavingProfile}
              >
                {isSavingProfile ? <Loader2 className="animate-spin" size={16} /> : <Save size={16} />} 
                Salvar Alterações
              </Button>
            </CardContent>
          </Card>

          {/* Card: Gestão de Equipe */}
          <Card className="md:col-span-2">
            <CardHeader className="flex flex-row items-center justify-between space-y-0">
              <div>
                <CardTitle>Gestão de Equipe</CardTitle>
                <CardDescription>Utilizadores com acesso ao sistema</CardDescription>
              </div>
              <Dialog open={isInviteDialogOpen} onOpenChange={setIsInviteDialogOpen}>
                <DialogTrigger asChild>
                  <Button size="sm" className="gap-2">
                    <UserPlus size={16} /> Novo Usuário
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Convidar Novo Membro</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label htmlFor="email">E-mail</Label>
                      <Input 
                        id="email" 
                        placeholder="exemplo@central63.com.br" 
                        value={inviteEmail}
                        onChange={(e) => setInviteEmail(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Nível de Permissão</Label>
                      <Select value={inviteRole} onValueChange={setInviteRole}>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione um cargo" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Secretária">Secretária</SelectItem>
                          <SelectItem value="Gestor">Gestor</SelectItem>
                          <SelectItem value="Diretor">Diretor</SelectItem>
                          <SelectItem value="Marketing">Marketing</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex items-start gap-2 p-3 bg-amber-50 border border-amber-200 rounded-md text-amber-800 text-xs">
                      <AlertTriangle size={14} className="shrink-0 mt-0.5" />
                      <p>O convite criará uma conta no sistema. Verifique se o e-mail está correto.</p>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button 
                      className="w-full gap-2" 
                      onClick={handleInviteMember}
                      disabled={isInviting}
                    >
                      {isInviting ? <Loader2 className="animate-spin" size={16} /> : <UserPlus size={16} />}
                      Enviar Convite
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Membro</TableHead>
                      <TableHead>Cargo</TableHead>
                      <TableHead>Cadastro</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {users.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={3} className="text-center py-8 text-muted-foreground">
                          Nenhum membro encontrado.
                        </TableCell>
                      </TableRow>
                    ) : (
                      users.map((u) => (
                        <TableRow key={u.id}>
                          <TableCell>
                            <div className="font-medium">{u.full_name || "Sem Nome"}</div>
                            <div className="text-xs text-muted-foreground">{u.email}</div>
                          </TableCell>
                          <TableCell>
                            <Select 
                              defaultValue={u.role} 
                              onValueChange={(val) => handleUpdateUserRole(u.id, val)}
                            >
                              <SelectTrigger className="h-8 w-[130px]">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="Secretária">Secretária</SelectItem>
                                <SelectItem value="Gestor">Gestor</SelectItem>
                                <SelectItem value="Diretor">Diretor</SelectItem>
                                <SelectItem value="Marketing">Marketing</SelectItem>
                              </SelectContent>
                            </Select>
                          </TableCell>
                          <TableCell className="text-xs">
                            {u.updated_at ? new Date(u.updated_at).toLocaleDateString('pt-BR') : '---'}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </main>
  </div>
)
}