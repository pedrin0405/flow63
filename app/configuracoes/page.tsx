"use client"

import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"
import { UserPlus, Save, Camera, ShieldCheck } from "lucide-react"
import { Sidebar } from "@/components/central63/sidebar"

export default function ConfiguracoesPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("corretores")
  const [users, setUsers] = useState<any[]>([])
  const [profile, setProfile] = useState({ name: "", email: "", role: "" })

  useEffect(() => {
    fetchData()
  }, [])

  async function fetchData() {
    setLoading(true)
    // 1. Busca perfil do usuário logado
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()
      
      if (profileData) setProfile({ 
        name: profileData.full_name, 
        email: profileData.email, 
        role: profileData.role 
      })
    }

    // 2. Busca lista de todos os usuários (Equipe)
    const { data: allUsers } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false })
    
    if (allUsers) setUsers(allUsers)
    setLoading(false)
  }

  // Função para salvar alterações no perfil
  const handleUpdateProfile = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    const { error } = await supabase
      .from('profiles')
      .update({ full_name: profile.name })
      .eq('id', user?.id)

    if (error) toast.error("Erro ao atualizar perfil")
    else toast.success("Perfil atualizado!")
  }

  return (
        <Sidebar 
                  isOpen={sidebarOpen} 
                  onClose={() => setSidebarOpen(false)} 
                  activeTab={activeTab} 
                  onTabChange={setActiveTab} 
                />
      <div className="p-8 max-w-6xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Configurações</h1>
        <p className="text-muted-foreground">Gerencie sua conta e as permissões da equipe.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* COLUNA ESQUERDA: PERFIL */}
        <Card className="md:col-span-1">
          <CardHeader>
            <CardTitle>Meu Perfil</CardTitle>
            <CardDescription>Suas informações pessoais</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-col items-center gap-4 mb-6">
              <div className="relative group">
                <div className="w-24 h-24 rounded-full bg-accent flex items-center justify-center border-2 border-dashed border-muted-foreground/50">
                  <Camera className="text-muted-foreground group-hover:text-primary transition-colors" />
                </div>
                <button className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
              </div>
              <p className="text-xs text-muted-foreground text-center italic">Clique para alterar foto (Supabase Storage)</p>
            </div>
            
            <div className="space-y-2">
              <Label>Nome Completo</Label>
              <Input 
                value={profile.name} 
                onChange={(e) => setProfile({...profile, name: e.target.value})}
              />
            </div>
            <div className="space-y-2">
              <Label>E-mail</Label>
              <Input value={profile.email} disabled className="bg-muted" />
            </div>
            <div className="space-y-2">
              <Label>Cargo Atual</Label>
              <Badge variant="outline" className="w-full justify-center py-1">{profile.role}</Badge>
            </div>
            <Button className="w-full gap-2" onClick={handleUpdateProfile}>
              <Save size={16} /> Salvar Alterações
            </Button>
          </CardContent>
        </Card>

        {/* COLUNA DIREITA: GESTÃO DE EQUIPE */}
        <Card className="md:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Gestão de Equipe</CardTitle>
              <CardDescription>Usuários com acesso ao sistema</CardDescription>
            </div>
            <Dialog>
              <DialogTrigger asChild>
                <Button size="sm" className="gap-2">
                  <UserPlus size={16} /> Novo Usuário
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Cadastrar Novo Membro</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                   {/* Aqui entraria o formulário de cadastro/convite */}
                   <p className="text-sm text-muted-foreground italic">Integração: Este formulário usará auth.signUp() do Supabase.</p>
                   <div className="space-y-2">
                     <Label>E-mail</Label>
                     <Input placeholder="exemplo@central63.com.br" />
                   </div>
                   <div className="space-y-2">
                     <Label>Nível de Permissão</Label>
                     <Select>
                       <SelectTrigger>
                         <SelectValue placeholder="Selecione um cargo" />
                       </SelectTrigger>
                       <SelectContent>
                         <SelectItem value="secretaria">Secretária</SelectItem>
                         <SelectItem value="gestor">Gestor</SelectItem>
                         <SelectItem value="diretor">Diretor</SelectItem>
                         <SelectItem value="marketing">Marketing</SelectItem>
                       </SelectContent>
                     </Select>
                   </div>
                   <Button className="w-full">Enviar Convite</Button>
                </div>
              </DialogContent>
            </Dialog>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Membro</TableHead>
                  <TableHead>Cargo</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Desde</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((u) => (
                  <TableRow key={u.id}>
                    <TableCell>
                      <div className="font-medium">{u.full_name}</div>
                      <div className="text-xs text-muted-foreground">{u.email}</div>
                    </TableCell>
                    <TableCell>
                      <Select defaultValue={u.role}>
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
                    <TableCell>
                      <Badge variant={u.status === "Ativo" ? "default" : "secondary"}>
                        {u.status || "Ativo"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs">
                      {new Date(u.created_at).toLocaleDateString('pt-BR')}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}