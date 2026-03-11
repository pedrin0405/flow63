"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { LogOut, ShieldAlert, Clock, CheckCircle2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";

export default function PendingAuthPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => setUser(user));
  }, []);

  const handleCheckStatus = () => {
    router.refresh();
    setTimeout(() => {
      window.location.href = "/";
    }, 500);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  return (
    <div className="min-h-screen bg-[#F8F9FC] dark:bg-black flex items-center justify-center p-6 font-sans">
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-md w-full bg-white dark:bg-zinc-900 rounded-[2.5rem] p-10 shadow-2xl border border-black/5 dark:border-white/5 text-center space-y-8"
      >
        <div className="relative mx-auto w-24 h-24">
          <div className="absolute inset-0 bg-blue-500/20 blur-2xl rounded-full animate-pulse" />
          <div className="relative w-full h-full bg-white dark:bg-zinc-800 rounded-3xl border border-blue-500/20 flex items-center justify-center shadow-xl">
            <Clock size={40} className="text-blue-500" />
          </div>
        </div>

        <div className="space-y-3">
          <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white uppercase">Acesso Pendente</h1>
          <p className="text-slate-500 dark:text-zinc-400 text-sm leading-relaxed">
            Olá <span className="font-bold text-blue-500">{user?.user_metadata?.full_name || user?.email?.split('@')[0]}</span>, 
            identificamos que sua conta ainda não possui autorização para acessar a plataforma Central63.
          </p>
        </div>

        <div className="bg-blue-50 dark:bg-blue-500/5 p-6 rounded-3xl border border-blue-100 dark:border-blue-500/10 text-left space-y-4">
          <div className="flex items-start gap-3">
            <CheckCircle2 size={18} className="text-blue-500 shrink-0 mt-0.5" />
            <p className="text-[11px] font-bold text-slate-600 dark:text-zinc-300 uppercase tracking-wider">
              Solicitação Enviada
            </p>
          </div>
          <p className="text-xs text-slate-500 dark:text-zinc-400 leading-relaxed">
            Uma notificação foi enviada para nossos Gestores e Diretoria. Eles verificarão seus dados e liberarão seu acesso em breve.
          </p>
        </div>

        <div className="space-y-4">
          <Button 
            variant="outline" 
            onClick={handleCheckStatus}
            className="w-full h-12 rounded-2xl font-bold text-xs uppercase tracking-widest border-slate-200 hover:bg-slate-50 transition-all active:scale-95"
          >
            Verificar Status Agora
          </Button>
          <Button 
            variant="ghost" 
            onClick={handleLogout}
            className="w-full h-12 rounded-2xl font-bold text-xs uppercase tracking-widest text-rose-500 hover:bg-rose-50 hover:text-rose-600"
          >
            <LogOut size={16} className="mr-2" /> Sair da Conta
          </Button>
        </div>

        <p className="text-[9px] font-black uppercase tracking-[4px] opacity-20">Flow63 Intelligence</p>
      </motion.div>
    </div>
  );
}
