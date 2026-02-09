"use client";

import { useState, useEffect, useRef } from "react";
import { supabase } from "@/lib/supabase";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Search, Loader2, UserPlus, X, Image as ImageIcon, Save, AlertCircle, Upload } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

interface UnitSettingsDialogProps {
  unit: any;
  children: React.ReactNode;
}

export function UnitSettingsDialog({ unit, children }: UnitSettingsDialogProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [results, setResults] = useState<any[]>([]);
  const [loadingSearch, setLoadingSearch] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [open, setOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Estado para armazenar as edições temporárias
  const [tempData, setTempData] = useState({
    dest_captacao: unit.dest_captacao || "",
    dest_corretor: unit.dest_corretor || "",
    dest_crm: unit.dest_crm || "",
    imagem_url: unit.imagem_url || ""
  });

  // Reset do estado temporário ao abrir o modal
  useEffect(() => {
    if (open) {
      setTempData({
        dest_captacao: unit.dest_captacao || "",
        dest_corretor: unit.dest_corretor || "",
        dest_crm: unit.dest_crm || "",
        imagem_url: unit.imagem_url || ""
      });
      setSearchTerm("");
      setResults([]);
    }
  }, [open, unit]);

  // Pesquisa de corretores
  useEffect(() => {
    const delayDebounceFn = setTimeout(async () => {
      if (searchTerm.length < 2) {
        setResults([]);
        return;
      }

      setLoadingSearch(true);
      try {
        const [pmw, aux] = await Promise.all([
          supabase.from("corretores_pmw").select("nome, imagem_url").ilike("nome", `%${searchTerm}%`),
          supabase.from("corretores_aux").select("nome, imagem_url").ilike("nome", `%${searchTerm}%`)
        ]);

        const combined = [...(pmw.data || []), ...(aux.data || [])];
        const unique = combined.filter((v, i, a) => a.findIndex(t => t.nome === v.nome) === i);
        setResults(unique);
      } catch (error) {
        console.error("DEBUG-ERROR [Terminal]: Falha na pesquisa", error);
      } finally {
        setLoadingSearch(false);
      }
    }, 400);

    return () => clearTimeout(delayDebounceFn);
  }, [searchTerm]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) { // Limite de 2MB para Base64 no DB
        toast.error("A imagem é muito grande. Use arquivos menores que 2MB.");
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        setTempData(prev => ({ ...prev, imagem_url: base64String }));
        toast.success("Foto carregada com sucesso!");
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    const idColumn = unit.codigo ? "codigo" : (unit.id ? "id" : "nome_unidade");
    const idValue = unit[idColumn];

    console.log(`DEBUG [Terminal]: A guardar alterações para unidade ${idValue}...`);

    try {
      const { error } = await supabase
        .from("unidades")
        .update(tempData)
        .eq(idColumn, idValue);

      if (error) throw error;

      toast.success("Alterações guardadas com sucesso!");
      setOpen(false);
      
      setTimeout(() => window.location.reload(), 500);
    } catch (error: any) {
      console.error("DEBUG-ERROR [Terminal]:", error.message);
      toast.error(`Erro ao guardar: ${error.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  const hasChanges = JSON.stringify(tempData) !== JSON.stringify({
    dest_captacao: unit.dest_captacao || "",
    dest_corretor: unit.dest_corretor || "",
    dest_crm: unit.dest_crm || "",
    imagem_url: unit.imagem_url || ""
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-[500px] p-0 overflow-hidden border-none shadow-2xl bg-background">
        <div className="h-42 bg-black flex items-end p-6 relative">
          <img 
            src={tempData.imagem_url || "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?q=80&w=800"} 
            className="absolute inset-0 w-full h-full object-cover opacity-80 transition-all duration-500"
            alt="Banner Unidade"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-primary/90 to-transparent" />
          <DialogTitle className="relative text-white text-2xl font-bold flex items-center gap-3">
            <UserPlus className="h-6 w-6" />
            Editar {unit.nome_unidade || unit.unidade || unit.nome || "Unidade"}
          </DialogTitle>
        </div>

        <div className="p-6 space-y-6">
          {/* Edição de Foto */}
          <div className="space-y-2">
            <Label className="text-xs font-bold uppercase text-muted-foreground tracking-widest flex items-center gap-2">
              <ImageIcon className="h-3 w-3" /> Foto da Unidade
            </Label>
            <div className="flex gap-2">
              <Input 
                placeholder="URL da imagem..." 
                value={tempData.imagem_url.startsWith('data:') ? 'Imagem Carregada (Base64)' : tempData.imagem_url} 
                onChange={(e) => setTempData({ ...tempData, imagem_url: e.target.value })}
                className={`bg-muted/50 border-none h-10 flex-1 ${tempData.imagem_url !== (unit.imagem_url || "") ? 'ring-1 ring-primary/50' : ''}`}
                disabled={tempData.imagem_url.startsWith('data:')}
              />
              <input 
                type="file" 
                ref={fileInputRef} 
                className="hidden" 
                accept="image/*" 
                onChange={handleFileChange} 
              />
              <Button 
                variant="outline" 
                className="gap-2 border-primary/20 hover:bg-primary/5"
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload className="h-4 w-4" />
                Subir Foto
              </Button>
              {tempData.imagem_url.startsWith('data:') && (
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="text-destructive hover:bg-destructive/10"
                  onClick={() => setTempData({ ...tempData, imagem_url: unit.imagem_url || "" })}
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>

          {/* Estado da Equipa */}
          <div className="space-y-3">
            <Label className="text-xs font-bold uppercase text-muted-foreground tracking-widest flex justify-between items-center">
              <span>Destaques</span>
              {hasChanges && (
                <span className="text-[9px] text-amber-600 flex items-center gap-1 normal-case font-medium">
                  <AlertCircle className="h-2.5 w-2.5" /> Alterações pendentes
                </span>
              )}
            </Label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {[
                { label: "Captação", field: "dest_captacao", color: "text-blue-500", bg: "bg-blue-500/5", borderColor: "border-blue-500/40" },
                { label: "Corretor", field: "dest_corretor", color: "text-green-500", bg: "bg-green-500/5", borderColor: "border-green-500/40" },
                { label: "CRM", field: "dest_crm", color: "text-purple-500", bg: "bg-purple-500/5", borderColor: "border-purple-500/40" },
              ].map((item) => {
                const value = tempData[item.field as keyof typeof tempData];
                const isChanged = value !== (unit[item.field] || "");
                const hasValue = !!value;

                return (
                  <div 
                    key={item.field} 
                    className={`p-3 rounded-xl border-2 flex flex-col gap-2 relative transition-all duration-300 ${item.bg} 
                      ${hasValue ? item.borderColor : 'border-muted'} 
                      ${isChanged ? 'ring-1 ring-primary/20 scale-[1.02]' : ''}`}
                  >
                    <span className={`text-[10px] font-black uppercase ${item.color}`}>{item.label}</span>
                    <div className="flex items-center justify-between">
                      <span className={`text-sm font-semibold truncate ${isChanged ? 'text-foreground' : 'text-foreground/80'}`}>
                        {value || "Livre"}
                      </span>
                      {hasValue && (
                        <button 
                          className="p-1 hover:bg-destructive/10 rounded-full transition-colors text-muted-foreground hover:text-destructive"
                          onClick={() => setTempData({ ...tempData, [item.field]: "" })}
                        >
                          <X className="h-3 w-3" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Busca de Novo Responsável */}
          <div className="space-y-3">
            <Label className="text-xs font-bold uppercase text-muted-foreground tracking-widest">Pesquisar Novo Profissional</Label>
            <div className="relative">
              {loadingSearch ? (
                <Loader2 className="absolute left-3 top-3.5 h-4 w-4 animate-spin text-primary" />
              ) : (
                <Search className="absolute left-3 top-3.5 h-4 w-4 text-muted-foreground" />
              )}
              <Input
                placeholder="Nome do corretor..."
                className="pl-10 h-12 rounded-xl bg-muted/50 border-none focus-visible:ring-1"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          <ScrollArea className="h-[200px] rounded-xl border p-2 bg-slate-50/50 dark:bg-slate-900/50">
            <div className="grid gap-2">
              {results.map((corretor, idx) => (
                <div 
                  key={idx} 
                  className="flex items-center justify-between p-3 rounded-xl bg-background border border-border/50 hover:border-primary/30 transition-all group"
                >
                  <div className="flex items-center gap-3 overflow-hidden">
                    <Avatar className="h-9 w-9 border flex-shrink-0">
                      <AvatarImage src={corretor.imagem_url} />
                      <AvatarFallback className="text-xs font-bold">{corretor.nome.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <span className="text-sm font-bold truncate">{corretor.nome}</span>
                  </div>
                  
                  <div className="flex gap-1">
                    {["CAPT", "CORR", "CRM"].map((role) => {
                      const field = role === "CAPT" ? "dest_captacao" : role === "CORR" ? "dest_corretor" : "dest_crm";
                      const buttonStyles = 
                        role === "CAPT" ? "border-blue-500/40 text-blue-600 hover:bg-blue-600" :
                        role === "CORR" ? "border-green-500/40 text-green-600 hover:bg-green-600" :
                        "border-purple-500/40 text-purple-600 hover:bg-purple-600";

                      return (
                        <Button 
                          key={role}
                          variant="outline" 
                          size="sm" 
                          className={`h-7 px-2 text-[9px] font-bold border-2 transition-all hover:text-white ${buttonStyles}`}
                          onClick={() => setTempData({ ...tempData, [field]: corretor.nome })}
                        >
                          {role}
                        </Button>
                      );
                    })}
                  </div>
                </div>
              ))}
              {searchTerm.length >= 2 && results.length === 0 && !loadingSearch && (
                <p className="text-center py-10 text-xs text-muted-foreground italic">Nenhum resultado para "{searchTerm}"</p>
              )}
            </div>
          </ScrollArea>
        </div>

        <DialogFooter className="p-6 pt-0 gap-2 sm:gap-0">
          <Button variant="ghost" onClick={() => setOpen(false)} disabled={isSaving}>
            Cancelar
          </Button>
          <Button 
            onClick={handleSave} 
            disabled={!hasChanges || isSaving}
            className="gap-2 min-w-[140px]"
          >
            {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Guardar Alterações
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}