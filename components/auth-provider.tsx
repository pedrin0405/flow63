"use client";

import { createContext, SetStateAction, useContext, useEffect, useState } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase-client"; // Importa o cliente unificado
import { useRouter } from "next/navigation";
import { Session } from "@supabase/supabase-js";

type Profile = {
  id: string;
  email: string | null;
  full_name: string | null;
  avatar_url: string | null;
  role: string | null;
};

type AuthContextType = {
  session: Session | null;
  profile: Profile | null;
  loading: boolean;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType>({
  session: null,
  profile: null,
  loading: true,
  signOut: async () => {},
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const supabase = getSupabaseBrowserClient(); // Usa a instância Singleton para evitar conflitos

  useEffect(() => {
    // 1. Pega sessão inicial de forma segura
    const getInitialSession = async () => {
      try {
        const { data: { session: initialSession } } = await supabase.auth.getSession();
        setSession(initialSession);
        
        if (initialSession) {
          await fetchProfile(initialSession.user.id, initialSession.user.email);
        }
      } catch (error) {
        console.error("Erro ao carregar sessão inicial:", error);
      } finally {
        setLoading(false);
      }
    };

    getInitialSession();

    // 2. Escuta mudanças (Login, Logout, Auto-refresh)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event: string, currentSession: Session | null) => {
      setSession(currentSession);
      
      if (currentSession) {
        await fetchProfile(currentSession.user.id, currentSession.user.email);
      } else {  
        setProfile(null);
      }
      
      // Se houver mudança de estado (ex: login/logout), atualiza o servidor para o Middleware agir
      if (event === 'SIGNED_IN' || event === 'SIGNED_OUT') {
        router.refresh();
      }
      
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, [router, supabase]);

  const fetchProfile = async (userId: string, email?: string) => {
    try {
      // Tenta buscar o perfil existente
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .single();

      // Se o perfil não existir (código de erro do PostgREST para 'no rows found')
      if (error && (error.code === 'PGRST116' || error.message.includes("JSON object requested, but 0 rows were returned"))) {
        console.log("Perfil não encontrado, criando novo registro...");
        
        const { data: newProfile, error: createError } = await supabase
          .from("profiles")
          .insert([
            { 
              id: userId, 
              email: email || null,
              full_name: "", // Valores padrão
              avatar_url: "" 
            }
          ])
          .select()
          .single();

        if (!createError && newProfile) {
          setProfile(newProfile);
        } else {
          console.error("Erro ao criar perfil automático:", createError);
        }
      } else if (!error && data) {
        setProfile(data);
      }
    } catch (error) {
      console.error("Erro na gestão de perfil:", error);
    }
  };

  const signOut = async () => {
    try {
        setLoading(true);
        await supabase.auth.signOut();
        
        setSession(null);
        setProfile(null);

        // Limpa o cache de rotas e redireciona
        router.refresh();
        router.push("/login");
    } catch (error) {
        console.error("Erro ao sair:", error);
        window.location.href = "/login"; // Redirecionamento forçado em caso de erro crítico
    } finally {
        setLoading(false);
    }
  };

  return (
    <AuthContext.Provider value={{ session, profile, loading, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);