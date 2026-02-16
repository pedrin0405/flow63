"use client";

import React, { useState, useEffect } from "react";
import { 
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter 
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Plus, Trash2, Save, FileSpreadsheet, 
  Loader2, Edit3, LayoutTemplate, ArrowLeft,
  Building2, User, Clock, CheckCircle2
} from "lucide-react";
import { 
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue 
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface Field {
  name: string;
  type: string;
  sync: boolean;
  ref: string;
}

export function NewSpreadsheetModal({ isOpen, onClose, onSave, onUseModel }: any) {
  // Estados de Controle
  const [view, setView] = useState<"gallery" | "form">("gallery");
  const [isLoadingModels, setIsLoadingModels] = useState(false);
  const [existingModels, setExistingModels] = useState<any[]>([]);
  // const [selectedModel, setSelectedModel] = useState<any>(null); // Mantido conforme solicitado
  
  // Estados do Formulário
  const [nome, setNome] = useState("");
  const [unidade, setUnidade] = useState("");
  const [criado_por, setCriadoPor] = useState("");
  const [fields, setFields] = useState<Field[]>([]);
  const [editingModelId, setEditingModelId] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      fetchModels();
      setView("gallery");
    } else {
      resetForm();
    }
  }, [isOpen]);

  const fetchModels = async () => {
    setIsLoadingModels(true);
    const { data, error } = await supabase
      .from('spreadsheets')
      .select('*')
      .order('updated_at', { ascending: false });
    if (!error && data) setExistingModels(data);
    setIsLoadingModels(false);
  };

  const resetForm = () => {
    setNome("");
    setUnidade("");
    setCriadoPor("");
    setFields([]);
    setEditingModelId(null);
  };

  // const handleUseModel = (model: any) => {
  //   setSelectedModel(model);
  //   setIsModalOpen(false); // Fecha o modal de seleção
  // }; // Mantido conforme solicitado

  const handleEditModel = (model: any) => {
    setEditingModelId(model.id);
    setNome(model.nome);
    setUnidade(model.unidade || "");
    setCriadoPor(model.criado_por || "");
    setFields(model.dados || []);
    setView("form");
  };

  const handleDeleteModel = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation(); 
    if (!confirm("Tem certeza que deseja excluir este modelo permanentemente?")) return;

    const { error } = await supabase.from('spreadsheets').delete().eq('id', id);
    if (error) {
      toast.error("Erro ao excluir modelo");
    } else {
      toast.success("Modelo excluído com sucesso");
      fetchModels();
    }
  };

  const updateField = (index: number, key: keyof Field, value: any) => {
    const newFields = [...fields];
    newFields[index] = { ...newFields[index], [key]: value };
    setFields(newFields);
  };

  const handleSave = async () => {
    if (!nome) return toast.error("Nome é obrigatório");
    const payload = { 
      nome, 
      unidade, 
      criado_por,
      dados: fields, 
      updated_at: new Date().toISOString() 
    };
    
    if (editingModelId) {
      const { error } = await supabase.from('spreadsheets').update(payload).eq('id', editingModelId);
      if (!error) {
        toast.success("Modelo atualizado!");
        fetchModels();
        setView("gallery");
      }
    } else {
      onSave(payload);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-[98vw] w-full h-[95vh] md:h-[90vh] flex flex-col p-0 gap-0 overflow-hidden border-none shadow-2xl rounded-3xl">
        
        <DialogHeader className="p-4 md:p-6 border-b bg-white dark:bg-slate-950 flex-shrink-0">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="p-2 md:p-3 bg-primary/10 rounded-2xl">
                <FileSpreadsheet className="text-primary h-5 w-5 md:h-6 md:w-6" />
              </div>
              <div>
                <DialogTitle className="text-lg md:text-2xl font-bold tracking-tight">
                  {view === "gallery" ? "Modelos de Planilha" : (editingModelId ? "Editar Modelo" : "Criar Nova Planilha")}
                </DialogTitle>
                <p className="text-xs md:text-sm text-muted-foreground">
                  {view === "gallery" 
                    ? "Selecione um modelo existente." 
                    : "Configure colunas e metadados."}
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              {view === "gallery" ? (
                <Button onClick={() => { resetForm(); setView("form"); }} className="w-full md:w-auto rounded-xl gap-2 h-10 md:h-11 px-6">
                  <Plus size={18} /> Novo Modelo
                </Button>
              ) : (
                <Button variant="ghost" onClick={() => setView("gallery")} className="rounded-xl gap-2 h-10 md:h-11">
                  <ArrowLeft size={18} /> <span className="hidden md:inline">Voltar para Galeria</span>
                </Button>
              )}
            </div>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-hidden bg-slate-50/30 dark:bg-slate-900/10">
          
          {view === "gallery" && (
            <div className="h-full overflow-y-auto p-4 md:p-8">
              {isLoadingModels ? (
                <div className="flex flex-col items-center justify-center h-full gap-4 text-muted-foreground">
                  <Loader2 className="animate-spin h-8 w-8 text-primary" />
                  <p className="font-medium">Carregando...</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
                  {existingModels.map((model) => (
                    <div 
                      key={model.id}
                      className="group relative bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[1.5rem] md:rounded-[2rem] p-5 md:p-6 hover:shadow-xl hover:border-primary/40 transition-all cursor-pointer overflow-hidden flex flex-col h-full"
                    >
                      <div className="flex justify-between items-start mb-4">
                        <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-2xl group-hover:bg-primary/10 transition-colors">
                          <LayoutTemplate className="h-5 w-5 md:h-6 md:w-6 text-slate-400 group-hover:text-primary" />
                        </div>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-full"
                          onClick={(e) => handleDeleteModel(model.id, e)}
                        >
                          <Trash2 size={18} />
                        </Button>
                      </div>

                      <h3 className="font-bold text-base md:text-lg mb-2 truncate">{model.nome}</h3>
                      
                      <div className="space-y-2 mb-4 flex-1">
                        <div className="flex items-center gap-2 text-xs text-slate-500">
                          <Building2 size={14} className="text-slate-400" />
                          <span className="truncate">{model.unidade || "Unidade Geral"}</span>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-slate-500">
                          <User size={14} className="text-slate-400" />
                          <span className="truncate">{model.criado_por || "Autor não definido"}</span>
                        </div>
                        {/* CAMPO DE ÚLTIMA ATUALIZAÇÃO ADICIONADO ABAIXO */}
                        <div className="flex items-center gap-2 text-[10px] font-medium text-slate-400 bg-slate-50 dark:bg-slate-800/50 p-2 rounded-lg mt-2">
                          <Clock size={12} />
                          <span>Atualizado: {new Date(model.updated_at).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                      </div>

                      {/* AJUSTE NO BOTÃO USAR MODELO */}
                      <div className="flex flex-col gap-2 pt-4 border-t border-slate-50 dark:border-slate-800">
                        <Button 
                          onClick={(e) => {
                            e.stopPropagation();
                            // Chamada da função onUseModel passando o modelo clicado
                            if (onUseModel && typeof onUseModel === 'function') {
                              onUseModel(model);
                            } else {
                              toast.error("Erro: Ação de uso não configurada.");
                            }
                          }}
                          className="w-full h-9 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs gap-2 shadow-sm"
                        >
                          <CheckCircle2 size={14} /> Usar Modelo
                        </Button>
                        <div className="flex items-center justify-between px-1">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                            {model.dados?.length || 0} Colunas
                          </span>
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              handleEditModel(model);
                            }}
                            className="flex items-center gap-1 text-primary font-bold text-xs hover:underline"
                          >
                            Editar <Edit3 size={12} />
                          </button>
                        </div>
                      </div>

                    </div>
                  ))}

                  <div 
                    onClick={() => { resetForm(); setView("form"); }}
                    className="border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-[1.5rem] md:rounded-[2rem] p-6 flex flex-col items-center justify-center gap-3 text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-900/50 hover:border-primary/50 hover:text-primary transition-all cursor-pointer min-h-[180px]"
                  >
                    <div className="p-4 bg-slate-100 dark:bg-slate-800 rounded-full">
                      <Plus size={28} />
                    </div>
                    <span className="font-bold text-sm md:text-base">Criar Novo Modelo</span>
                  </div>
                </div>
              )}
            </div>
          )}

          {view === "form" && (
            <main className="h-full overflow-y-auto p-4 md:p-10">
              <div className="max-w-7xl mx-auto space-y-6 md:space-y-10">
                
                <section className="flex flex-col md:grid md:grid-cols-12 gap-4 md:gap-6 bg-white dark:bg-slate-900 p-6 md:p-8 rounded-2xl md:rounded-[2.5rem] border shadow-sm">
                  <div className="md:col-span-5 space-y-2 md:space-y-3">
                    <Label className="text-[10px] md:text-xs font-black uppercase text-slate-400 tracking-widest ml-1">Nome do Modelo</Label>
                    <Input 
                      value={nome} 
                      onChange={(e) => setNome(e.target.value)} 
                      placeholder="Nome..."
                      className="h-12 md:h-14 text-base md:text-xl font-bold rounded-xl md:rounded-2xl border-slate-100 bg-slate-50/50"
                    />
                  </div>
                  <div className="md:col-span-4 space-y-2 md:space-y-3">
                    <Label className="text-[10px] md:text-xs font-black uppercase text-slate-400 tracking-widest ml-1">Unidade</Label>
                    <Input 
                      value={unidade} 
                      onChange={(e) => setUnidade(e.target.value)} 
                      placeholder="Unidade..."
                      className="h-12 md:h-14 rounded-xl md:rounded-2xl border-slate-100 bg-slate-50/50 font-medium"
                    />
                  </div>
                  <div className="md:col-span-3 space-y-2 md:space-y-3">
                    <Label className="text-[10px] md:text-xs font-black uppercase text-slate-400 tracking-widest ml-1">Criado Por</Label>
                    <Input 
                      value={criado_por} 
                      onChange={(e) => setCriadoPor(e.target.value)} 
                      placeholder="Autor..."
                      className="h-12 md:h-14 rounded-xl md:rounded-2xl border-slate-100 bg-slate-50/50 font-medium"
                    />
                  </div>
                </section>

                <section className="space-y-4 md:space-y-6">
                  <div className="flex items-center justify-between px-2">
                    <h3 className="text-lg md:text-xl font-black tracking-tight">Estrutura de Colunas</h3>
                    <Button onClick={() => setFields([...fields, { name: "", type: "text", sync: false, ref: "" }])} className="rounded-xl md:rounded-2xl gap-2 h-10 md:h-12 shadow-md">
                      <Plus size={18} /> <span className="hidden md:inline">Adicionar</span>
                    </Button>
                  </div>

                  <div className="grid gap-3 md:gap-4">
                    {fields.map((field, index) => (
                      <div key={index} className="flex flex-col md:flex-row items-start md:items-center gap-4 md:gap-6 p-4 md:p-4 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl md:rounded-3xl hover:border-primary/50 transition-all shadow-sm relative">
                        <div className="w-full flex-1 grid grid-cols-2 md:grid-cols-12 gap-4 md:gap-8 items-center">
                          <div className="col-span-2 md:col-span-4 space-y-1">
                            <Label className="text-[9px] font-black uppercase text-slate-400 ml-1">Título</Label>
                            <Input 
                              value={field.name} 
                              onChange={(e) => updateField(index, "name", e.target.value)} 
                              className="h-10 md:h-12 border-none bg-slate-50/50 rounded-lg md:rounded-xl font-bold"
                            />
                          </div>

                          <div className="col-span-1 md:col-span-3 space-y-1">
                            <Label className="text-[9px] font-black uppercase text-slate-400 ml-1">Tipo</Label>
                            <Select value={field.type} onValueChange={(v) => updateField(index, "type", v)}>
                              <SelectTrigger className="h-10 md:h-12 border-none bg-slate-50/50 rounded-lg md:rounded-xl">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="text">Texto</SelectItem>
                                <SelectItem value="number">Número</SelectItem>
                                <SelectItem value="currency">Dinheiro</SelectItem>
                                <SelectItem value="percentage">Porcentagem</SelectItem>
                                <SelectItem value="date">Data</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>

                          <div className="col-span-1 md:col-span-3 space-y-1">
                            <Label className="text-[9px] font-black uppercase text-slate-400 ml-1">Ref (Sync)</Label>
                            <Input 
                              value={field.ref} 
                              onChange={(e) => updateField(index, "ref", e.target.value)} 
                              disabled={!field.sync}
                              className="h-10 md:h-12 border-none bg-slate-50/50 rounded-lg md:rounded-xl disabled:opacity-20"
                            />
                          </div>

                          <div className="col-span-2 md:col-span-2 flex md:flex-col items-center justify-between md:justify-center gap-2 md:border-l md:pl-4">
                            <Label className="text-[9px] font-black uppercase text-slate-400">Sync</Label>
                            <Switch 
                              checked={field.sync} 
                              onCheckedChange={(v) => updateField(index, "sync", v)} 
                            />
                          </div>
                        </div>

                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="absolute top-2 right-2 md:static text-slate-200 hover:text-red-500 md:h-12 md:w-12"
                          onClick={() => setFields(fields.filter((_, i) => i !== index))}
                        >
                          <Trash2 size={20} />
                        </Button>
                      </div>
                    ))}
                  </div>
                </section>
              </div>
            </main>
          )}
        </div>

        <DialogFooter className="p-4 md:p-6 border-t bg-white dark:bg-slate-950 flex flex-row items-center justify-end gap-3">
          <Button variant="ghost" onClick={onClose} className="rounded-xl h-10 md:h-12 px-6">Fechar</Button>
          {view === "form" && (
            <Button onClick={handleSave} className="flex-1 md:flex-none h-10 md:h-12 px-8 rounded-xl md:rounded-2xl bg-primary text-white font-bold">
              <Save className="mr-2 h-4 w-4 md:h-5 md:w-5" />
              Salvar
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}