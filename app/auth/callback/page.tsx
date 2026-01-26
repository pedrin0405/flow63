"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { Spinner } from "@/components/ui/spinner"; // Usando seu componente existente

export default function AuthCallbackPage() {
  const router = useRouter();

  useEffect(() => {
    // O cliente do supabase detecta automaticamente o hash/query params da URL
    // e configura a sessão (localStorage)
    const { data: authListener } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (event === "SIGNED_IN" && session) {
          // Login bem-sucedido, redirecionar para o dashboard
          router.push("/");
        } else if (event === "SIGNED_OUT") {
          // Se algo der errado, volta pro login
          router.push("/login");
        }
      }
    );

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, [router]);

  return (
    <div className="flex h-screen w-full flex-col items-center justify-center space-y-4 bg-background">
      <div className="flex size-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
        <Spinner size="large" />
      </div>
      <p className="text-sm font-medium text-muted-foreground animate-pulse">
        Finalizando autenticação...
      </p>
    </div>
  );
}