import React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { LockKeyhole, Mail } from "lucide-react"; // Sugestão de ícones

export default function LoginPage() {
  return (
    // Fundo com um leve gradiente usando suas cores de background e muted
    <div className="flex min-h-screen items-center justify-center bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-muted/50 via-background to-background px-4">
      <div className="w-full max-w-md space-y-8">
        {/* Branding fora do card para um visual mais limpo */}
        <div className="flex flex-col items-center space-y-2 text-center">
          <div className="flex size-14 items-center justify-center rounded-2xl bg-primary shadow-lg shadow-primary/20 transition-transform hover:scale-105">
            <span className="text-2xl font-bold text-primary-foreground">63</span>
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Central63</h1>
        </div>

        <Card className="border-border/50 bg-card/50 backdrop-blur-sm shadow-xl">
          <CardHeader className="space-y-1">
            <CardTitle className="text-xl">Bem-vindo de volta</CardTitle>
            <CardDescription>
              Insira seus dados para acessar o painel de gestão.
            </CardDescription>
          </CardHeader>
          
          <CardContent className="grid gap-6">
            <div className="grid gap-2">
              <Label htmlFor="email" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">E-mail</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-2.5 size-4 text-muted-foreground" />
                <Input 
                  id="email" 
                  type="email" 
                  placeholder="seu@email.com" 
                  className="pl-10 focus-visible:ring-primary/30" 
                  required 
                />
              </div>
            </div>

            <div className="grid gap-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Senha</Label>
                <Button variant="link" className="h-auto p-0 text-xs font-normal" size="sm">
                  Esqueceu a senha?
                </Button>
              </div>
              <div className="relative">
                <LockKeyhole className="absolute left-3 top-2.5 size-4 text-muted-foreground" />
                <Input 
                  id="password" 
                  type="password" 
                  className="pl-10 focus-visible:ring-primary/30"
                  required 
                />
              </div>
            </div>
          </CardContent>

          <CardFooter className="flex flex-col gap-4">
            <Button className="w-full shadow-md transition-all hover:shadow-lg active:scale-[0.98]" size="lg">
              Acessar Plataforma
            </Button>
            <div className="relative w-full">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-border" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-card px-2 text-muted-foreground">Exclusivo para Gestão</span>
              </div>
            </div>
          </CardFooter>
        </Card>

        <p className="text-center text-xs text-muted-foreground">
          © 2026 Central63 - Gestão Imobiliária Inteligente
        </p>
      </div>
    </div>
  );
}