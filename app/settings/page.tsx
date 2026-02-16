"use client"

import { useState, useEffect, useCallback } from "react"
import { supabase } from "@/lib/supabase"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { toast } from "sonner"
import { Menu, Settings, RefreshCw, Loader2 } from "lucide-react"
import { Sidebar } from "@/components/central63/sidebar"

// Importando os novos componentes refatorados
import { ProfileTab } from "@/components/central63/settings/profile-tab"
import { TeamTab } from "@/components/central63/settings/team-tab"
import { IntegrationsTab } from "@/components/central63/settings/integrations-tab"

export default function ConfiguracoesPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [loading, setLoading] = useState(true)
  
  // Dados principais
  const [profile, setProfile] = useState<any>({ id: "", name: "", email: "", role: "", avatar_url: "" })
  const [users, setUsers] = useState<any[]>([])
  const [integrations, setIntegrations] = useState<any[]>([])

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const [profileRes, usersRes, configRes] = await Promise.all([
        supabase.from('profiles').select('*').eq('id', user.id).maybeSingle(),
        supabase.from('profiles').select('*').order('updated_at', { ascending: false }),
        supabase.from('company_settings').select('*')
      ])

      if (profileRes.data) {
        setProfile({
          id: user.id,
          name: profileRes.data.full_name || "",
          email: profileRes.data.email || user.email || "",
          role: profileRes.data.role || "",
          avatar_url: profileRes.data.avatar_url || ""
        })
      }

      setUsers(usersRes.data || [])
      setIntegrations(configRes.data || [])

    } catch (error: any) {
      toast.error("Erro ao carregar dados")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchData() }, [fetchData])

  const isAdmin = profile.role === 'Diretor' || profile.role === 'Gestor'

  if (loading && !profile.id) return (
    <div className="flex h-screen items-center justify-center bg-background">
      <Loader2 className="animate-spin text-primary" size={32} />
    </div>
  )

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} activeTab="configuracoes" />
      
      <main className="flex-1 flex flex-col h-full overflow-y-auto">
        <header className="w-full bg-card border-b px-6 py-4 flex items-center justify-between shadow-sm z-20">
          <div className="flex items-center gap-4 text-foreground">
            <button className="lg:hidden p-2 text-muted-foreground hover:bg-accent rounded-lg" onClick={() => setSidebarOpen(true)}>
              <Menu />
            </button>
            <Settings className="text-primary hidden lg:block" size={20} />
            <h2 className="text-2xl font-bold tracking-tight">Configurações</h2>
          </div>
          <Button variant="outline" size="icon" onClick={fetchData} title="Atualizar dados">
            <RefreshCw size={18} className={loading ? "animate-spin" : ""} />
          </Button>
        </header>

        <div className="p-4 lg:p-8 max-w-5xl mx-auto w-full pb-10">
          <Tabs defaultValue="perfil" className="space-y-6">
            <TabsList className="bg-muted p-1">
              <TabsTrigger value="perfil">Meu Perfil</TabsTrigger>
              {isAdmin && (
                <>
                  <TabsTrigger value="equipe">Equipe</TabsTrigger>
                  <TabsTrigger value="integracoes">Integrações</TabsTrigger>
                </>
              )}
            </TabsList>

            <TabsContent value="perfil">
              <ProfileTab 
                profile={profile} 
                setProfile={setProfile} 
                onRefresh={fetchData} 
              />
            </TabsContent>

            {isAdmin && (
              <TabsContent value="equipe">
                <TeamTab 
                  users={users} 
                  currentUserId={profile.id} 
                  onRefresh={fetchData} 
                />
              </TabsContent>
            )}

            {isAdmin && (
              <TabsContent value="integracoes">
                <IntegrationsTab 
                  integrations={integrations} 
                  onRefresh={fetchData} 
                />
              </TabsContent>
            )}
          </Tabs>
        </div>
      </main>
    </div>
  )
}