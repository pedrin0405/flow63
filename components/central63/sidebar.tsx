"use client"

import { useState } from "react"
import { 
  LayoutDashboard, 
  Users, 
  Building2, 
  LogOut, 
  Settings, 
  HelpCircle, 
  ChevronRight, 
  ChevronLeft,
  PanelLeft,
  Briefcase,
  type LucideIcon 
} from "lucide-react"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { cn } from "@/lib/utils" // Certifique-se que você tem essa função utilitária padrão

interface SidebarItemProps {
  icon: LucideIcon
  label: string
  active: boolean
  onClick: () => void
  badge?: number
  collapsed?: boolean
}

function SidebarItem({ icon: Icon, label, active, onClick, badge, collapsed }: SidebarItemProps) {
  // O conteúdo do botão extraído para reutilização
  const buttonContent = (
    <button
      onClick={onClick}
      className={cn(
        "flex items-center rounded-xl transition-all duration-200 mb-1 group relative",
        collapsed ? "w-10 h-10 justify-center p-0 mx-auto" : "w-full justify-between px-4 py-3",
        active 
          ? "bg-primary text-primary-foreground shadow-lg shadow-primary/25" 
          : "text-muted-foreground hover:bg-accent hover:text-foreground"
      )}
    >
      <div className={cn("flex items-center", collapsed ? "justify-center" : "gap-3")}>
        {label === "Atendimentos" ? <Briefcase size={20} /> : <Icon size={20} />}
        {!collapsed && <span className="font-medium whitespace-nowrap">{label}</span>}
      </div>
      
      {!collapsed && badge && (
        <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${
          active ? "bg-primary-foreground/20 text-primary-foreground" : "bg-primary/10 text-primary"
        }`}>
          {badge}
        </span>
      )}

      {/* Badge em modo colapsado vira um ponto */}
      {collapsed && badge && (
        <span className="absolute top-0 right-0 w-2.5 h-2.5 bg-emerald-500 rounded-full border-2 border-card" />
      )}

      {!collapsed && !badge && (
        <ChevronRight size={16} className={`opacity-0 transition-opacity ${active ? "opacity-100" : "group-hover:opacity-50"}`} />
      )}
    </button>
  )

  // Se estiver colapsado, envolve em Tooltip
  if (collapsed) {
    return (
      <TooltipProvider delayDuration={0}>
        <Tooltip>
          <TooltipTrigger asChild>
            {buttonContent}
          </TooltipTrigger>
          <TooltipContent side="right" className="font-medium">
            {label} {badge ? `(${badge})` : ''}
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    )
  }

  return buttonContent
}

interface SidebarProps {
  isOpen: boolean
  onClose: () => void
  activeTab: string
  onTabChange: (tab: string) => void
}

export function Sidebar({ isOpen, onClose, activeTab, onTabChange }: SidebarProps) {
  // Estado para controlar se está minimizada no Desktop
  const [isCollapsed, setIsCollapsed] = useState(false)

  return (
    <>
      {/* Overlay Mobile (Manteve igual) */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-background/80 backdrop-blur-sm z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar Container */}
      <aside 
        className={cn(
          "fixed lg:static inset-y-0 left-0 z-50 bg-card border-r border-border transform transition-all duration-300 ease-in-out flex flex-col",
          // Lógica de largura e posição
          isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0",
          isCollapsed ? "w-[80px]" : "w-72"
        )}
      >
        {/* Botão de Toggle (Aparece apenas no Desktop) */}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="hidden lg:flex absolute -right-3 top-9 w-6 h-6 bg-card border border-border rounded-full items-center justify-center text-muted-foreground hover:text-primary transition-colors shadow-sm z-50"
        >
          {isCollapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
        </button>

        <div className="h-full flex flex-col overflow-hidden">
          {/* Logo Area */}
          <div className={cn("flex items-center transition-all duration-300", isCollapsed ? "p-4 justify-center" : "p-6 gap-4")}>
            <div className="relative flex-shrink-0">
              <div className="w-10 h-10 lg:w-12 lg:h-12 bg-gradient-to-br from-primary to-primary/60 rounded-2xl flex items-center justify-center shadow-lg shadow-primary/25">
                <Building2 className="text-primary-foreground" size={isCollapsed ? 20 : 24} />
              </div>
              <div className="absolute -bottom-1 -right-1 w-3 h-3 lg:w-4 lg:h-4 bg-emerald-500 rounded-full border-2 border-card" />
            </div>
            
            {/* Texto do Logo (some ao colapsar) */}
            <div className={cn("transition-all duration-300 overflow-hidden whitespace-nowrap", 
              isCollapsed ? "w-0 opacity-0 hidden" : "w-auto opacity-100 block"
            )}>
              <h1 className="font-bold text-xl text-foreground tracking-tight">Central63</h1>
              <p className="text-xs text-muted-foreground">Gestão Imobiliária</p>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 py-6 space-y-1 overflow-y-auto overflow-x-hidden px-3">
            {!isCollapsed && (
              <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-4 px-4 whitespace-nowrap">
                Menu Principal
              </div>
            )}
            
            <SidebarItem 
              icon={LayoutDashboard} 
              label="Dashboard" 
              active={activeTab === "dashboard"} 
              onClick={() => onTabChange("dashboard")}
              collapsed={isCollapsed}
            />
            <SidebarItem 
              icon={Users} 
              label="Atendimentos" 
              active={activeTab === "atendimentos"} 
              onClick={() => onTabChange("atendimentos")}
              badge={12}
              collapsed={isCollapsed}
            />
            <SidebarItem 
              icon={Users} 
              label="Corretores" 
              active={activeTab === "corretores"} 
              onClick={() => onTabChange("corretores")}
              collapsed={isCollapsed}
            />
            <SidebarItem 
              icon={Building2} 
              label="Imóveis" 
              active={activeTab === "imoveis"} 
              onClick={() => onTabChange("imoveis")}
              collapsed={isCollapsed}
            />
            
            {!isCollapsed && (
              <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mt-8 mb-4 px-4 whitespace-nowrap">
                Sistema
              </div>
            )}
            {/* Separador visual quando colapsado para substituir o título da seção */}
            {isCollapsed && <div className="my-4 border-t border-border mx-2" />}

            <SidebarItem 
              icon={Settings} 
              label="Configurações" 
              active={activeTab === "config"} 
              onClick={() => onTabChange("config")}
              collapsed={isCollapsed}
            />
            <SidebarItem 
              icon={HelpCircle} 
              label="Suporte" 
              active={activeTab === "suporte"} 
              onClick={() => onTabChange("suporte")}
              collapsed={isCollapsed}
            />
          </nav>

          {/* User Profile */}
          <div className="p-3 border-t border-border mt-auto">
            <div className={cn(
              "flex items-center rounded-xl bg-accent/50 mb-2 transition-all",
              isCollapsed ? "justify-center p-2 bg-transparent" : "gap-3 p-3"
            )}>
              <div className="relative flex-shrink-0">
                <div className="w-9 h-9 lg:w-10 lg:h-10 rounded-full bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center text-primary-foreground text-sm font-bold">
                  PA
                </div>
                <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 rounded-full border-2 border-card" />
              </div>
              
              {!isCollapsed && (
                <div className="flex-1 min-w-0 overflow-hidden">
                  <p className="text-sm font-semibold text-foreground truncate">Pedro Augusto</p>
                  <p className="text-xs text-muted-foreground truncate">Administrador</p>
                </div>
              )}
            </div>
            
            <TooltipProvider delayDuration={0}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button className={cn(
                    "flex items-center text-muted-foreground hover:text-destructive text-sm transition-colors rounded-lg hover:bg-destructive/10",
                    isCollapsed ? "justify-center w-full py-3" : "gap-2 px-3 py-2 w-full"
                  )}>
                    <LogOut size={18} />
                    {!isCollapsed && <span>Sair do sistema</span>}
                  </button>
                </TooltipTrigger>
                {isCollapsed && <TooltipContent side="right">Sair do sistema</TooltipContent>}
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>
      </aside>
    </>
  )
}