"use client"

import { useState, useEffect, useCallback } from "react"
import { supabase } from "@/lib/supabase"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { toast } from "sonner"
import { Loader2, ShieldCheck, Save, RefreshCw, AlertCircle } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { cn } from "@/lib/utils"

export const AVAILABLE_SCREENS = [
  { label: "Home", route: "/" },
  { label: "Atendimentos", route: "/services" },
  { label: "Imóveis", route: "/homes" },
  { label: "Corretores", route: "/brokers" },
  { label: "Unidades", route: "/units" },
  { label: "Gestão de Cartões", route: "/admin/benefit-cards" },
  { label: "Meu Cartão", route: "/brokers/my-card" },
  { label: "Links na Bio", route: "/admin/bio" },
  { label: "Flow Design", route: "/editor" },
  { label: "Campanhas", route: "/campaigns" },
  { label: "Indicadores", route: "/indicators" },
  { label: "Formulários", route: "/forms" },
  { label: "Planilhas", route: "/spreadsheets" },
  { label: "Dashboard Customizável", route: "/custom-dashboard" },
  { label: "Chat de Suporte", route: "/chat-support" },
  { label: "Suporte", route: "/support" },
  { label: "Configurações", route: "/settings" },
]

export const AVAILABLE_ROLES = ["Diretor", "Gestor", "Marketing", "Secretária", "Corretor", "Admin"]

