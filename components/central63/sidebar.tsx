"use client"

import { LayoutDashboard, Users, Building2, LogOut, Settings, HelpCircle, ChevronRight, type LucideIcon } from "lucide-react"

interface SidebarItemProps {
  icon: LucideIcon
  label: string
  active: boolean
  onClick: () => void
  badge?: number
}

function SidebarItem({ icon: Icon, label, active, onClick, badge }: SidebarItemProps) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all duration-200 mb-1 group ${
        active 
          ? "bg-primary text-primary-foreground shadow-lg shadow-primary/25" 
          : "text-muted-foreground hover:bg-accent hover:text-foreground"
      }`}
    >
      <div className="flex items-center gap-3">
        <Icon size={20} />
        <span className="font-medium">{label}</span>
      </div>
      {badge && (
        <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${
          active ? "bg-primary-foreground/20 text-primary-foreground" : "bg-primary/10 text-primary"
        }`}>
          {badge}
        </span>
      )}
      {!badge && (
        <ChevronRight size={16} className={`opacity-0 transition-opacity ${active ? "opacity-100" : "group-hover:opacity-50"}`} />
      )}
    </button>
  )
}

interface SidebarProps {
  isOpen: boolean
  onClose: () => void
  activeTab: string
  onTabChange: (tab: string) => void
}

export function Sidebar({ isOpen, onClose, activeTab, onTabChange }: SidebarProps) {
  return (
    <>
      {/* Overlay Mobile */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-background/80 backdrop-blur-sm z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed lg:static inset-y-0 left-0 z-50 w-72 bg-card border-r border-border transform transition-transform duration-300 ease-out
        ${isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
      `}>
        <div className="h-full flex flex-col">
          {/* Logo */}
          <div className="p-6 flex items-center gap-4">
            <div className="relative">
              <div className="w-12 h-12 bg-gradient-to-br from-primary to-primary/60 rounded-2xl flex items-center justify-center shadow-lg shadow-primary/25">
                <Building2 className="text-primary-foreground" size={24} />
              </div>
              <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-500 rounded-full border-2 border-card" />
            </div>
            <div>
              <h1 className="font-bold text-xl text-foreground tracking-tight">Central63</h1>
              <p className="text-xs text-muted-foreground">Gestão Imobiliária</p>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
            <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-4 px-4">
              Menu Principal
            </div>
            <SidebarItem 
              icon={LayoutDashboard} 
              label="Dashboard" 
              active={activeTab === "dashboard"} 
              onClick={() => onTabChange("dashboard")} 
            />
            <SidebarItem 
              icon={Users} 
              label="Atendimentos" 
              active={activeTab === "atendimentos"} 
              onClick={() => onTabChange("atendimentos")}
              badge={12}
            />
            <SidebarItem 
              icon={Building2} 
              label="Imóveis" 
              active={activeTab === "imoveis"} 
              onClick={() => onTabChange("imoveis")} 
            />
            
            <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mt-8 mb-4 px-4">
              Sistema
            </div>
            <SidebarItem 
              icon={Settings} 
              label="Configurações" 
              active={activeTab === "config"} 
              onClick={() => onTabChange("config")} 
            />
            <SidebarItem 
              icon={HelpCircle} 
              label="Suporte" 
              active={activeTab === "suporte"} 
              onClick={() => onTabChange("suporte")} 
            />
          </nav>

          {/* User Profile */}
          <div className="p-4 border-t border-border">
            <div className="flex items-center gap-3 p-3 rounded-xl bg-accent/50 mb-3">
              <div className="relative">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center text-primary-foreground text-sm font-bold">
                  PA
                </div>
                <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 rounded-full border-2 border-card" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-foreground truncate">Pedro Augusto</p>
                <p className="text-xs text-muted-foreground truncate">Administrador</p>
              </div>
            </div>
            <button className="flex items-center gap-2 text-muted-foreground hover:text-destructive text-sm px-3 py-2 w-full transition-colors rounded-lg hover:bg-destructive/10">
              <LogOut size={16} />
              <span>Sair do sistema</span>
            </button>
          </div>
        </div>
      </aside>
    </>
  )
}
