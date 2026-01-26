"use client";

import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Loader2, Mail, ArrowLeft, CheckCircle2 } from "lucide-react";
import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";

export default function ForgotPasswordPage() {
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isSubmitted, setIsSubmitted] = useState<boolean>(false);
  const [email, setEmail] = useState<string>("");

  async function onSubmit(event: React.SyntheticEvent) {
    event.preventDefault();
    setIsLoading(true);

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/callback?next=/update-password`,
      });

      if (error) {
        if (error.status === 429 || error.message?.includes("rate limit")) {
          toast.warning("Muitas tentativas. Aguarde 60 segundos.");
          return;
        }
        throw error;
      }

      setIsSubmitted(true);
      toast.success("E-mail de recuperação enviado!");
    } catch (error: any) {
      console.error(error);
      toast.error(error.message || "Erro ao enviar e-mail. Tente novamente.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="relative min-h-screen w-full flex items-center justify-center overflow-hidden">
      
      {/* --- IMAGEM DE FUNDO GLOBAL (Igual ao Login) --- */}
      <div className="absolute inset-0 z-0">
          <Image
            src="https://www.casa63.com.br/assets/img/home/lamevwg8.png?v=1678987906"
            alt="Imagem de fundo Casa63"
            fill
            className="object-cover"
            priority
          />
          {/* Gradiente escuro para garantir leitura */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent" />
      </div>

      {/* --- CONTEÚDO PRINCIPAL --- */}
      <div className="container relative z-10 flex-col items-center justify-center h-full md:grid lg:max-w-none lg:grid-cols-2 lg:px-0">

        {/* Coluna da Esquerda (Branding Desktop - Igual ao Login) */}
        <div className="relative hidden h-full flex-col p-10 text-white lg:flex justify-between my-auto py-20">
          <div className="relative z-20 flex items-center text-lg font-medium">
            <div className="mr-2 flex size-10 items-center justify-center rounded-xl bg-primary/90 shadow-lg shadow-primary/20 backdrop-blur-sm">
              <span className="text-xl font-bold text-white">
                63
              </span>
            </div>
            Central63
          </div>
          <div className="relative z-20">
            <blockquote className="space-y-2">
              <p className="text-lg drop-shadow-md font-medium">
                &ldquo;Segurança e agilidade são os pilares da nossa gestão imobiliária. 
                Recupere seu acesso e continue transformando seus resultados.&rdquo;
              </p>
              <footer className="text-sm drop-shadow-md opacity-80">Central63 Security</footer>
            </blockquote>
          </div>
        </div>

        {/* Coluna da Direita (Container do Form) */}
        <div className="p-4 lg:p-8 h-full flex items-center justify-center">
          <div className="mx-auto w-full max-w-[400px]">
            
            {/* Branding Mobile */}
            <div className="flex flex-col items-center space-y-2 text-center lg:hidden mb-6 text-white drop-shadow-md">
              <div className="flex size-12 items-center justify-center rounded-xl bg-primary shadow-lg shadow-primary/20">
                <span className="text-xl font-bold text-white">
                  63
                </span>
              </div>
              <span className="text-xl font-bold">Central63</span>
            </div>

            {/* CARD COM EFEITO VIDRO (Mesmas classes do Login) */}
            <Card className="border-0 shadow-2xl sm:rounded-3xl bg-white/60 dark:bg-black/60 backdrop-blur-xl ring-1 ring-white/30 dark:ring-white/10">
              <CardHeader className="space-y-1 pb-6 text-center">
                <CardTitle className="text-xl font-semibold tracking-tight">
                  {isSubmitted ? "Verifique seu e-mail" : "Recuperar senha"}
                </CardTitle>
                <CardDescription className="text-muted-foreground/80">
                  {isSubmitted
                    ? "Enviamos um link de recuperação para o seu endereço de e-mail."
                    : "Insira seu e-mail para receber as instruções de redefinição."}
                </CardDescription>
              </CardHeader>

              <CardContent className="grid gap-6">
                {isSubmitted ? (
                  <div className="flex flex-col items-center gap-6 py-4">
                    {/* Ícone de Sucesso estilizado para o vidro */}
                    <div className="flex h-20 w-20 items-center justify-center rounded-full bg-green-500/20 text-green-700 dark:text-green-400 ring-1 ring-green-500/30 backdrop-blur-sm">
                      <CheckCircle2 className="h-10 w-10" />
                    </div>
                    <p className="text-center text-sm font-medium text-muted-foreground">
                      Caso não encontre o e-mail, verifique sua caixa de spam ou lixo eletrônico.
                    </p>
                    <Button 
                      variant="outline" 
                      onClick={() => setIsSubmitted(false)}
                      className="w-full bg-white/40 dark:bg-zinc-900/40 border-white/20 hover:bg-white/60"
                    >
                      Tentar outro e-mail
                    </Button>
                  </div>
                ) : (
                  <form onSubmit={onSubmit}>
                    <div className="grid gap-4">
                      <div className="grid gap-2">
                        <Label htmlFor="email">E-mail</Label>
                        <div className="relative">
                          <Mail className="absolute left-3 top-2.5 size-4 text-muted-foreground" />
                          {/* Input Translúcido (Igual ao Login) */}
                          <Input
                            id="email"
                            placeholder="nome@exemplo.com"
                            type="email"
                            autoCapitalize="none"
                            autoComplete="email"
                            autoCorrect="off"
                            disabled={isLoading}
                            className="pl-10 bg-white/40 dark:bg-zinc-900/40 border-white/20 focus-visible:ring-primary/50"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                          />
                        </div>
                      </div>
                      {/* Botão (Igual ao Login) */}
                      <Button disabled={isLoading} className="w-full shadow-md py-5 rounded-xl text-base font-medium">
                        {isLoading && (
                          <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                        )}
                        Enviar link de recuperação
                      </Button>
                    </div>
                  </form>
                )}
              </CardContent>

              <CardFooter className="flex justify-center pb-6">
                <Link
                  href="/login"
                  className="flex items-center text-sm font-medium text-muted-foreground/80 hover:text-primary transition-colors underline-offset-4 hover:underline"
                >
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Voltar para o login
                </Link>
              </CardFooter>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}