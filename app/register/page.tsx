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
import { cn } from "@/lib/utils";
import { Loader2, Mail, Wand2 } from "lucide-react";
import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

export default function RegisterPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [email, setEmail] = useState<string>("");

  const handleSocialRegister = async (provider: "google") => {
    setIsLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: provider,
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });
      if (error) throw error;
    } catch (error: any) {
      if (error.status === 429 || error.message?.includes("rate limit")) {
        toast.warning("Muitas tentativas. Aguarde um momento e tente novamente.");
        return;
      }
      toast.error(`Erro ao cadastrar com ${provider}`);
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleMagicLink = async (event: React.SyntheticEvent) => {
    event.preventDefault();
    if (!email) {
      toast.warning("Digite seu e-mail acima para continuar.");
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

      if (error) {
        if (error.status === 429 || error.message?.includes("rate limit")) {
          toast.warning("Muitas tentativas. Aguarde 60 segundos.");
          return;
        }
        throw error;
      }

      toast.success("Link enviado! Verifique sua caixa de entrada para criar sua conta.");
    } catch (error: any) {
      console.error("Erro Magic Link:", error);
      toast.error(error.message || "Erro ao enviar o Magic Link.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen w-full flex items-center justify-center overflow-hidden">
      {/* --- IMAGEM DE FUNDO GLOBAL --- */}
      <div className="absolute inset-0 z-0">
        <Image
          src="https://www.casa63.com.br/assets/img/home/lamevwg8.png?v=1678987906"
          alt="Imagem de fundo Casa63"
          fill
          className="object-cover"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent" />
      </div>

      {/* --- CONTEÚDO PRINCIPAL --- */}
      <div className="container relative z-10 flex-col items-center justify-center h-full md:grid lg:max-w-none lg:grid-cols-2 lg:px-0">
        {/* Coluna da Esquerda (Branding Desktop) */}
        <div className="relative hidden h-full flex-col p-10 text-white lg:flex justify-between my-auto py-20">
          <div className="relative z-20 flex items-center text-lg font-medium">
          </div>
          <div className="relative z-20">
            <blockquote className="space-y-2">
              <div className="relative z-20 flex items-center text-lg font-medium">
                <div className="mr-2 flex size-10 items-center justify-center rounded-xl border shadow-lg shadow-primary/20 backdrop-blur-sm overflow-hidden">
                  <Image 
                    src="/icon.svg" 
                    alt="Logo Central63" 
                    width={24} 
                    height={24} 
                    className="priority"
                  />
                </div>
                Central63
              </div>
              <p className="text-lg drop-shadow-md font-medium">
                &ldquo;Junte-se a nós e transforme a maneira como gerencia seus imóveis.
                Crie sua conta para começar.&rdquo;
              </p>
            </blockquote>
          </div>
        </div>

        {/* Coluna da Direita (Container do Form) */}
        <div className="p-4 lg:p-8 h-full flex items-center justify-center">
          <div className="mx-auto w-full max-w-[400px]">
            {/* Branding Mobile */}
            <div className="flex flex-col items-center space-y-2 text-center lg:hidden mb-6 text-white drop-shadow-md">
              <div className="flex size-12 items-center justify-center rounded-xl bg-primary shadow-lg shadow-primary/20">
                <span className="text-xl font-bold text-white">63</span>
              </div>
              <span className="text-xl font-bold">Central63</span>
            </div>

            <Card className="border-0 shadow-2xl sm:rounded-3xl bg-white/60 dark:bg-black/60 backdrop-blur-xl ring-1 ring-white/30 dark:ring-white/10">
              <CardHeader className="space-y-1 pb-6 text-center">
                <CardTitle className="text-xl font-semibold tracking-tight">
                  Crie sua conta
                </CardTitle>
                <CardDescription className="text-muted-foreground/80">
                  Insira seu e-mail ou use uma rede social para se cadastrar.
                </CardDescription>
              </CardHeader>

              <CardContent className="grid gap-6">
                <form onSubmit={handleMagicLink}>
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
                          className="pl-10 bg-white/40 dark:bg-zinc-900/40 border-white/20 focus-visible:ring-primary/50"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                        />
                      </div>
                    </div>
                    <Button disabled={isLoading} className="w-full shadow-md py-5 rounded-xl text-base font-medium gap-2">
                      {isLoading ? (
                        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      ) : (
                        <Wand2 className="h-4 w-4" />
                      )}
                      Cadastrar com E-mail
                    </Button>
                  </div>
                </form>

                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t border-white/20" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="px-2 text-muted-foreground bg-transparent font-medium dark:bg-black/60 bg-white/60 rounded backdrop-blur">
                      Ou cadastre-se com
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-3">
                  <Button
                    variant="outline"
                    type="button"
                    disabled={isLoading}
                    onClick={() => handleSocialRegister("google")}
                    className="w-full gap-2 bg-white/40 dark:bg-zinc-900/40 border-white/20 hover:bg-white/60 dark:hover:bg-zinc-800/60 py-5 rounded-xl text-base font-medium"
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

                <div className="mt-4 text-center text-sm">
                  Já tem uma conta?{" "}
                  <Link href="/login" className="underline underline-offset-4 hover:text-primary font-medium">
                    Faça login
                  </Link>
                </div>
              </CardContent>

              <CardFooter className="flex justify-center pb-6">
                <p className="px-8 text-center text-xs text-muted-foreground/80">
                  Ao clicar em continuar, você concorda com nossos{" "}
                  <Link
                    href="/terms"
                    className="underline underline-offset-4 hover:text-primary font-medium"
                  >
                    Termos
                  </Link>{" "}
                  e{" "}
                  <Link
                    href="/privacy"
                    className="underline underline-offset-4 hover:text-primary font-medium"
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
    </div>
  );
}
