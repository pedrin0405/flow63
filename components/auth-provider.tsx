"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
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

  useEffect(() => {
    // 1. Pega sessão inicial
    const getInitialSession = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      setSession(session);
      if (session) await fetchProfile(session.user.id);
      setLoading(false);
    };

    getInitialSession();

    // 2. Escuta mudanças (Login, Logout, Auto-refresh)
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setSession(session);
      if (session) {
        await fetchProfile(session.user.id);
      } else {
        setProfile(null);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .single();

      if (!error && data) {
        setProfile(data);
      }
    } catch (error) {
      console.error("Erro ao buscar perfil:", error);
    }
  };

  const signOut = async () => {
    try {
        // 1. Limpa a sessão no Supabase
        await supabase.auth.signOut();
        
        // 2. Limpa os estados locais explicitamente
        setSession(null);
        setProfile(null);

        // 3. Força o redirecionamento e limpa o cache de rotas do Next.js
        router.push("/login");
        router.refresh(); 
    } catch (error) {
        console.error("Erro ao sair:", error);
        // Mesmo com erro, mandamos para o login por segurança
        router.push("/login");
    }
    };

  return (
    <AuthContext.Provider value={{ session, profile, loading, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);