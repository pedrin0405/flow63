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
  
  const [tempData, setTempData] = useState({
    dest_captacao: unit.dest_captacao || "",
    dest_corretor: unit.dest_corretor || "",
    dest_crm: unit.dest_crm || "",
    imagem_url: unit.imagem_url || ""
  });

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
      if (file.size > 2 * 1024 * 1024) {
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
      <DialogContent className="sm:max-w-[500px] p-0 overflow-hidden border-none shadow-2xl bg-background max-h-[95vh] flex flex-col">
        {/* Banner Fixo */}
        <div className="h-32 md:h-42 bg-black flex items-end p-6 relative shrink-0">
          <img 
            src={tempData.imagem_url || "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?q=80&w=800"} 
            className="absolute inset-0 w-full h-full object-cover opacity-80 transition-all duration-500"
            alt="Banner Unidade"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-primary/90 to-transparent" />
          <DialogTitle className="relative text-white text-xl md:text-2xl font-bold flex items-center gap-3">
            <UserPlus className="h-6 w-6" />
            Editar {unit.nome_unidade || unit.unidade || unit.nome || "Unidade"}
          </DialogTitle>
        </div>

        {/* Área de Conteúdo com Rolagem */}
        <ScrollArea className="flex-1 overflow-y-auto px-6 py-4">
          <div className="space-y-6 pb-4">
            {/* Edição de Foto */}
            <div className="space-y-2">
              <Label className="text-xs font-bold uppercase text-muted-foreground tracking-widest flex items-center gap-2">
                <ImageIcon className="h-3 w-3" /> Foto da Unidade
              </Label>
              <div className="flex flex-col sm:flex-row gap-2">
                <Input 
                  placeholder="URL da imagem..." 
                  value={tempData.imagem_url.startsWith('data:') ? 'Imagem Carregada (Base64)' : tempData.imagem_url} 
                  onChange={(e) => setTempData({ ...tempData, imagem_url: e.target.value })}
                  className="bg-muted/50 border-none h-10 flex-1"
                  disabled={tempData.imagem_url.startsWith('data:')}
                />
                <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileChange} />
                <Button variant="outline" className="gap-2 border-primary/20" onClick={() => fileInputRef.current?.click()}>
                  <Upload className="h-4 w-4" /> Subir
                </Button>
              </div>
            </div>

            {/* Destaques */}
            <div className="space-y-3">
              <Label className="text-xs font-bold uppercase text-muted-foreground tracking-widest flex justify-between items-center">
                <span>Destaques</span>
                {hasChanges && (
                  <span className="text-[9px] text-amber-600 flex items-center gap-1 normal-case font-medium">
                    <AlertCircle className="h-2.5 w-2.5" /> Pendente
                  </span>
                )}
              </Label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {[
                  { label: "Captação", field: "dest_captacao", color: "text-blue-500", bg: "bg-blue-500/5", borderColor: "border-blue-500/40" },
                  { label: "Corretor", field: "dest_corretor", color: "text-green-500", bg: "bg-green-500/5", borderColor: "border-green-500/40" },
                  { label: "CRM", field: "dest_crm", color: "text-purple-500", bg: "bg-purple-500/5", borderColor: "border-purple-500/40" },
                ].map((item) => (
                  <div key={item.field} className={`p-3 rounded-xl border-2 flex flex-col gap-2 ${item.bg} ${tempData[item.field as keyof typeof tempData] ? item.borderColor : 'border-muted'}`}>
                    <span className={`text-[10px] font-black uppercase ${item.color}`}>{item.label}</span>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-semibold truncate">{tempData[item.field as keyof typeof tempData] || "Livre"}</span>
                      {tempData[item.field as keyof typeof tempData] && (
                        <button onClick={() => setTempData({ ...tempData, [item.field]: "" })} className="text-muted-foreground hover:text-destructive">
                          <X className="h-3 w-3" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Busca */}
            <div className="space-y-3">
              <Label className="text-xs font-bold uppercase text-muted-foreground tracking-widest">Novo Profissional</Label>
              <div className="relative">
                {loadingSearch ? <Loader2 className="absolute left-3 top-3 h-4 w-4 animate-spin text-primary" /> : <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />}
                <Input placeholder="Nome do corretor..." className="pl-10 h-10 rounded-xl bg-muted/50 border-none" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
              </div>
              <div className="grid gap-2 mt-2">
                {results.map((corretor, idx) => (
                  <div key={idx} className="flex items-center justify-between p-2 rounded-lg bg-background border border-border/50 group">
                    <div className="flex items-center gap-3 overflow-hidden">
                      <Avatar className="h-8 w-8 border flex-shrink-0">
                        <AvatarImage src={corretor.imagem_url} />
                        <AvatarFallback>{corretor.nome.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <span className="text-sm font-bold truncate">{corretor.nome}</span>
                    </div>
                    <div className="flex gap-1">
                      {["CAPT", "CORR", "CRM"].map((role) => (
                        <Button 
                          key={role} 
                          variant="outline" 
                          size="sm" 
                          className="h-7 px-2 text-[9px] font-bold"
                          onClick={() => setTempData({ ...tempData, [role === "CAPT" ? "dest_captacao" : role === "CORR" ? "dest_corretor" : "dest_crm"]: corretor.nome })}
                        >
                          {role}
                        </Button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </ScrollArea>

        {/* Rodapé Fixo */}
        <DialogFooter className="p-4 border-t bg-muted/20 gap-2 sm:gap-0 shrink-0">
          <Button variant="ghost" onClick={() => setOpen(false)} disabled={isSaving}>Cancelar</Button>
          <Button onClick={handleSave} disabled={!hasChanges || isSaving} className="gap-2 min-w-[140px]">
            {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Guardar Alterações
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}