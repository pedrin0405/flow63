"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { Sidebar } from "@/components/central63/sidebar";
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Card, CardContent } from "@/components/ui/card";
import { UnitSettingsDialog } from "@/components/central63/unit-settings-dialog";
import { Building, Building2, User, ShieldCheck,Menu, LayoutDashboard, MapPin } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import DashboardPage from "../page";

export default function UnitsPage() {
  const [units, setUnits] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [activeTab, setActiveTab] = useState("dashboard");

  useEffect(() => {
    async function fetchUnits() {
      try {
        const { data, error } = await supabase
          .from("unidades")
          .select("*")
          .order("codigo", { ascending: true });
        
        if (error) {
          console.error("DEBUG-ERROR [Terminal]:", error.message);
        } else {
          console.log(`DEBUG [Terminal]: ${data?.length || 0} unidades carregadas.`);
          setUnits(data || []);
        }
      } catch (err) {
        console.error("DEBUG-ERROR [Terminal]: Erro de rede:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchUnits();
  }, []);


  return (
    <SidebarProvider>
      <Sidebar 
        isOpen={sidebarOpen} 
        onClose={() => setSidebarOpen(false)} 
        activeTab={activeTab} // Use a variável de estado aqui
        onTabChange={(tab: string) => {
          setActiveTab(tab); // Atualiza a aba ativa quando clicar
          setSidebarOpen(false); // Fecha a sidebar no mobile após o clique
        }}/>
      <SidebarInset>
        {/* <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 h-4" />
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink href="/">Dashboard</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage>Gestão de Unidades</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </header> */}

        <header className="w-full bg-card border-b border-border px-6 py-4 flex items-center justify-between shadow-sm flex-shrink-0 z-20">
            <div className="flex items-center gap-4">
              <button className="lg:hidden p-2 text-muted-foreground hover:bg-accent rounded-lg" onClick={() => setSidebarOpen(true)}><Menu /></button>
              <Building className="text-primary hidden sm:block" />
              <h2 className="text-2xl font-bold text-foreground tracking-tight">Unidades</h2>
            </div>
        </header>

        <main className="flex flex-1 flex-col gap-6 p-4 md:p-6 bg-slate-50/50 dark:bg-transparent overflow-x-hidden">

          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
              {[1, 2, 3, 4].map((i) => (
                <Skeleton key={i} className="h-[280px] md:h-[320px] w-full rounded-2xl" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
              {units.length === 0 ? (
                <div className="col-span-full py-20 text-center border-2 border-dashed rounded-2xl bg-muted/20 px-4">
                  <Building2 className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                  <p className="text-xl font-semibold">Nenhuma unidade encontrada</p>
                  <p className="text-muted-foreground">Verifique a tabela 'unidades' no seu Supabase.</p>
                </div>
              ) : (
                units.map((unit) => (
                  <UnitSettingsDialog key={unit.id || unit.codigo} unit={unit}>
                    <Card className="group relative overflow-hidden rounded-2xl border-none shadow-lg hover:shadow-xl transition-all cursor-pointer h-[280px] md:h-[340px]">
                      {/* Background Image / Placeholder */}
                      <div className="absolute inset-0 z-0">
                        <img 
                          src={unit.imagem_url || "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?q=80&w=800"} 
                          alt={unit.nome_unidade}
                          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/40 to-transparent" />
                      </div>

                      {/* Content Overlay */}
                      <div className="relative z-10 flex flex-col justify-end h-full p-4 md:p-6 text-white">
                        {/*<div className="flex items-center gap-2 mb-1">
                          <MapPin className="h-3 w-3 md:h-4 md:w-4 text-primary" />
                          <span className="text-[10px] md:text-xs font-bold uppercase tracking-wider text-primary-foreground/80">Unidade Operacional</span>
                        </div>*/}
                        <h2 className="text-xl md:text-2xl font-black mb-3 md:mb-4 line-clamp-1">
                          {unit.nome_unidade || unit.unidade || unit.nome || "Unidade Central"}
                        </h2>
                        
                        <div className="grid grid-cols-1 gap-2">
                          <div className="flex items-center gap-2 text-[10px] md:text-xs bg-white/10 backdrop-blur-md p-1.5 md:p-2 rounded-lg border border-white/10 hover:bg-white/20 transition-colors">
                            <Building2 className="h-3 w-3 md:h-4 md:w-4 text-blue-400 shrink-0" />
                            <span className="opacity-70">Captação:</span>
                            <span className="font-bold truncate">{unit.dest_captacao || "Livre"}</span>
                          </div>
                          <div className="flex items-center gap-2 text-[10px] md:text-xs bg-white/10 backdrop-blur-md p-1.5 md:p-2 rounded-lg border border-white/10 hover:bg-white/20 transition-colors">
                            <User className="h-3 w-3 md:h-4 md:w-4 text-green-400 shrink-0" />
                            <span className="opacity-70">Corretor:</span>
                            <span className="font-bold truncate">{unit.dest_corretor || "Livre"}</span>
                          </div>
                          <div className="flex items-center gap-2 text-[10px] md:text-xs bg-white/10 backdrop-blur-md p-1.5 md:p-2 rounded-lg border border-white/10 hover:bg-white/20 transition-colors">
                            <LayoutDashboard className="h-3 w-3 md:h-4 md:w-4 text-purple-400 shrink-0" />
                            <span className="opacity-70">CRM:</span>
                            <span className="font-bold truncate">{unit.dest_crm || "Livre"}</span>
                          </div>
                        </div>
                      </div>
                    </Card>
                  </UnitSettingsDialog>
                ))
              )}
            </div>
          )}
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}