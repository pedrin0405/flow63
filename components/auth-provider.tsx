"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase-client";
import { useRouter } from "next/navigation";

const AuthContext = createContext<any>({});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const supabase = getSupabaseBrowserClient();

  useEffect(() => {
    // Busca inicial silenciosa
    const initAuth = async () => {
      const { data: { session: initial } } = await supabase.auth.getSession();
      setSession(initial);
      setLoading(false);
      console.log("[Auth] Sessão carregada:", !!initial);
    };

    initAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, currentSession) => {
      console.log(`[Auth Event] ${event}`);
      setSession(currentSession);
      
      if (event === 'SIGNED_IN' || event === 'SIGNED_OUT') {
        router.refresh(); // Força o servidor a ler os novos cookies
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, [router, supabase]);

  return (
    <AuthContext.Provider value={{ session, loading }}>
      {!loading ? children : (
        <div className="flex h-screen items-center justify-center bg-black text-white">
          <p className="animate-pulse">Carregando autenticação...</p>
        </div>
      )}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);