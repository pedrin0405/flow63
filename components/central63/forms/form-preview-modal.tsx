"use client"

import { useEffect, useState } from "react"
import { 
  X, 
  FileText, 
  MapPin, 
  Calendar, 
  Clock,
  CheckCircle2, 
  User,
  Briefcase,
  ShieldCheck,
  Mail,
  Phone
} from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Skeleton } from "@/components/ui/skeleton"
import { supabase } from "@/lib/supabase"

interface FormPreviewModalProps {
  isOpen: boolean
  onClose: () => void
  formId: string | null
  basicInfo?: any
}

export function FormPreviewModal({ isOpen, onClose, formId, basicInfo }: FormPreviewModalProps) {
  const [details, setDetails] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (isOpen && formId) {
      const fetchDetails = async () => {
        setLoading(true)
        try {
          const { data, error } = await supabase
            .from('forms')
            .select('*')
            .eq('id', formId)
            .single()

          if (error && error.code !== 'PGRST116') {
             console.error("Erro ao buscar detalhes:", error)
          }
          setDetails(data || null)
        } finally {
          setLoading(false)
        }
      }
      fetchDetails()
    } else {
      setDetails(null)
    }
  }, [isOpen, formId])

  const isCompleted = basicInfo?.status === 'completed'

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent 
        showCloseButton={false} 
        className="sm:max-w-[700px] w-[95%] h-[90vh] sm:h-auto sm:max-h-[85vh] flex flex-col p-0 gap-0 overflow-hidden rounded-2xl border-0 shadow-2xl bg-white dark:bg-zinc-950"
      >
        
        {/* --- CABEÇALHO (FIXO) --- */}
        <div className={`p-6 border-b flex-shrink-0 z-10 ${isCompleted ? 'bg-blue-50/60 dark:bg-blue-950/20' : 'bg-amber-50/60 dark:bg-amber-950/20'}`}>
          <DialogHeader className="space-y-0">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-4">
                <div className={`p-3 rounded-xl shadow-sm border border-white/50 ${isCompleted ? 'bg-blue-100 text-blue-600' : 'bg-amber-100 text-amber-600'}`}>
                  <FileText size={24} />
                </div>
                <div>
                  <DialogTitle className="text-xl font-black uppercase tracking-tight text-slate-900 dark:text-slate-100">
                    Ficha de Atendimento
                  </DialogTitle>
                  <div className="flex items-center gap-2 mt-1.5">
                    <Badge variant="outline" className="font-mono text-[10px] bg-white/50 backdrop-blur border-slate-300 text-slate-600 px-1.5 py-0 h-5">
                      ID: {formId}
                    </Badge>
                    {isCompleted ? (
                      <Badge className="bg-blue-500 hover:bg-emerald-600 text-[10px] h-5 px-1.5 border-0">Concluído</Badge>
                    ) : (
                      <Badge variant="outline" className="text-amber-600 border-amber-200 bg-amber-50 text-[10px] h-5 px-1.5">Pendente</Badge>
                    )}
                  </div>
                </div>
              </div>

              <button 
                onClick={onClose} 
                className="p-2 rounded-full hover:bg-black/5 dark:hover:bg-white/10 transition-colors -mr-2 -mt-2 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
              >
                <X size={20} />
              </button>
            </div>
          </DialogHeader>
        </div>

        {/* --- CORPO ROLÁVEL --- */}
        <div className="flex-1 overflow-y-auto bg-white dark:bg-zinc-950 scrollbar-thin scrollbar-thumb-gray-200 dark:scrollbar-thumb-zinc-800 scrollbar-track-transparent">
          <div className="p-6 md:p-8 space-y-8">
            
            {loading ? (
              <div className="space-y-6">
                <div className="space-y-2">
                  <Skeleton className="h-4 w-24 bg-slate-100" />
                  <Skeleton className="h-12 w-full rounded-xl bg-slate-100" />
                </div>
                <div className="space-y-2">
                  <Skeleton className="h-4 w-32 bg-slate-100" />
                  <Skeleton className="h-24 w-full rounded-xl bg-slate-100" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <Skeleton className="h-20 rounded-xl bg-slate-100" />
                  <Skeleton className="h-20 rounded-xl bg-slate-100" />
                </div>
              </div>
            ) : !details ? (
              <div className="flex flex-col items-center justify-center py-12 text-center space-y-6">
                <div className="relative">
                  <div className="absolute inset-0 bg-amber-200 blur-xl opacity-30 rounded-full animate-pulse"></div>
                  <div className="bg-gradient-to-br from-amber-50 to-amber-100 p-6 rounded-full relative shadow-inner border border-amber-200">
                    <Clock size={48} className="text-amber-600" />
                  </div>
                </div>
                <div className="max-w-xs mx-auto space-y-2">
                  <h3 className="font-bold text-lg text-slate-800 dark:text-slate-100">Aguardando Cliente</h3>
                  <p className="text-sm text-slate-500 font-medium leading-relaxed">
                    O formulário foi enviado, mas o cliente ainda não preencheu os dados.
                  </p>
                </div>
                
                <div className="w-full bg-slate-50 dark:bg-zinc-900 rounded-xl p-5 border border-dashed border-slate-200 dark:border-zinc-800 text-left space-y-4">
                  <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Registro Inicial</p>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <span className="text-xs text-slate-500 font-medium">Cliente</span>
                      <p className="text-sm font-bold text-slate-700 dark:text-slate-300">{basicInfo?.cliente_nome}</p>
                    </div>
                    <div>
                      <span className="text-xs text-slate-500 font-medium">Corretor</span>
                      <p className="text-sm font-bold text-slate-700 dark:text-slate-300">{basicInfo?.corretor_nome}</p>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-500">
                
                <div className="bg-emerald-50/80 dark:bg-emerald-950/30 border border-emerald-100 dark:border-emerald-900 rounded-2xl p-4 flex items-center gap-4">
                   <div className="bg-emerald-100 dark:bg-emerald-900/50 p-2 rounded-full">
                     <CheckCircle2 size={20} className="text-emerald-600 dark:text-emerald-400" />
                   </div>
                   <div>
                     <p className="text-sm font-bold text-emerald-900 dark:text-emerald-200">Cadastro Finalizado</p>
                     <p className="text-xs text-emerald-700 dark:text-emerald-400 font-medium">Dados enviados em {new Date(details.created_at).toLocaleDateString()}</p>
                   </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center gap-2 pb-2 border-b border-slate-100 dark:border-zinc-800">
                    <User size={18} className="text-primary" />
                    <h3 className="font-bold text-xs uppercase tracking-widest text-slate-500">Dados Pessoais</h3>
                  </div>
                  
                  <div className="grid gap-5">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-400 uppercase">Nome Completo</label>
                      <div className="text-base font-bold text-slate-800 dark:text-slate-100 bg-slate-50 dark:bg-zinc-900 p-3.5 rounded-xl border border-slate-100 dark:border-zinc-800">
                        {details.nome}
                      </div>
                    </div>

                    {/* NOVOS CAMPOS: EMAIL E TELEFONE */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-400 uppercase flex items-center gap-1">
                          <Mail size={12} /> E-mail
                        </label>
                        <div className="text-sm font-bold text-slate-800 dark:text-slate-100 bg-slate-50 dark:bg-zinc-900 p-3.5 rounded-xl border border-slate-100 dark:border-zinc-800 truncate">
                          {details.email || "Não informado"}
                        </div>
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-400 uppercase flex items-center gap-1">
                          <Phone size={12} /> Telefone
                        </label>
                        <div className="text-sm font-bold text-slate-800 dark:text-slate-100 bg-slate-50 dark:bg-zinc-900 p-3.5 rounded-xl border border-slate-100 dark:border-zinc-800">
                          {details.telefone || "Não informado"}
                        </div>
                      </div>
                    </div>
                    
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-400 uppercase flex items-center gap-1">
                        <MapPin size={12} /> Endereço
                      </label>
                      <div className="text-sm font-medium text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-zinc-900 p-3.5 rounded-xl border border-slate-100 dark:border-zinc-800 leading-relaxed">
                        {details.endereco || "Não informado"}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center gap-2 pb-2 border-b border-slate-100 dark:border-zinc-800">
                    <Briefcase size={18} className="text-primary" />
                    <h3 className="font-bold text-xs uppercase tracking-widest text-slate-500">Negociação</h3>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5 bg-white dark:bg-zinc-900 p-4 rounded-2xl border border-slate-100 dark:border-zinc-800 shadow-sm">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Tipo de Imóvel</label>
                      <div className="text-sm font-bold text-slate-800 dark:text-slate-100">{details.tipo || "-"}</div>
                    </div>
                    <div className="space-y-1.5 bg-white dark:bg-zinc-900 p-4 rounded-2xl border border-slate-100 dark:border-zinc-800 shadow-sm">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Prazo / Interesse</label>
                      <div className="text-sm font-bold text-slate-800 dark:text-slate-100">{details.prazo || "-"}</div>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                   <div className="flex items-center gap-2 pb-2 border-b border-slate-100 dark:border-zinc-800">
                    <ShieldCheck size={18} className="text-primary" />
                    <h3 className="font-bold text-xs uppercase tracking-widest text-slate-500">Validação</h3>
                  </div>

                  <div className="bg-slate-50 dark:bg-zinc-900 p-5 rounded-2xl space-y-4 border border-slate-200 dark:border-zinc-800">
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-bold uppercase text-slate-500 flex items-center gap-2">
                        <Calendar size={14} /> Assinado em
                      </span>
                      <Badge variant="outline" className="bg-white dark:bg-zinc-950 border-slate-300 dark:border-zinc-700 text-slate-700 dark:text-slate-300 font-mono px-3 py-1">
                        {details.data_assinatura ? new Date(details.data_assinatura).toLocaleDateString('pt-BR') : "-"}
                      </Badge>
                    </div>
                    <Separator className="bg-slate-200 dark:bg-zinc-800" />
                    <div className="space-y-2.5">
                      <div className="flex items-center gap-3 text-xs font-bold text-slate-600 dark:text-slate-400">
                        <div className={`w-5 h-5 rounded-full flex items-center justify-center shadow-sm ${details.termo_1 ? 'bg-emerald-500 text-white' : 'bg-gray-200'}`}>
                          {details.termo_1 && <CheckCircle2 size={12} />}
                        </div>
                        Declaração de Veracidade
                      </div>
                      <div className="flex items-center gap-3 text-xs font-bold text-slate-600 dark:text-slate-400">
                        <div className={`w-5 h-5 rounded-full flex items-center justify-center shadow-sm ${details.termo_2 ? 'bg-emerald-500 text-white' : 'bg-gray-200'}`}>
                          {details.termo_2 && <CheckCircle2 size={12} />}
                        </div>
                        Termos de Privacidade Aceitos
                      </div>
                    </div>
                  </div>
                </div>

              </div>
            )}
          </div>
        </div>

      </DialogContent>
    </Dialog>
  )
}