export function AccessControlTab() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [permissions, setPermissions] = useState<Record<string, string[]>>({})

  const fetchPermissions = useCallback(async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('role_permissions')
        .select('role, route')

      if (error) {
        // Se for erro de tabela inexistente, tratamos como aviso e usamos fallback
        if (error.code === 'PGRST205' || error.code === '42P01') {
          console.warn("Tabela 'role_permissions' não encontrada. Usando permissões padrão do sistema.");
          const fallback: Record<string, string[]> = {}
          AVAILABLE_ROLES.forEach(role => {
            if (role === 'Corretor') {
              fallback[role] = ['/brokers/my-card', '/admin/bio', '/editor', '/settings']
            } else {
              fallback[role] = AVAILABLE_SCREENS.map(s => s.route)
            }
          })
          setPermissions(fallback)
          setLoading(false)
          return
        }
        
        console.error("Erro Supabase (Code):", error.code)
        console.error("Erro Supabase (Message):", error.message)
        throw error
      }

      const mapping: Record<string, string[]> = {}
      data?.forEach(p => {
        if (!mapping[p.role]) mapping[p.role] = []
        mapping[p.role].push(p.route)
      })

      // Ensure all roles are present in the state
      AVAILABLE_ROLES.forEach(role => {
        if (!mapping[role]) mapping[role] = []
      })

      setPermissions(mapping)
    } catch (error: any) {
      console.error("Falha ao carregar permissões:", error)
      
      // Fallback para evitar tela vazia
      const fallback: Record<string, string[]> = {}
      AVAILABLE_ROLES.forEach(role => {
        if (role === 'Corretor') {
          fallback[role] = ['/brokers/my-card', '/admin/bio', '/editor', '/settings']
        } else {
          fallback[role] = AVAILABLE_SCREENS.map(s => s.route)
        }
      })
      setPermissions(fallback)

      if (error?.code === 'PGRST205' || error?.code === '42P01') {
        toast.error("Tabela 'role_permissions' não encontrada.")
      }
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchPermissions()
  }, [fetchPermissions])

  const togglePermission = (role: string, route: string) => {
    // Prevent removing access for Diretor
    if (role === "Diretor") return

    setPermissions(prev => {
      const current = prev[role] || []
      const updated = current.includes(route)
        ? current.filter(r => r !== route)
        : [...current, route]
      return { ...prev, [role]: updated }
    })
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      // 1. Delete all existing permissions (or just the ones we are managing)
      // For simplicity, we delete and re-insert
      const { error: deleteError } = await supabase
        .from('role_permissions')
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000') // Dummy condition to allow delete if no RLS prevents it

      if (deleteError) throw deleteError

      // 2. Prepare data for insert
      const toInsert: { role: string; route: string }[] = []
      Object.entries(permissions).forEach(([role, routes]) => {
        routes.forEach(route => {
          toInsert.push({ role, route })
        })
      })

      // 3. Always ensure Diretor has all permissions even if UI fails or state is wrong
      AVAILABLE_SCREENS.forEach(s => {
        if (!toInsert.find(i => i.role === "Diretor" && i.route === s.route)) {
          toInsert.push({ role: "Diretor", route: s.route })
        }
      })

      if (toInsert.length > 0) {
        const { error: insertError } = await supabase
          .from('role_permissions')
          .insert(toInsert)

        if (insertError) throw insertError
      }

      toast.success("Permissões atualizadas com sucesso!")
    } catch (error: any) {
      console.error("Erro ao salvar permissões:", error)
      toast.error("Erro ao salvar as permissões no banco de dados")
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="animate-spin text-primary" size={32} />
      </div>
    )
  }

  return (
    <Card className="border-none shadow-none bg-transparent">
      <CardHeader className="px-0 pt-0">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <CardTitle className="text-2xl font-black flex items-center gap-2">
              <ShieldCheck className="text-primary" />
              Controle de Acessos
            </CardTitle>
            <CardDescription className="font-medium mt-1">
              Gerencie quais telas cada cargo pode visualizar e acessar no sistema.
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={fetchPermissions} disabled={saving} className="rounded-xl font-bold h-10">
              <RefreshCw className={cn("mr-2 h-4 w-4", saving && "animate-spin")} />
              Recarregar
            </Button>
            <Button size="sm" onClick={handleSave} disabled={saving} className="rounded-xl font-bold h-10 shadow-lg shadow-primary/20">
              {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
              Salvar Alterações
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="px-0">
        <Alert className="mb-6 bg-amber-500/10 border-amber-500/20 text-amber-600 dark:text-amber-400 rounded-[2rem]">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle className="font-black text-xs uppercase tracking-widest">Atenção</AlertTitle>
          <AlertDescription className="text-xs font-semibold">
            Alterar essas configurações afeta imediatamente o Sidebar e o acesso às rotas para todos os usuários dos respectivos cargos.
            O cargo <strong>Diretor</strong> possui acesso total garantido e não pode ser alterado por segurança.
          </AlertDescription>
        </Alert>

        <div className="rounded-[2.5rem] border border-border/40 overflow-hidden bg-card shadow-sm">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-muted/50">
                <TableRow className="hover:bg-transparent border-border/40">
                  <TableHead className="w-[200px] py-6 px-8 text-xs font-black uppercase tracking-widest text-muted-foreground">Tela / Funcionalidade</TableHead>
                  {AVAILABLE_ROLES.map(role => (
                    <TableHead key={role} className="text-center py-6 px-4 text-xs font-black uppercase tracking-widest text-muted-foreground">{role}</TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {AVAILABLE_SCREENS.map((screen, idx) => (
                  <TableRow key={screen.route} className={cn("hover:bg-accent/30 transition-colors border-border/40", idx % 2 === 0 ? "bg-card" : "bg-muted/10")}>
                    <TableCell className="py-5 px-8">
                      <div className="flex flex-col">
                        <span className="font-bold text-sm text-foreground">{screen.label}</span>
                        <code className="text-[10px] text-muted-foreground/60 mt-0.5">{screen.route}</code>
                      </div>
                    </TableCell>
                    {AVAILABLE_ROLES.map(role => {
                      const isAllowed = permissions[role]?.includes(screen.route) || role === "Diretor"
                      const isDisabled = role === "Diretor"
                      
                      return (
                        <TableCell key={`${role}-${screen.route}`} className="text-center py-5 px-4">
                          <div className="flex items-center justify-center">
                            <Checkbox 
                              checked={isAllowed} 
                              disabled={isDisabled}
                              onCheckedChange={() => togglePermission(role, screen.route)}
                              className={cn(
                                "h-5 w-5 rounded-lg border-2 transition-all",
                                isAllowed ? "bg-primary border-primary shadow-sm" : "border-muted-foreground/30",
                                isDisabled && "opacity-50 cursor-not-allowed"
                              )}
                            />
                          </div>
                        </TableCell>
                      )
                    })}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
