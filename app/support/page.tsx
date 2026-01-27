"use client";

import React from "react";
// Corrigindo as importações para caminhos relativos para evitar erros de resolução de alias
import { Sidebar } from "../../components/central63/sidebar";
import { Card, CardContent } from "../../components/ui/card";
import { LifeBuoy } from "lucide-react";

export default function SuportePage() {
  return (
    <div className="flex min-h-screen w-full bg-muted/40">
      <Sidebar isOpen={false} onClose={function (): void {
        throw new Error("Function not implemented.");
      } } activeTab={""} onTabChange={function (tab: string): void {
        throw new Error("Function not implemented.");
      } }/>
      <div className="flex flex-col flex-1">
        <header className="flex h-14 items-center gap-4 border-b bg-background px-6 lg:h-[60px]">
          <div className="flex items-center gap-2 font-semibold">
            <LifeBuoy className="h-5 w-5 text-primary" />
            <span>Suporte e Feedback</span>
          </div>
        </header>
        <main className="flex-1 p-4 md:p-6 lg:p-8">
          <div className="mx-auto max-w-6xl h-full flex flex-col gap-6">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Como podemos ajudar?</h1>
              <p className="text-muted-foreground mt-2">
                Utilize o formulário abaixo para enviar suas dúvidas, sugestões ou relatar problemas.
              </p>
            </div>

            <Card className="flex-1 border-none shadow-md overflow-hidden bg-background">
              <CardContent className="p-0 h-full">
                {/* Incorporação do Formulário ClickUp via Iframe */}
                <iframe
                  src="https://forms.clickup.com/9013302439/f/8ckr557-2313/7PORADSZVWKFIFI3MG"
                  width="100%"
                  height="100%"
                  // style={{ border: "none", minHeight: "700px" }}
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