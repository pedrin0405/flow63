"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { 
  Plus, 
  Trash2, 
  GripVertical, 
  Save, 
  ArrowLeft, 
  Palette, 
  Link as LinkIcon,
  Globe,
  Smartphone,
  MessageSquare,
  TrendingUp,
  MousePointer2,
  ChevronRight,
  ImageIcon,
  Layout,
  LayoutGrid,
  Search,
  Check,
  Eye,
  Settings2,
  Share2,
  Youtube,
  Music,
  UserPlus,
  ExternalLink,
  ChevronDown,
  Sparkles,
  Zap,
  AlertCircle,
  CheckCircle2,
  Copy
} from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { motion, AnimatePresence, Reorder } from "framer-motion";
import { cn } from "@/lib/utils";

// IMPORTAÇÃO DOS TEMAS PARA O PREVIEW
import { ModernTheme } from "./bio-themes/modern-theme";
import { GlassTheme } from "./bio-themes/glass-theme";
import { MinimalistTheme } from "./bio-themes/minimalist-theme";

interface BioEditorProps {
  initialData?: any;
  id?: string;
}

export default function BioEditor({ initialData, id }: BioEditorProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [activeSection, setActiveSection] = useState("conteudo");

  const [navigatingId, setNavigatingId] = useState<string | null>(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  const [formData, setFormData] = useState({
    nome: initialData?.nome || "",
    headline: initialData?.headline || "Corretor Imobiliário",
    slug: initialData?.slug || "",
    bio: initialData?.bio || "",
    foto_url: initialData?.foto_url || "",
    links: (initialData?.links || []).map((l: any) => ({ 
      ...l, 
      id: l.id || crypto.randomUUID(),
      schedule: l.schedule || { start: "", end: "" }
    })),
    redes_sociais: initialData?.redes_sociais || [],
    whatsapp: {
      enabled: initialData?.whatsapp?.enabled ?? false,
      number: initialData?.whatsapp?.number || "",
      message: initialData?.whatsapp?.message || "Olá, vim pelo seu Link na Bio"
    },
    lead_capture: {
      enabled: initialData?.lead_capture?.enabled ?? false,
      title: initialData?.lead_capture?.title || "Receba novidades",
      button_text: initialData?.lead_capture?.button_text || "Cadastrar"
    },
    seo: {
      title: initialData?.seo?.title || "",
      description: initialData?.seo?.description || ""
    },
    featured_properties: {
      enabled: initialData?.featured_properties?.enabled ?? false,
      title: initialData?.featured_properties?.title || "Imóveis em Destaque",
      items: initialData?.featured_properties?.items || []
    },
    tema: {
      preset: initialData?.tema?.preset || "modern",
      bg_color: initialData?.tema?.bg_color || "#0f172a",
      text_color: initialData?.tema?.text_color || "#f8fafc",
      button_bg: initialData?.tema?.button_bg || "#3b82f6",
      button_text: initialData?.tema?.button_text || "#ffffff",
      button_style: initialData?.tema?.button_style || "rounded-xl",
      foto_posicao: initialData?.tema?.foto_posicao || "center"
    }
  });

  const [slugStatus, setSlugStatus] = useState<'idle' | 'checking' | 'available' | 'taken' | 'invalid'>('idle');

  useEffect(() => {
    const checkSlug = async () => {
      if (!formData.slug) {
        setSlugStatus('idle');
        return;
      }

      const slugRegex = /^[a-z0-9-]+$/;
      if (!slugRegex.test(formData.slug)) {
        setSlugStatus('invalid');
        return;
      }

      if (id && formData.slug === initialData?.slug) {
        setSlugStatus('available');
        return;
      }

      setSlugStatus('checking');
      
      try {
        const { data, error } = await supabase
          .from("bio_pages")
          .select("id")
          .eq("slug", formData.slug)
          .maybeSingle();

        if (error) throw error;

        if (data) {
          setSlugStatus('taken');
        } else {
          setSlugStatus('available');
        }
      } catch (err) {
        console.error("Error checking slug:", err);
        setSlugStatus('idle');
      }
    };

    const timer = setTimeout(() => {
      checkSlug();
    }, 500);

    return () => clearTimeout(timer);
  }, [formData.slug, id, initialData?.slug]);

  const applyPreset = (preset: string) => {
    const presets: Record<string, any> = {
      modern: {
        preset: "modern",
        bg_color: "#050505", 
        text_color: "#ffffff", 
        button_bg: "#e91c74", 
        button_text: "#ffffff",
        button_style: "rounded-xl"
      },
      glass: {
        preset: "glass",
        bg_color: "#050505", 
        text_color: "#ffffff", 
        button_bg: "#e91c74", 
        button_text: "#ffffff",
        button_style: "rounded-2xl"
      },
      minimalist: {
        preset: "minimalist",
        bg_color: "#050505", 
        text_color: "#ffffff", 
        button_bg: "#e91c74", 
        button_text: "#ffffff",
        button_style: "rounded-none"
      }
    };
    setFormData({ ...formData, tema: presets[preset] });
  };

  const [brokerSearchQuery, setBrokerSearchQuery] = useState("");
  const [brokerSearchResults, setBrokerSearchResults] = useState<any[]>([]);
  const [searchingBrokers, setSearchingBrokers] = useState(false);

  const handleSearchProperties = async () => {
    if (!searchQuery) return;
    setLoading(true);
    try {
      const isNumeric = /^\d+$/.test(searchQuery);
      
      const buildQuery = (table: string) => {
        let q = supabase.from(table).select("codigo, titulo, urlfotoprincipal, valor, endereco, bairro, cidade, tipo");
        
        // Se for numérico, busca por código OU texto. Se não, apenas texto.
        // O Supabase permite misturar operadores no .or()
        const orFilter = isNumeric 
          ? `codigo.eq.${searchQuery},titulo.ilike.%${searchQuery}%,endereco.ilike.%${searchQuery}%,bairro.ilike.%${searchQuery}%`
          : `titulo.ilike.%${searchQuery}%,endereco.ilike.%${searchQuery}%,bairro.ilike.%${searchQuery}%`;
        
        return q.or(orFilter).limit(8);
      };

      const [pmwRes, auxRes] = await Promise.all([
        buildQuery("imovel_pmw"),
        buildQuery("imovel_aux")
      ]);

      // Ignora erros de tabelas que podem não existir no ambiente
      const pmwData = pmwRes.data || [];
      const auxData = auxRes.data || [];
      const combined = [...pmwData, ...auxData];

      const mapped = combined.map((u: any) => ({
        id: u.codigo?.toString() || Math.random().toString(),
        titulo: u.titulo || u.endereco || u.bairro || "Imóvel",
        preco: u.valor || "Sob consulta",
        localizacao: `${u.bairro || ""} - ${u.cidade || ""}`,
        imagem: u.urlfotoprincipal || "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=400",
        tags: [u.tipo].filter(Boolean)
      }));

      setSearchResults(mapped);
      if (mapped.length === 0) toast.info("Nenhum imóvel encontrado");
    } catch (error: any) {
      console.error("Erro na busca de imóveis:", error);
      toast.error(`Erro ao buscar imóveis: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleSearchBrokers = async () => {
    if (!brokerSearchQuery) return;
    setSearchingBrokers(true);
    try {
      const buildQuery = (table: string) => 
        supabase.from(table)
          .select("nome, imagem_url, unidade, departamento")
          .ilike("nome", `%${brokerSearchQuery}%`)
          .limit(5);

      const [pmwRes, auxRes] = await Promise.all([
        buildQuery("corretores_pmw"),
        buildQuery("corretores_aux")
      ]);

      const combined = [...(pmwRes.data || []), ...(auxRes.data || [])];
      setBrokerSearchResults(combined);
      if (combined.length === 0) toast.info("Nenhum corretor encontrado");
    } catch (error: any) {
      console.error("Erro na busca de corretores:", error);
    } finally {
      setSearchingBrokers(false);
    }
  };

  const applyBrokerData = (broker: any) => {
    // Gerar slug a partir dos 2 primeiros nomes
    const generatedSlug = broker.nome
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .join("-")
      .toLowerCase()
      .normalize('NFD').replace(/[\u0300-\u036f]/g, ""); // Remove acentos para garantir URL válida

    setFormData({
      ...formData,
      nome: broker.nome,
      slug: generatedSlug,
      foto_url: broker.imagem_url || formData.foto_url,
    });
    setBrokerSearchResults([]);
    setBrokerSearchQuery("");
    toast.success("Dados do corretor aplicados!");
  };

  const togglePropertySelection = (imovel: any) => {
    const items = formData.featured_properties.items || [];
    const isSelected = items.find((i: any) => i.id === imovel.id);
    if (isSelected) {
      setFormData({
        ...formData,
        featured_properties: { ...formData.featured_properties, items: items.filter((i: any) => i.id !== imovel.id) }
      });
      toast.error("Imóvel removido do portfólio");
    } else {
      setFormData({
        ...formData,
        featured_properties: { ...formData.featured_properties, items: [...items, imovel] }
      });
      toast.success("Imóvel adicionado ao portfólio");
    }
  };

  const getAnimationProps = (type: string) => {
    switch (type) {
      case "pulse": return { animate: { scale: [1, 1.05, 1] }, transition: { repeat: Infinity, duration: 2 } };
      case "vibrate": return { animate: { x: [-1, 1, -1, 1, 0] }, transition: { repeat: Infinity, duration: 0.5, repeatDelay: 2 } };
      case "glow": return { animate: { boxShadow: ["0 0 0px rgba(0,0,0,0)", "0 0 20px rgba(0,0,0,0.2)", "0 0 0px rgba(0,0,0,0)"] }, transition: { repeat: Infinity, duration: 2 } };
      default: return {};
    }
  };

  const addLink = () => {
    setFormData({
      ...formData,
      links: [...(formData.links || []), { 
        id: crypto.randomUUID(),
        title: "Novo Link", 
        url: "https://", 
        icon: "link",
        animation: "none",
        type: "link",
        schedule: { start: "", end: "" }
      }]
    });
    toast.info("Novo link adicionado");
  };

  const handleReorderLinks = (newLinks: any[]) => {
    setFormData({ ...formData, links: newLinks });
  };

  const removeLink = (id: string) => {
    setFormData({ ...formData, links: formData.links.filter((l: any) => l.id !== id) });
    toast.error("Link removido");
  };

  const updateLink = (id: string, field: string, value: any) => {
    const newLinks = formData.links.map((link: any) => {
      if (link.id === id) {
        if (field.includes(".")) {
          const [parent, child] = field.split(".");
          return { ...link, [parent]: { ...(link[parent] || {}), [child]: value } };
        }
        return { ...link, [field]: value };
      }
      return link;
    });
    setFormData({ ...formData, links: newLinks });
  };

  const handleSave = async () => {
    if (slugStatus !== 'available') {
      toast.error("Por favor, escolha um link (slug) válido e disponível antes de salvar.");
      return;
    }
    
    const promise = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuário não autenticado");

      const payload = {
        ...formData,
        user_id: user.id,
        updated_at: new Date().toISOString()
      };

      let error;
      if (id) {
        ({ error } = await supabase.from("bio_pages").update(payload).eq("id", id));
      } else {
        ({ error } = await supabase.from("bio_pages").insert([payload]));
      }

      if (error) throw error;
      setShowSuccessModal(true);
      router.refresh();
      return "Página publicada!";
    };

    toast.promise(promise(), {
      loading: 'Publicando...',
      success: (data) => data,
      error: (err) => `Erro: ${err.message}`,
    });
  };

  const sidebarItems = [
    { id: "conteudo", label: "Conteúdo", icon: LinkIcon },
    { id: "design", label: "Aparência", icon: Palette },
    { id: "config", label: "WhatsApp", icon: MessageSquare },
    { id: "extra", label: "Portfólio", icon: LayoutGrid },
    { id: "seo", label: "SEO", icon: Globe },
  ];

  // Lógica de Filtro para o Preview (Sincronizada com o Client)
  const now = new Date();
  const visibleLinks = formData.links.filter((link: any) => {
    if (!link.schedule?.start && !link.schedule?.end) return true;
    const start = link.schedule.start ? new Date(link.schedule.start) : null;
    const end = link.schedule.end ? new Date(link.schedule.end) : null;
    if (start && now < start) return false;
    if (end && now > end) return false;
    return true;
  });

  return (
    <div className="flex flex-col h-screen bg-[#F5F5F7] dark:bg-black overflow-hidden font-sans">
      <header className="z-[100] h-14 shrink-0 px-6 flex items-center justify-between backdrop-blur-xl bg-white/80 dark:bg-black/80 border-b border-black/[0.05] dark:border-white/[0.05] sticky top-0">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => router.back()} className="h-8 w-8 rounded-full hover:bg-black/5 transition-colors">
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="flex flex-col">
            <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest leading-none mb-0.5">Flow Bio</span>
            <span className="text-sm font-bold tracking-tight truncate max-w-[150px]">{formData.nome || "Sem título"}</span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Button variant="ghost" className="h-9 px-4 rounded-full text-[10px] font-bold uppercase tracking-widest hover:bg-black/5">
            <Share2 className="h-3 w-3 mr-2 opacity-60" /> Share
          </Button>
          <Button onClick={handleSave} disabled={loading} className="h-9 px-6 rounded-full bg-black dark:bg-white text-white dark:text-black text-[10px] font-black uppercase tracking-widest shadow-lg hover:scale-[1.02] active:scale-95 transition-all">
            {loading ? "..." : "Publicar"}
          </Button>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden flex-col md:flex-row">
        {/* SIDEBAR */}
        <nav className="w-full md:w-16 lg:w-52 bg-white dark:bg-black border-r border-black/[0.03] p-2 flex flex-row md:flex-col gap-1 z-50">
          {sidebarItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveSection(item.id)}
              className={cn(
                "flex-1 md:flex-none flex items-center justify-center lg:justify-start gap-3 p-2.5 rounded-xl transition-all group relative",
                activeSection === item.id 
                ? "bg-black/[0.03] dark:bg-white/[0.05] text-blue-600" 
                : "text-muted-foreground hover:text-black hover:bg-black/[0.02]"
              )}
            >
              <item.icon className={cn("h-4 w-4 shrink-0 transition-transform", activeSection === item.id ? "opacity-100" : "opacity-40")} />
              <span className="hidden lg:block text-[11px] font-bold uppercase tracking-widest">{item.label}</span>
            </button>
          ))}
        </nav>

        {/* EDITOR CANVAS */}
        <main className="flex-1 overflow-y-auto p-4 md:p-10 lg:p-16 custom-scrollbar bg-white dark:bg-[#050505]">
          <div className="max-w-xl mx-auto pb-20">
            <AnimatePresence mode="wait">
              {activeSection === "conteudo" && (
                <motion.div key="conteudo" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }} className="space-y-12">
                  <section className="space-y-8">
                    <div className="flex items-center gap-3">
                      <div className="h-6 w-1 bg-blue-600 rounded-full" />
                      <h3 className="text-xl font-black tracking-tight">Identidade</h3>
                    </div>

                    {/* MAGIC FILL CORRETOR */}
                    <div className="p-5 rounded-[2rem] bg-blue-600/[0.03] border border-blue-600/10 space-y-5">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="p-1.5 bg-blue-600 rounded-lg">
                            <Sparkles className="w-3.5 h-3.5 text-white" />
                          </div>
                          <span className="text-[10px] font-black uppercase tracking-[2px] text-blue-600">Magic Fill Corretor</span>
                        </div>
                        {searchingBrokers && <Zap className="w-3 h-3 text-blue-600 animate-pulse" />}
                      </div>

                      <div className="relative group">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-blue-500 transition-colors" />
                        <Input 
                          placeholder="Buscar corretor por nome..." 
                          className="h-11 pl-11 rounded-xl bg-white border-none focus:ring-4 focus:ring-blue-500/10 text-sm font-bold shadow-sm"
                          value={brokerSearchQuery} 
                          onChange={(e) => setBrokerSearchQuery(e.target.value)}
                          onKeyDown={(e) => e.key === "Enter" && handleSearchBrokers()}
                        />
                        <Button 
                          size="sm" 
                          variant="ghost"
                          onClick={handleSearchBrokers} 
                          disabled={searchingBrokers}
                          className="absolute right-2 top-1/2 -translate-y-1/2 h-8 rounded-lg text-blue-600 hover:bg-blue-600/10 font-black text-[9px] uppercase tracking-widest"
                        >
                          {searchingBrokers ? "..." : "Buscar"}
                        </Button>
                      </div>

                      {brokerSearchResults.length > 0 && (
                        <div className="grid grid-cols-1 gap-2 pt-2 animate-in fade-in slide-in-from-top-2">
                          {brokerSearchResults.map((b, idx) => (
                            <div 
                              key={idx} 
                              onClick={() => applyBrokerData(b)}
                              className="flex items-center gap-4 p-3 bg-white rounded-2xl border border-black/[0.05] hover:border-blue-600/30 hover:shadow-lg cursor-pointer transition-all hover:scale-[1.01] group"
                            >
                              <div className="w-10 h-10 rounded-full overflow-hidden shadow-inner bg-muted">
                                <img src={b.imagem_url || "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100"} className="w-full h-full object-cover" />
                              </div>
                              <div className="flex-1">
                                <div className="text-[11px] font-black">{b.nome}</div>
                                <div className="text-[9px] font-bold opacity-40 uppercase tracking-widest">{b.unidade || b.departamento || "Consultor"}</div>
                              </div>
                              <ChevronRight className="w-4 h-4 text-blue-600 opacity-0 group-hover:opacity-100 transition-all transform group-hover:translate-x-1" />
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                    
                    <div className="flex flex-col md:flex-row gap-10 items-start">
                      <div className="relative group shrink-0 self-center md:self-start">
                        <div className="w-20 h-20 rounded-full bg-white dark:bg-white/5 border border-black/[0.05] shadow-xl overflow-hidden relative cursor-pointer">
                          {formData.foto_url ? (
                            <img 
                              src={formData.foto_url} 
                              className="w-full h-full object-cover" 
                              style={{ objectPosition: formData.tema.foto_posicao || "center" }}
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center bg-muted opacity-30">
                              <ImageIcon className="h-6 w-6" />
                            </div>
                          )}
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                            <Plus className="h-5 w-5 text-white" />
                          </div>
                        </div>
                      </div>

                      <div className="flex-1 space-y-5 w-full">
                        <div className="space-y-2">
                          <Label className="text-[9px] font-black uppercase opacity-40 tracking-widest ml-1">Nome Profissional</Label>
                          <Input value={formData.nome} onChange={(e) => setFormData({...formData, nome: e.target.value})} className="h-10 rounded-xl bg-black/[0.02] border-none focus:ring-4 focus:ring-blue-500/10 transition-all font-bold text-sm"/>
                        </div>

                        <div className="space-y-2">
                          <Label className="text-[9px] font-black uppercase opacity-40 tracking-widest ml-1">Título / Cargo</Label>
                          <Input 
                            value={formData.headline} 
                            onChange={(e) => setFormData({...formData, headline: e.target.value})} 
                            placeholder="Ex: Corretor Imobiliário"
                            className="h-10 rounded-xl bg-black/[0.02] border-none focus:ring-4 focus:ring-blue-500/10 transition-all font-bold text-sm"
                          />
                        </div>

                        <div className="space-y-2">
                          <div className="flex items-center justify-between ml-1">
                            <Label className="text-[9px] font-black uppercase opacity-40 tracking-widest">Link da Página (slug)</Label>
                            <div className="flex items-center gap-1">
                              {slugStatus === 'checking' && <Zap className="w-2.5 h-2.5 text-blue-500 animate-pulse" />}
                              {slugStatus === 'available' && <CheckCircle2 className="w-2.5 h-2.5 text-emerald-500" />}
                              {slugStatus === 'taken' && <AlertCircle className="w-2.5 h-2.5 text-destructive" />}
                              {slugStatus === 'invalid' && <AlertCircle className="w-2.5 h-2.5 text-amber-500" />}
                              <span className={cn(
                                "text-[8px] font-bold uppercase tracking-wider",
                                slugStatus === 'available' ? "text-emerald-500" : 
                                slugStatus === 'taken' ? "text-destructive" : 
                                slugStatus === 'invalid' ? "text-amber-500" : "text-blue-500"
                              )}>
                                {slugStatus === 'idle' && "Digite o link"}
                                {slugStatus === 'checking' && "Verificando..."}
                                {slugStatus === 'available' && "Disponível"}
                                {slugStatus === 'taken' && "Já em uso"}
                                {slugStatus === 'invalid' && "Formato inválido"}
                              </span>
                            </div>
                          </div>
                          <div className="relative group">
                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xs font-bold opacity-30 pointer-events-none">bio/</span>
                            <Input 
                              value={formData.slug} 
                              onChange={(e) => setFormData({...formData, slug: e.target.value.toLowerCase().trim()})} 
                              placeholder="seu-nome"
                              className={cn(
                                "h-10 rounded-xl bg-black/[0.02] border-none focus:ring-4 transition-all font-bold text-sm pl-[42px]",
                                slugStatus === 'available' ? "focus:ring-emerald-500/10" : 
                                slugStatus === 'taken' ? "focus:ring-destructive/10" : "focus:ring-blue-500/10"
                              )}
                            />
                          </div>
                          <p className="text-[8px] text-muted-foreground ml-1 italic">* Use apenas letras, números e hífens.</p>
                        </div>

                        <div className="space-y-2">
                          <Label className="text-[9px] font-black uppercase opacity-40 tracking-widest ml-1">Enquadramento da Foto</Label>
                          <Select 
                            value={formData.tema.foto_posicao || "center"} 
                            onValueChange={(v) => setFormData({...formData, tema: {...formData.tema, foto_posicao: v}})}
                          >
                            <SelectTrigger className="h-10 rounded-xl bg-black/[0.02] border-none focus:ring-4 focus:ring-blue-500/10 transition-all font-bold text-sm">
                              <SelectValue placeholder="Selecione o enquadramento" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="top">Topo (Focar rosto)</SelectItem>
                              <SelectItem value="center">Centro (Padrão)</SelectItem>
                              <SelectItem value="bottom">Fundo</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label className="text-[9px] font-black uppercase opacity-40 tracking-widest ml-1">Descrição curta</Label>
                          <Textarea value={formData.bio} onChange={(e) => setFormData({...formData, bio: e.target.value})} className="min-h-[80px] rounded-xl bg-black/[0.02] border-none focus:ring-4 focus:ring-blue-500/10 transition-all text-xs font-medium resize-none p-4" placeholder="Especialista em imóveis de luxo..."/>
                        </div>
                      </div>
                    </div>
                  </section>

                  <section className="space-y-8">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="h-6 w-1 bg-blue-600 rounded-full" />
                        <h3 className="text-xl font-black tracking-tight">Links e Botões</h3>
                      </div>
                      <Button onClick={addLink} variant="ghost" className="h-8 rounded-full text-[9px] font-black uppercase tracking-widest bg-blue-600/[0.05] text-blue-600 hover:bg-blue-600 hover:text-white transition-all">
                        <Plus className="h-3 w-3 mr-1.5" /> Adicionar
                      </Button>
                    </div>

                    <Reorder.Group axis="y" values={formData.links} onReorder={handleReorderLinks} className="space-y-3">
                      {formData.links.map((link: any) => (
                        <Reorder.Item key={link.id} value={link} className="group">
                          <div className="bg-white dark:bg-[#111111] border border-black/[0.03] p-4 rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300">
                            <div className="flex items-center gap-4">
                              <div className="cursor-grab active:cursor-grabbing p-2 rounded-lg hover:bg-black/5 text-muted-foreground transition-colors opacity-20 group-hover:opacity-100">
                                <GripVertical className="h-4 w-4" />
                              </div>
                              <div className="flex-1 space-y-3">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                  <Input placeholder="Título do Botão" value={link.title} onChange={(e) => updateLink(link.id, "title", e.target.value)} className="bg-transparent border-none text-sm font-black h-8 px-0 focus:ring-0 rounded-none"/>
                                  <div className="flex items-center gap-2 overflow-hidden border-b border-black/[0.05]">
                                    <ExternalLink className="h-3 w-3 opacity-20 shrink-0" />
                                    <Input placeholder="URL de destino" value={link.url} onChange={(e) => updateLink(link.id, "url", e.target.value)} className="bg-transparent border-none text-[11px] font-bold text-blue-500 h-8 px-0 focus:ring-0 rounded-none truncate"/>
                                  </div>
                                </div>
                                
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-2">
                                  <div className="space-y-1">
                                    <Label className="text-[8px] font-black uppercase opacity-30 tracking-widest">Tipo</Label>
                                    <Select value={link.type || "link"} onValueChange={(v) => updateLink(link.id, "type", v)}>
                                      <SelectTrigger className="h-7 text-[10px] bg-black/[0.02] border-none font-bold rounded-lg"><SelectValue /></SelectTrigger>
                                      <SelectContent><SelectItem value="link">Link</SelectItem><SelectItem value="youtube">YouTube</SelectItem><SelectItem value="spotify">Spotify</SelectItem><SelectItem value="vcard">VCard</SelectItem></SelectContent>
                                    </Select>
                                  </div>
                                  <div className="space-y-1">
                                    <Label className="text-[8px] font-black uppercase opacity-30 tracking-widest">Efeito</Label>
                                    <Select value={link.animation || "none"} onValueChange={(v) => updateLink(link.id, "animation", v)}>
                                      <SelectTrigger className="h-7 text-[10px] bg-black/[0.02] border-none font-bold rounded-lg"><SelectValue /></SelectTrigger>
                                      <SelectContent><SelectItem value="none">Nenhum</SelectItem><SelectItem value="pulse">Pulse</SelectItem><SelectItem value="vibrate">Vibrate</SelectItem><SelectItem value="glow">Glow</SelectItem></SelectContent>
                                    </Select>
                                  </div>
                                  <div className="col-span-2 space-y-1">
                                    <Label className="text-[8px] font-black uppercase opacity-30 tracking-widest">Exibição</Label>
                                    <div className="flex gap-1">
                                      <Input type="date" value={link.schedule?.start} onChange={(e) => updateLink(link.id, "schedule.start", e.target.value)} className="h-7 text-[9px] bg-black/[0.02] border-none font-bold px-2 rounded-lg w-full"/>
                                      <Input type="date" value={link.schedule?.end} onChange={(e) => updateLink(link.id, "schedule.end", e.target.value)} className="h-7 text-[9px] bg-black/[0.02] border-none font-bold px-2 rounded-lg w-full"/>
                                    </div>
                                  </div>
                                </div>
                              </div>
                              <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full text-destructive hover:bg-destructive/10 self-start" onClick={() => removeLink(link.id)}>
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            </div>
                          </div>
                        </Reorder.Item>
                      ))}
                    </Reorder.Group>
                  </section>
                </motion.div>
              )}

              {activeSection === "design" && (
                <motion.div key="design" initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.98 }} transition={{ duration: 0.2 }} className="space-y-12">
                  <section className="space-y-8">
                    <div className="flex items-center gap-3">
                      <div className="h-6 w-1 bg-blue-600 rounded-full" />
                      <h3 className="text-xl font-black tracking-tight">Estilos Apple</h3>
                    </div>
                    <div className="grid grid-cols-3 gap-4">
                      {["modern", "glass", "minimalist"].map((p) => (
                        <button 
                          key={p}
                          onClick={() => applyPreset(p)}
                          className={cn(
                            "flex flex-col items-center gap-3 p-5 rounded-3xl border-2 transition-all duration-500",
                            formData.tema.preset === p ? "border-blue-600 bg-white dark:bg-white/5 shadow-2xl scale-[1.02]" : "border-transparent bg-black/[0.02] opacity-40"
                          )}
                        >
                          <div className={cn(
                            "w-8 h-8 rounded-full flex items-center justify-center shadow-lg",
                            p === "modern" ? "bg-[#0f172a] text-white" : p === "glass" ? "bg-white text-black border border-black/5" : "bg-black text-white"
                          )}>
                            <Layout className="h-4 w-4" />
                          </div>
                          <span className="text-[9px] font-black uppercase tracking-widest">{p}</span>
                        </button>
                      ))}
                    </div>
                  </section>

                  {/* PRESETS DE CORES FACILITADOS */}
                  <section className="space-y-6">
                    <div className="flex items-center gap-3">
                      <div className="h-6 w-1 bg-[#e91c74] rounded-full" />
                      <h3 className="text-xl font-black tracking-tight text-[#e91c74]">Modo de Cores</h3>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <button 
                        onClick={() => setFormData({
                          ...formData, 
                          tema: { 
                            ...formData.tema, 
                            bg_color: "#ffffff", 
                            text_color: "#000000", 
                            button_bg: "#e91c74", 
                            button_text: "#ffffff" 
                          }
                        })}
                        className="flex items-center justify-between p-5 rounded-[2rem] bg-white border-2 border-black/5 shadow-sm hover:shadow-xl transition-all group"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center border border-black/5">
                            <Sparkles className="w-4 h-4 text-[#e91c74]" />
                          </div>
                          <span className="text-[11px] font-black uppercase tracking-widest text-black">Modo Claro</span>
                        </div>
                        <div className="flex gap-1">
                          <div className="w-3 h-3 rounded-full bg-[#e91c74]" />
                          <div className="w-3 h-3 rounded-full bg-slate-200" />
                        </div>
                      </button>

                      <button 
                        onClick={() => setFormData({
                          ...formData, 
                          tema: { 
                            ...formData.tema, 
                            bg_color: "#050505", 
                            text_color: "#ffffff", 
                            button_bg: "#e91c74", 
                            button_text: "#ffffff" 
                          }
                        })}
                        className="flex items-center justify-between p-5 rounded-[2rem] bg-[#111111] border-2 border-white/5 shadow-sm hover:shadow-xl transition-all group"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center border border-white/10">
                            <Sparkles className="w-4 h-4 text-[#e91c74]" />
                          </div>
                          <span className="text-[11px] font-black uppercase tracking-widest text-white">Modo Escuro</span>
                        </div>
                        <div className="flex gap-1">
                          <div className="w-3 h-3 rounded-full bg-[#e91c74]" />
                          <div className="w-3 h-3 rounded-full bg-white/10" />
                        </div>
                      </button>
                    </div>
                  </section>

                  <section className="p-8 rounded-[2.5rem] bg-black/[0.01] border border-black/[0.03] space-y-10">
                    <h4 className="text-[10px] font-black tracking-[3px] uppercase opacity-30 text-center">Ajuste Fino</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                      <div className="space-y-6">
                        <div className="flex items-center justify-between group">
                          <span className="text-[11px] font-bold uppercase tracking-widest opacity-60">Fundo</span>
                          <div className="flex items-center gap-3 bg-white dark:bg-black px-3 py-1.5 rounded-full shadow-sm border border-black/5">
                            <span className="text-[9px] font-mono opacity-40">{formData.tema.bg_color}</span>
                            <input type="color" value={formData.tema.bg_color} onChange={(e) => setFormData({...formData, tema: {...formData.tema, bg_color: e.target.value}})} className="w-5 h-5 rounded-full border-none cursor-pointer overflow-hidden"/>
                          </div>
                        </div>
                        <div className="flex items-center justify-between group">
                          <span className="text-[11px] font-bold uppercase tracking-widest opacity-60">Textos</span>
                          <div className="flex items-center gap-3 bg-white dark:bg-black px-3 py-1.5 rounded-full shadow-sm border border-black/5">
                            <span className="text-[9px] font-mono opacity-40">{formData.tema.text_color}</span>
                            <input type="color" value={formData.tema.text_color} onChange={(e) => setFormData({...formData, tema: {...formData.tema, text_color: e.target.value}})} className="w-5 h-5 rounded-full border-none cursor-pointer overflow-hidden"/>
                          </div>
                        </div>
                      </div>
                      <div className="space-y-6 border-l border-black/[0.05] pl-10">
                        <div className="flex items-center justify-between group">
                          <span className="text-[11px] font-bold uppercase tracking-widest opacity-60">Botões</span>
                          <div className="flex items-center gap-3 bg-white dark:bg-black px-3 py-1.5 rounded-full shadow-sm border border-black/5">
                            <span className="text-[9px] font-mono opacity-40">{formData.tema.button_bg}</span>
                            <input type="color" value={formData.tema.button_bg} onChange={(e) => setFormData({...formData, tema: {...formData.tema, button_bg: e.target.value}})} className="w-5 h-5 rounded-full border-none cursor-pointer overflow-hidden"/>
                          </div>
                        </div>
                        <div className="flex items-center justify-between group">
                          <span className="text-[11px] font-bold uppercase tracking-widest opacity-60">Labels</span>
                          <div className="flex items-center gap-3 bg-white dark:bg-black px-3 py-1.5 rounded-full shadow-sm border border-black/5">
                            <span className="text-[9px] font-mono opacity-40">{formData.tema.button_text}</span>
                            <input type="color" value={formData.tema.button_text} onChange={(e) => setFormData({...formData, tema: {...formData.tema, button_text: e.target.value}})} className="w-5 h-5 rounded-full border-none cursor-pointer overflow-hidden"/>
                          </div>
                        </div>
                      </div>
                    </div>
                  </section>
                </motion.div>
              )}

              {activeSection === "config" && (
                <motion.div key="config" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }} className="space-y-8">
                  <section className="p-8 rounded-[2.5rem] bg-white dark:bg-[#111111] shadow-2xl space-y-10 border border-black/[0.03]">
                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <h3 className="text-xl font-black tracking-tight">WhatsApp</h3>
                        <p className="text-[11px] font-bold opacity-40 uppercase tracking-widest">Contato flutuante</p>
                      </div>
                      <Switch checked={formData.whatsapp.enabled} onCheckedChange={(v) => setFormData({...formData, whatsapp: {...formData.whatsapp, enabled: v}})} className="data-[state=checked]:bg-green-500 scale-110"/>
                    </div>
                    
                    {formData.whatsapp.enabled && (
                      <div className="grid grid-cols-1 gap-6 pt-6 animate-in fade-in slide-in-from-top-4">
                        <div className="space-y-2">
                          <Label className="text-[9px] font-black uppercase opacity-40 tracking-widest ml-1">WhatsApp (com DDD)</Label>
                          <Input placeholder="Ex: 63999999999" value={formData.whatsapp.number} onChange={(e) => setFormData({...formData, whatsapp: {...formData.whatsapp, number: e.target.value}})} className="h-10 rounded-xl bg-black/[0.02] border-none font-bold"/>
                        </div>
                        <div className="space-y-2">
                          <Label className="text-[9px] font-black uppercase opacity-40 tracking-widest ml-1">Mensagem Inicial</Label>
                          <Input placeholder="Olá, vim pelo seu Link na Bio" value={formData.whatsapp.message} onChange={(e) => setFormData({...formData, whatsapp: {...formData.whatsapp, message: e.target.value}})} className="h-10 rounded-xl bg-black/[0.02] border-none font-medium"/>
                        </div>
                      </div>
                    )}
                  </section>
                </motion.div>
              )}

              {activeSection === "extra" && (
                <motion.div key="extra" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }} className="space-y-8">
                  <section className="p-8 rounded-[2.5rem] bg-white dark:bg-[#111111] shadow-2xl space-y-8 border border-black/[0.03]">
                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <h3 className="text-xl font-black tracking-tight">Imóveis</h3>
                        <p className="text-[11px] font-bold opacity-40 uppercase tracking-widest">Portfolio real</p>
                      </div>
                      <Switch checked={formData.featured_properties.enabled} onCheckedChange={(v) => setFormData({...formData, featured_properties: {...formData.featured_properties, enabled: v}})} className="data-[state=checked]:bg-blue-600 scale-110"/>
                    </div>

                    {formData.featured_properties.enabled && (
                      <div className="space-y-10 pt-4 animate-in fade-in slide-in-from-top-4">
                        {/* BUSCADOR MAGIC FILL IMÓVEIS */}
                        <div className="p-5 rounded-[2rem] bg-blue-600/[0.03] border border-blue-600/10 space-y-5">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <div className="p-1.5 bg-blue-600 rounded-lg">
                                <Sparkles className="w-3.5 h-3.5 text-white" />
                              </div>
                              <span className="text-[10px] font-black uppercase tracking-[2px] text-blue-600">Magic Fill Portfólio</span>
                            </div>
                            {loading && <Zap className="w-3 h-3 text-blue-600 animate-pulse" />}
                          </div>

                          <div className="relative group">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-blue-500 transition-colors" />
                            <Input 
                              placeholder="Buscar por código, título ou bairro..." 
                              className="h-11 pl-11 rounded-xl bg-white border-none focus:ring-4 focus:ring-blue-500/10 text-sm font-bold shadow-sm"
                              value={searchQuery} 
                              onChange={(e) => setSearchQuery(e.target.value)}
                              onKeyDown={(e) => e.key === "Enter" && handleSearchProperties()}
                            />
                            <Button 
                              size="sm" 
                              variant="ghost"
                              onClick={handleSearchProperties} 
                              disabled={loading}
                              className="absolute right-2 top-1/2 -translate-y-1/2 h-8 rounded-lg text-blue-600 hover:bg-blue-600/10 font-black text-[9px] uppercase tracking-widest"
                            >
                              {loading ? "..." : "Buscar"}
                            </Button>
                          </div>

                          {searchResults.length > 0 && (
                            <div className="grid grid-cols-1 gap-3 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                              {searchResults.map(i => {
                                const isSelected = (formData.featured_properties.items || []).some((s:any) => s.id === i.id);
                                return (
                                  <div 
                                    key={i.id} 
                                    onClick={() => togglePropertySelection(i)} 
                                    className={cn(
                                      "p-3 rounded-2xl border-2 cursor-pointer flex items-center gap-4 transition-all duration-300 hover:scale-[1.01] group bg-white",
                                      isSelected ? "border-blue-600 shadow-md" : "border-black/[0.03] hover:border-blue-600/20"
                                    )}
                                  >
                                    <div className="w-14 h-14 rounded-xl overflow-hidden shadow-inner shrink-0">
                                      <img src={i.imagem} className="w-full h-full object-cover" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <div className="text-[11px] font-black truncate">{i.titulo}</div>
                                      <div className="flex items-center gap-2 mt-1">
                                        <span className="text-[9px] font-bold text-blue-600">{i.preco}</span>
                                        <span className="text-[8px] font-bold opacity-30 uppercase tracking-widest truncate">{i.localizacao}</span>
                                      </div>
                                    </div>
                                    <div className={cn("w-6 h-6 rounded-full flex items-center justify-center transition-all", isSelected ? "bg-blue-600 text-white" : "bg-black/5 opacity-40 group-hover:opacity-100")}>
                                      {isSelected ? <Check className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>

                        {/* LISTAGEM DE SELECIONADOS */}
                        <div className="space-y-5">
                          <div className="flex items-center justify-between px-1">
                            <Label className="text-[10px] font-black uppercase opacity-40 tracking-widest">Imóveis Selecionados ({formData.featured_properties.items?.length || 0})</Label>
                            {formData.featured_properties.items?.length > 0 && (
                              <button 
                                onClick={() => setFormData({...formData, featured_properties: {...formData.featured_properties, items: []}})}
                                className="text-[9px] font-bold text-destructive uppercase tracking-widest hover:underline"
                              >
                                Limpar tudo
                              </button>
                            )}
                          </div>

                          <div className="grid grid-cols-2 gap-4">
                            {formData.featured_properties.items?.map((item: any) => (
                              <div key={item.id} className="group relative bg-black/[0.02] border border-black/[0.05] rounded-2xl p-3 flex flex-col gap-3 animate-in zoom-in-95 duration-200">
                                <div className="aspect-video w-full rounded-xl overflow-hidden relative shadow-sm">
                                  <img src={item.imagem} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                                  <button 
                                    onClick={() => togglePropertySelection(item)}
                                    className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-white/90 backdrop-blur-sm text-destructive flex items-center justify-center shadow-lg hover:scale-110 transition-all opacity-0 group-hover:opacity-100"
                                  >
                                    <Trash2 className="w-3 h-3" />
                                  </button>
                                </div>
                                <div className="space-y-1">
                                  <div className="text-[10px] font-black truncate leading-tight">{item.titulo}</div>
                                  <div className="text-[9px] font-bold text-blue-600">{item.preco}</div>
                                </div>
                              </div>
                            ))}

                            {(!formData.featured_properties.items || formData.featured_properties.items.length === 0) && (
                              <div className="col-span-2 py-12 text-center border-2 border-dashed border-black/5 rounded-[2rem] opacity-20">
                                <LayoutGrid className="w-6 h-6 mx-auto mb-2" />
                                <p className="text-[9px] font-bold uppercase tracking-widest">Nenhum imóvel selecionado</p>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                  </section>
                </motion.div>
              )}

              {activeSection === "seo" && (
                <motion.div key="seo" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }} className="space-y-8">
                  <section className="p-8 rounded-[2.5rem] bg-white dark:bg-[#111111] shadow-2xl space-y-8 border border-black/[0.03]">
                    <div className="space-y-1">
                      <h3 className="text-xl font-black tracking-tight">SEO & Social</h3>
                      <p className="text-[11px] font-bold opacity-40 uppercase tracking-widest">Presença impecável</p>
                    </div>
                    <div className="space-y-6 pt-4">
                      <div className="space-y-2">
                        <Label className="text-[9px] font-black uppercase opacity-40 tracking-widest ml-1">Título SEO</Label>
                        <Input value={formData.seo.title} onChange={(e) => setFormData({...formData, seo: {...formData.seo, title: e.target.value}})} className="h-10 rounded-xl bg-black/[0.02] border-none font-bold text-sm shadow-sm"/>
                      </div>
                      <div className="space-y-2">
                        <Label className="text-[9px] font-black uppercase opacity-40 tracking-widest ml-1">Descrição</Label>
                        <Textarea placeholder="Descreva sua atuação..." value={formData.seo.description} onChange={(e) => setFormData({...formData, seo: {...formData.seo, description: e.target.value}})} className="min-h-[100px] rounded-xl bg-black/[0.02] border-none text-xs font-medium resize-none p-4 leading-relaxed"/>
                      </div>
                    </div>
                  </section>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </main>

        {/* PREVIEW MOBILE (SYNC COM TEMAS) */}
        <div className="hidden xl:flex w-[38%] bg-[#F5F5F7] dark:bg-black items-center justify-center border-l border-black/[0.03] p-12 relative overflow-hidden">
          {/* BACKGROUND EFFECTS - Neutralizados para evitar flashes de cor */}
          <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-slate-400/[0.03] blur-[120px] rounded-full translate-x-1/2 -translate-y-1/2" />
          <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-slate-400/[0.03] blur-[120px] rounded-full -translate-x-1/2 translate-y-1/2" />

          <div className="relative w-[280px] h-[580px] bg-white dark:bg-black rounded-[2.8rem] border-[7px] border-black dark:border-[#151515] shadow-[0_40px_80px_-20px_rgba(0,0,0,0.4)] overflow-hidden">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-24 h-5 bg-black dark:bg-[#151515] rounded-b-2xl z-[100]"></div>
            
            <div className="w-full h-full overflow-y-auto scroll-smooth custom-scrollbar relative">
              {/* RENDERIZAÇÃO DINÂMICA DO TEMA NO PREVIEW - Removido mode="wait" para cross-fade suave */}
              <AnimatePresence>
                {formData.tema.preset === "glass" && (
                  <motion.div 
                    key="preview-glass" 
                    initial={{ opacity: 0 }} 
                    animate={{ opacity: 1 }} 
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className="absolute inset-0"
                  >
                    <GlassTheme 
                      data={formData} 
                      visibleLinks={visibleLinks} 
                      handleLinkClick={() => {}} 
                      getAnimationProps={getAnimationProps} 
                      isPreview={true}
                    />
                  </motion.div>
                )}
                {formData.tema.preset === "minimalist" && (
                  <motion.div 
                    key="preview-mini" 
                    initial={{ opacity: 0 }} 
                    animate={{ opacity: 1 }} 
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className="absolute inset-0"
                  >
                    <MinimalistTheme 
                      data={formData} 
                      visibleLinks={visibleLinks} 
                      handleLinkClick={() => {}} 
                      getAnimationProps={getAnimationProps} 
                      isPreview={true}
                    />
                  </motion.div>
                )}
                {formData.tema.preset === "modern" && (
                  <motion.div 
                    key="preview-modern" 
                    initial={{ opacity: 0 }} 
                    animate={{ opacity: 1 }} 
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className="absolute inset-0"
                  >
                    <ModernTheme 
                      data={formData} 
                      visibleLinks={visibleLinks} 
                      handleLinkClick={() => {}} 
                      getAnimationProps={getAnimationProps} 
                      isPreview={true}
                    />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
          
          <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex items-center gap-3 px-5 py-2 bg-white/40 dark:bg-black/40 backdrop-blur-xl rounded-full border border-black/[0.03] shadow-xl">
            <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
            <span className="text-[8px] font-black uppercase tracking-[4px] opacity-40">Live Design</span>
          </div>
        </div>
      </div>
      <AnimatePresence>
        {showSuccessModal && (
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-white dark:bg-zinc-900 rounded-[2.5rem] p-8 max-w-sm w-full shadow-2xl border border-black/5 dark:border-white/10 text-center"
            >
              <div className="w-20 h-20 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle2 className="w-10 h-10 text-emerald-500" />
              </div>
              <h2 className="text-2xl font-black tracking-tight mb-2">Site Publicado!</h2>
              <p className="text-muted-foreground text-sm mb-8">
                Sua página de links já está no ar e pronta para ser compartilhada.
              </p>
              
              <div className="bg-black/5 dark:bg-white/5 p-4 rounded-2xl mb-8 flex items-center justify-between gap-3 group border border-transparent hover:border-blue-500/20 transition-all">
                <div className="flex items-center gap-2 overflow-hidden">
                  <Globe className="w-4 h-4 text-blue-500 shrink-0" />
                  <span className="text-xs font-bold truncate">central63.vercel.com/bio/{formData.slug}</span>
                </div>
                <button 
                  onClick={() => {
                    navigator.clipboard.writeText(`${window.location.origin}/bio/${formData.slug}`);
                    toast.success("Link copiado!");
                  }}
                  className="p-2 bg-white dark:bg-zinc-800 rounded-lg shadow-sm border border-black/5 dark:border-white/5 active:scale-95 transition-all"
                >
                  <Copy className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="flex flex-col gap-3">
                <button 
                  onClick={() => window.open(`/bio/${formData.slug}`, '_blank')}
                  className="w-full py-4 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg shadow-blue-500/20 transition-all active:scale-[0.98]"
                >
                  Visualizar Agora
                </button>
                <button 
                  onClick={() => setShowSuccessModal(false)}
                  className="w-full py-4 bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 rounded-2xl font-black text-xs uppercase tracking-widest transition-all"
                >
                  Continuar Editando
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
