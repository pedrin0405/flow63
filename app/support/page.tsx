"use client";
import { useState } from "react";

// Importações mantidas conforme seu código
import { Sidebar } from "../../components/central63/sidebar";
import { Card, CardContent } from "../../components/ui/card";
import { LifeBuoy, Menu } from "lucide-react";

export default function SuportePage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("suporte");

  return (
    // Adicionado h-screen e overflow-hidden para layout fixo de dashboard
    <div className="flex h-screen w-full bg-muted/40 overflow-hidden">
      
      {/* CORREÇÃO AQUI: Conectando as props aos estados reais */}
      <Sidebar 
        isOpen={sidebarOpen} 
        onClose={() => setSidebarOpen(false)} 
        activeTab={activeTab} 
        onTabChange={(tab) => {
          setActiveTab(tab);
          setSidebarOpen(false); // Fecha no mobile ao clicar
        }} 
      />

      <div className="flex flex-col flex-1 min-w-0">
        <header className="w-full bg-card border-b border-border px-6 py-4 flex items-center justify-between shadow-sm flex-shrink-0 z-20">
          <div className="flex items-center gap-4">
            <button 
              className="lg:hidden p-2 text-muted-foreground hover:bg-accent rounded-lg" 
              onClick={() => setSidebarOpen(true)}
            >
              <Menu />
            </button>
            <LifeBuoy className="text-primary hidden sm:block" />
            <h2 className="text-2xl font-bold text-foreground tracking-tight">Suporte e Feedback</h2>
          </div>
        </header>

        {/* Adicionado overflow-y-auto para o conteúdo rolar independentemente da sidebar */}
        <main className="flex-1 p-4 md:p-6 lg:p-8 overflow-y-auto">
          <div className="mx-auto max-w-6xl h-full flex flex-col gap-6">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Como podemos ajudar?</h1>
              <p className="text-muted-foreground mt-2">
                Utilize o formulário abaixo para enviar suas dúvidas, sugestões ou relatar problemas.
              </p>
            </div>

            {/* Ajustado min-height para garantir visibilidade do formulário */}
            <Card className="flex-1 border-none shadow-md overflow-hidden bg-background min-h-[600px]">
              <CardContent className="p-0 h-full">
                <iframe
                  src="https://forms.clickup.com/9013302439/f/8ckr557-2313/7PORADSZVWKFIFI3MG"
                  width="100%"
                  height="100%"
                  style={{ border: "none" }}
                  title="Formulário de Suporte Central 63"
                  className="rounded-lg"
                  allow="camera; microphone; geolocation"
                />
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </div>
  );
}