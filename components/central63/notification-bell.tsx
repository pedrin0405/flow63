"use client"

import { useState, useEffect } from "react"
import { Bell } from "lucide-react"
import { supabase } from "@/lib/supabase"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"

export function NotificationBell() {
  const [isOpen, setIsOpen] = useState(false)
  const [notification, setNotification] = useState<{ message: string; id: string } | null>(null)
  const [isUnread, setIsUnread] = useState(false)

  const fetchNotification = async () => {
    try {
      const { data } = await supabase
        .from('company_settings')
        .select('*')
        .eq('instance_name', 'GLOBAL_BROADCAST')
        .order('id', { ascending: false })
        .limit(1)

      if (data && data.length > 0 && data[0].url_site && data[0].api_config?.active !== false) {
        const msgId = data[0].api_config?.updatedAt || data[0].updated_at || 'initial'
        setNotification({ message: data[0].url_site, id: msgId })
        
        const readId = localStorage.getItem('last_read_broadcast_id')
        if (readId !== msgId) {
          setIsUnread(true)
        }
      } else {
        setNotification(null)
        setIsUnread(false)
      }
    } catch (err) {
      console.error("Erro ao buscar notificações:", err)
    }
  }

  useEffect(() => {
    fetchNotification()

    // Ouvinte em tempo real para novos comunicados
    const channel = supabase
      .channel('global_broadcast_sync')
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'company_settings'
      }, () => {
        fetchNotification()
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  const handleOpen = () => {
    if (!notification) return
    setIsOpen(true)
    setIsUnread(false)
    localStorage.setItem('last_read_broadcast_id', notification.id)
  }

  const hasContent = !!notification

  return (
    <>
      <button
        onClick={handleOpen}
        disabled={!hasContent}
        className={`relative p-2 rounded-full transition-all group active:scale-95 ${
          hasContent ? "hover:bg-accent cursor-pointer" : "opacity-30 cursor-not-allowed"
        }`}
        aria-label="Notificações"
      >
        <Bell 
          size={20} 
          className="text-slate-900 dark:text-white transition-colors" 
        />
        {isUnread && (
          <span className="absolute top-2 right-2.5 w-2.5 h-2.5 bg-red-600 rounded-full border-2 border-background shadow-sm animate-pulse" />
        )}
      </button>

      <Dialog open={isOpen} onOpenChange={(open) => {
          setIsOpen(open);
          if (!open) {
              setIsUnread(false);
          }
      }}>
        <DialogContent className="sm:max-w-[450px] rounded-[2rem] border-none shadow-3xl overflow-hidden p-0 bg-white dark:bg-zinc-950">
          <div className="bg-primary/5 dark:bg-primary/10 p-8 pb-6">
            <DialogHeader>
                <div className="flex items-center gap-4 mb-3">
                    <div className="p-3 bg-primary/10 dark:bg-primary/20 rounded-2xl text-primary shadow-sm">
                        <Bell size={24} />
                    </div>
                    <div>
                        <DialogTitle className="text-2xl font-black uppercase tracking-tight text-slate-900 dark:text-slate-100">
                            Comunicado
                        </DialogTitle>
                        <DialogDescription className="text-[10px] font-black uppercase tracking-[0.2em] opacity-40 mt-0.5">
                            Central63 • Informativo Geral
                        </DialogDescription>
                    </div>
                </div>
            </DialogHeader>
          </div>
          
          <div className="p-8 pt-6">
            <div className="bg-slate-50 dark:bg-zinc-900 p-6 rounded-3xl border border-slate-100 dark:border-zinc-800 text-base font-medium leading-relaxed text-slate-700 dark:text-slate-300 shadow-inner">
                {notification?.message}
            </div>
            
            <div className="mt-8 flex justify-end">
                <Button 
                    onClick={() => setIsOpen(false)} 
                    className="rounded-2xl px-10 h-12 font-black uppercase tracking-widest text-xs shadow-xl shadow-primary/20 hover:scale-105 transition-transform"
                >
                    Entendido
                </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
