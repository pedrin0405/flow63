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
} from "@/components/ui/card"; // Importando os componentes do Card
import { cn } from "@/lib/utils";
import { Loader2, LockKeyhole, Mail, Wand2 } from "lucide-react";
import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";

export default function LoginPage() {
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [email, setEmail] = useState<string>("");

  // Login tradicional (Senha)
  async function onSubmit(event: React.SyntheticEvent) {
    event.preventDefault();
    setIsLoading(true);

    setTimeout(() => {
      setIsLoading(false);
      toast.info("Login com senha simulado.");
    }, 2000);
  }

  // Login Social (Google)
  const handleSocialLogin = async (provider: "google") => {
    setIsLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: provider,
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });
      if (error) throw error;
    } catch (error) {
      toast.error(`Erro ao logar com ${provider}`);
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  // Login via Magic Link (OTP)
  const handleMagicLink = async () => {
    if (!email) {
      toast.warning("Digite seu e-mail acima para usar o Magic Link.");
      document.getElementById("email")?.focus();
      return;
    }

    setIsLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOtp({
        email: email,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (error) throw error;

      toast.success("Link enviado! Verifique sua caixa de entrada.");
    } catch (error) {
      console.error("Erro Magic Link:", error);
      toast.error("Erro ao enviar o Magic Link.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container relative min-h-screen flex-col items-center justify-center md:grid lg:max-w-none lg:grid-cols-2 lg:px-0">
      
      {/* Coluna da Esquerda (Apenas Desktop) */}
      <div className="relative hidden h-full flex-col bg-muted p-10 text-white dark:border-r lg:flex">
        <div className="absolute inset-0 overflow-hidden">
          <Image
            src="https://www.casa63.com.br/assets/img/home/lamevwg8.png?v=1678987906"
            alt="Imagem de fundo Casa63"
            fill
            className="object-cover"
            priority
          />
          {/* Gradiente: escuro embaixo, transparente em cima */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
        </div>

        <div className="relative z-20 flex items-center text-lg font-medium">
          <div className="mr-2 flex size-10 items-center justify-center rounded-xl bg-primary shadow-lg shadow-primary/20">
            <span className="text-xl font-bold text-primary-foreground">
              63
            </span>
          </div>
          Central63
        </div>
        <div className="relative z-20 mt-auto">
          <blockquote className="space-y-2">
            <p className="text-lg">
              &ldquo;Esta plataforma transformou a maneira como gerenciamos nossos
              imóveis. A eficiência e a clareza que ela proporciona são
              incomparáveis.&rdquo;
            </p>
            <footer className="text-sm">Sofia Davis</footer>
          </blockquote>
        </div>
      </div>

      {/* Coluna da Direita (Formulário) */}
      {/* Adicionei 'bg-gray-50/50' para dar contraste com o card branco */}
      <div className="p-4 lg:p-8 h-full flex items-center justify-center bg-gray-50/50 dark:bg-zinc-900">
        <div className="mx-auto w-full max-w-[400px]">
          
          {/* Branding Mobile (fora do card para limpar o visual interno) */}
          <div className="flex flex-col items-center space-y-2 text-center lg:hidden mb-6">
            <div className="flex size-12 items-center justify-center rounded-xl bg-primary shadow-lg shadow-primary/20">
              <span className="text-xl font-bold text-primary-foreground">
                63
              </span>
            </div>
            <span className="text-xl font-bold">Central63</span>
          </div>

          {/* O CARD SOLICITADO */}
          <Card className="border-0 bg-white shadow-xl sm:rounded-2xl dark:bg-zinc-950 dark:border-zinc-800">
            <CardHeader className="space-y-1 pb-6 text-center">
              <CardTitle className="text-xl font-semibold tracking-tight">
                Bem-vindo de volta
              </CardTitle>
              <CardDescription>
                Insira seus dados para acessar o painel.
              </CardDescription>
            </CardHeader>

            <CardContent className="grid gap-6">
              <form onSubmit={onSubmit}>
                <div className="grid gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="email">E-mail</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-2.5 size-4 text-muted-foreground" />
                      <Input
                        id="email"
                        placeholder="nome@exemplo.com"
                        type="email"
                        autoCapitalize="none"
                        autoComplete="email"
                        autoCorrect="off"
                        disabled={isLoading}
                        className="pl-10"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="grid gap-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="password">Senha</Label>
                      <Link
                        href="/forgot-password"
                        className="text-xs text-muted-foreground underline-offset-4 hover:underline"
                      >
                        Esqueceu?
                      </Link>
                    </div>
                    <div className="relative">
                      <LockKeyhole className="absolute left-3 top-2.5 size-4 text-muted-foreground" />
                      <Input
                        id="password"
                        type="password"
                        autoCapitalize="none"
                        autoComplete="current-password"
                        disabled={isLoading}
                        className="pl-10"
                      />
                    </div>
                  </div>
                  <Button disabled={isLoading} className="w-full">
                    {isLoading && (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    )}
                    Acessar Plataforma
                  </Button>
                </div>
              </form>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-white px-2 text-muted-foreground dark:bg-zinc-950">
                    Ou continuar com
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <Button
                  variant="outline"
                  type="button"
                  disabled={isLoading}
                  onClick={handleMagicLink}
                  className="w-full gap-2"
                >
                  {isLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Wand2 className="h-4 w-4" />
                  )}
                  Magic Link
                </Button>
                <Button
                  variant="outline"
                  type="button"
                  disabled={isLoading}
                  onClick={() => handleSocialLogin("google")}
                  className="w-full gap-2"
                >
                  {isLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <svg
                      className="h-4 w-4"
                      aria-hidden="true"
                      focusable="false"
                      data-prefix="fab"
                      data-icon="google"
                      role="img"
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 488 512"
                    >
                      <path
                        fill="currentColor"
                        d="M488 261.8C488 403.3 391.1 504 248 504 110.8 504 0 393.2 0 256S110.8 8 248 8c66.8 0 123 24.5 166.3 64.9l-67.5 64.9C258.5 52.6 94.3 116.6 94.3 256c0 86.5 69.1 156.6 153.7 156.6 98.2 0 135-70.4 140.8-106.9H248v-85.3h236.1c2.3 12.7 3.9 24.9 3.9 41.4z"
                      ></path>
                    </svg>
                  )}
                  Google
                </Button>
              </div>
            </CardContent>

            <CardFooter className="flex justify-center pb-6">
              <p className="px-8 text-center text-xs text-muted-foreground">
                Ao clicar em continuar, você concorda com nossos{" "}
                <Link
                  href="/terms"
                  className="underline underline-offset-4 hover:text-primary"
                >
                  Termos
                </Link>{" "}
                e{" "}
                <Link
                  href="/privacy"
                  className="underline underline-offset-4 hover:text-primary"
                >
                  Privacidade
                </Link>
                .
              </p>
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  );
}