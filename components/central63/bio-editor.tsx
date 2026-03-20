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
  Copy,
  X,
  Library,
  Folder,
  FolderOpen
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

// ── CONFIGURAÇÕES GERAIS DE ANIMAÇÃO ──
const springTransition = { type: "spring", stiffness: 300, damping: 25, mass: 0.8 };
const itemVariants = {
  hidden: { opacity: 0, y: 20, scale: 0.98 },
  visible: { opacity: 1, y: 0, scale: 1, transition: springTransition },
  exit: { opacity: 0, y: -20, scale: 0.98, transition: { duration: 0.2 } }
};

export default function BioEditor({ initialData, id }: BioEditorProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [activeSection, setActiveSection] = useState("conteudo");

  const [navigatingId, setNavigatingId] = useState<string | null>(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showMobilePreview, setShowMobilePreview] = useState(false);

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
      enabled: initialData?.whatsapp?.enabled ?? true,
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

  // Property Folders Management
  const [propertyFolders, setPropertyFolders] = useState<any[]>([]);
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);
  const [newFolderName, setNewFolderName] = useState("");
  const [newFolderColor, setNewFolderColor] = useState("#3b82f6");
  const [newFolderIcon, setNewFolderIcon] = useState("📁");
  const [showNewFolderDialog, setShowNewFolderDialog] = useState(false);
  const [loadingFolders, setLoadingFolders] = useState(false);

  // Load Property Folders
  useEffect(() => {
    if (!id) return;
    loadPropertyFolders();
  }, [id]);

  const loadPropertyFolders = async () => {
    try {
      setLoadingFolders(true);
      const { data, error } = await supabase
        .from('bio_property_folders')
        .select('*')
        .eq('bio_page_id', id)
        .order('order_index', { ascending: true });
      
      if (error) throw error;
      setPropertyFolders(data || []);
      if (data && data.length > 0 && !selectedFolderId) {
        setSelectedFolderId(data[0].id);
      }
    } catch (error: any) {
      console.error('Error loading property folders:', error);
      toast.error('Erro ao carregar pastas');
    } finally {
      setLoadingFolders(false);
    }
  };

  // Pre-fill WhatsApp from Profile
  useEffect(() => {
    async function prefillWhatsApp() {
      if (id && initialData?.whatsapp?.number) return;

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const metadataPhone = user.user_metadata?.phone || user.user_metadata?.whatsapp || user.user_metadata?.telefone;

      if (metadataPhone && !formData.whatsapp.number) {
        setFormData(prev => ({
          ...prev,
          whatsapp: { ...prev.whatsapp, number: metadataPhone, enabled: true }
        }));
        return;
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('whatsapp, telefone, phone')
        .eq('id', user.id)
        .maybeSingle();

      const profilePhone = profile?.whatsapp || profile?.telefone || profile?.phone;
      if (profilePhone && !formData.whatsapp.number) {
        setFormData(prev => ({
          ...prev,
          whatsapp: { ...prev.whatsapp, number: profilePhone, enabled: true }
        }));
      }
    }

    prefillWhatsApp();
  }, [id, initialData, supabase]);

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
      modern: { preset: "modern", bg_color: "#050505", text_color: "#ffffff", button_bg: "#e91c74", button_text: "#ffffff", button_style: "rounded-xl" },
      glass: { preset: "glass", bg_color: "#050505", text_color: "#ffffff", button_bg: "#e91c74", button_text: "#ffffff", button_style: "rounded-2xl" },
      minimalist: { preset: "minimalist", bg_color: "#050505", text_color: "#ffffff", button_bg: "#e91c74", button_text: "#ffffff", button_style: "rounded-none" }
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
        const orFilter = isNumeric
          ? `codigo.eq.${searchQuery},titulo.ilike.%${searchQuery}%,endereco.ilike.%${searchQuery}%,bairro.ilike.%${searchQuery}%`
          : `titulo.ilike.%${searchQuery}%,endereco.ilike.%${searchQuery}%,bairro.ilike.%${searchQuery}%`;
        return q.or(orFilter).limit(8);
      };

      const [pmwRes, auxRes] = await Promise.all([
        buildQuery("imovel_pmw"),
        buildQuery("imovel_aux")
      ]);

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
    const generatedSlug = broker.nome
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .join("-")
      .toLowerCase()
      .normalize('NFD').replace(/[\u0300-\u036f]/g, "");

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
      const itemWithFolder = { ...imovel, folder_id: selectedFolderId };
      setFormData({
        ...formData,
        featured_properties: { ...formData.featured_properties, items: [...items, itemWithFolder] }
      });
      toast.success("Imóvel adicionado ao portfólio");
    }
  };

  const createPropertyFolder = async () => {
    if (!newFolderName.trim()) {
      toast.error("Nome da pasta não pode estar vazio");
      return;
    }

    if (!id) {
      toast.error("Primeiro salve a bio para criar pastas de imóveis");
      return;
    }

    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError || !user?.id) {
        throw new Error("Usuário não autenticado");
      }

      const { data, error } = await supabase
        .from('bio_property_folders')
        .insert({
          user_id: user.id,
          bio_page_id: id,
          name: newFolderName.trim(),
          color: newFolderColor,
          icon: newFolderIcon,
          order_index: propertyFolders.length
        })
        .select()
        .single();

      if (error) throw error;
      
      setPropertyFolders([...propertyFolders, data]);
      setSelectedFolderId(data.id);
      setNewFolderName("");
      setNewFolderColor("#3b82f6");
      setNewFolderIcon("📁");
      setShowNewFolderDialog(false);
      toast.success("Pasta criada com sucesso!");
    } catch (error: any) {
      console.error('Error creating property folder:', error);
      toast.error(`Erro ao criar pasta: ${error.message}`);
    }
  };

  const deletePropertyFolder = async (folderId: string) => {
    if (!confirm("Tem certeza que deseja deletar esta pasta? Os imóveis não serão removidos, apenas desorganizados.")) return;

    try {
      const { error } = await supabase
        .from('bio_property_folders')
        .delete()
        .eq('id', folderId);

      if (error) throw error;
      setPropertyFolders(propertyFolders.filter(f => f.id !== folderId));
      if (selectedFolderId === folderId) {
        setSelectedFolderId(propertyFolders.length > 1 ? propertyFolders[0].id : null);
      }
      toast.success("Pasta removida!");
    } catch (error: any) {
      console.error('Error deleting property folder:', error);
      toast.error('Erro ao deletar pasta');
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

    setLoading(true);
    const promise = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error("Usuário não autenticado");

        const sanitizedLinks = formData.links.map((link: any) => {
          if (link.type === "link" && link.url && !link.url.startsWith("http://") && !link.url.startsWith("https://") && !link.url.startsWith("mailto:") && !link.url.startsWith("tel:") && !link.url.startsWith("#")) {
            return { ...link, url: `https://${link.url}` };
          }
          return link;
        });

        const payload = {
          ...formData,
          links: sanitizedLinks,
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

        setFormData(prev => ({ ...prev, links: sanitizedLinks }));
        setShowSuccessModal(true);
        router.refresh();
        return "Página publicada!";
      } finally {
        setLoading(false);
      }
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

  const now = new Date();
  const visibleLinks = formData.links.filter((link: any) => {
    if (!link.schedule?.start && !link.schedule?.end) return true;
    try {
      const start = link.schedule.start ? new Date(link.schedule.start) : null;
      const end = link.schedule.end ? new Date(link.schedule.end) : null;
      const isStartValid = start && !isNaN(start.getTime());
      const isEndValid = end && !isNaN(end.getTime());

      if (isStartValid && now < start) return false;
      if (isEndValid && now > end) return false;
    } catch (e) {
      return true;
    }
    return true;
  });

  // ── LÓGICA DO VIEWPORT VIRTUAL (SIMULAÇÃO REAL DE CELULAR) ──
  // A moldura do celular possui 280px de largura externa e 580px de altura.
  // Com borda de 6px, o espaço interno é 268px x 568px.
  // Vamos simular um iPhone (390px) e aplicar uma escala CSS.
  const VIRTUAL_WIDTH = 390;
  const SCALE = 268 / VIRTUAL_WIDTH; // Escala: ~0.6871
  const VIRTUAL_HEIGHT = 844 / SCALE; // Altura necessária p/ cobrir o preview: ~826px

  const renderPreviewDevice = () => (
    <div className="w-full h-full overflow-hidden relative bg-zinc-950 rounded-[1.9rem]">
      {/* Container de Escala do Viewport Virtual */}
      <div
        className="overflow-y-auto overflow-x-hidden scroll-smooth no-scrollbar origin-top-left absolute top-0 left-0 bg-zinc-950"
        style={{
          width: `${VIRTUAL_WIDTH}px`,
          height: `${VIRTUAL_HEIGHT}px`,
          transform: `scale(${SCALE})`,
        }}
      >
        <AnimatePresence mode="wait">
          {formData.tema.preset === "glass" && (<motion.div key="preview-glass" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }} className="min-h-full"> <GlassTheme data={formData} visibleLinks={visibleLinks} handleLinkClick={() => { }} getAnimationProps={getAnimationProps} isPreview={true} /> </motion.div>)}
          {formData.tema.preset === "minimalist" && (<motion.div key="preview-mini" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }} className="min-h-full"> <MinimalistTheme data={formData} visibleLinks={visibleLinks} handleLinkClick={() => { }} getAnimationProps={getAnimationProps} isPreview={true} /> </motion.div>)}
          {formData.tema.preset === "modern" && (<motion.div key="preview-modern" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }} className="min-h-full"> <ModernTheme data={formData} visibleLinks={visibleLinks} handleLinkClick={() => { }} getAnimationProps={getAnimationProps} isPreview={true} /> </motion.div>)}
        </AnimatePresence>
      </div>
    </div>
  );

  return (
    <div className="flex flex-col h-[100dvh] overflow-hidden font-sans relative bg-[#F5F5F7] dark:bg-[#050505]">

      {/* ── BACKGROUND APPLE GLASS ── */}
      <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
        <motion.div
          animate={{ scale: [1, 1.1, 1], opacity: [0.2, 0.3, 0.2] }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
          className="absolute -top-[20%] -left-[10%] w-[50vw] h-[50vw] rounded-full bg-blue-400 dark:bg-blue-600 blur-[120px]"
        />
        <motion.div
          animate={{ scale: [1, 1.2, 1], opacity: [0.15, 0.25, 0.15] }}
          transition={{ duration: 15, repeat: Infinity, ease: "easeInOut", delay: 2 }}
          className="absolute top-[40%] -right-[10%] w-[40vw] h-[40vw] rounded-full bg-purple-400 dark:bg-purple-600 blur-[120px]"
        />
        <motion.div
          animate={{ scale: [1, 1.15, 1], opacity: [0.1, 0.2, 0.1] }}
          transition={{ duration: 12, repeat: Infinity, ease: "easeInOut", delay: 1 }}
          className="absolute -bottom-[20%] left-[20%] w-[60vw] h-[40vw] rounded-full bg-emerald-400 dark:bg-emerald-600 blur-[120px]"
        />
      </div>

      {/* ── HEADER REDUZIDO E ARREDONDADO ── */}
      <header className="z-[100] h-14 shrink-0 px-4 md:px-6 flex items-center justify-between backdrop-blur-3xl bg-white/40 dark:bg-black/40 border-b border-white/60 dark:border-white/10 shadow-sm sticky top-0 transition-all">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => router.back()} className="h-8 w-8 rounded-full bg-white/50 dark:bg-white/5 backdrop-blur-md border border-white/50 dark:border-white/10 hover:bg-white/80 dark:hover:bg-white/10 shadow-sm transition-all hover:scale-105 active:scale-95">
            <ArrowLeft className="h-4 w-4 text-foreground/70" />
          </Button>
          <div className="flex flex-col">
            <span className="text-[9px] font-black text-muted-foreground/70 uppercase tracking-[0.2em] leading-none mb-0.5">Flow Bio</span>
            <span className="text-xs font-black tracking-tight text-foreground truncate max-w-[150px] md:max-w-[200px]">{formData.nome || "Sem título"}</span>
          </div>
        </div>

        <div className="flex items-center gap-2 md:gap-3">
          <Button variant="ghost" className="h-8 px-4 rounded-full text-[9px] font-black uppercase tracking-widest bg-white/40 dark:bg-white/5 backdrop-blur-md border border-white/50 dark:border-white/10 hover:bg-white/80 shadow-sm transition-all text-foreground/70 hidden sm:flex hover:scale-105 active:scale-95">
            <Share2 className="h-3 w-3 mr-1.5" /> Share
          </Button>
          <Button onClick={handleSave} disabled={loading} className="h-8 px-6 rounded-full bg-primary hover:bg-primary/90 text-white font-black uppercase text-[9px] tracking-[0.15em] shadow-lg shadow-primary/20 hover:scale-[1.05] active:scale-95 transition-all">
            {loading ? <Sparkles className="w-3 h-3 animate-spin" /> : "Publicar"}
          </Button>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden flex-col md:flex-row relative z-10">

        {/* ── SIDEBAR REDUZIDA ── */}
        <nav className="w-full md:w-20 lg:w-48 bg-white/40 dark:bg-black/20 backdrop-blur-2xl border-r border-white/60 dark:border-white/10 p-2 flex flex-row md:flex-col gap-1.5 z-50 overflow-x-auto no-scrollbar shadow-[4px_0_24px_rgba(0,0,0,0.02)] shrink-0">
          {sidebarItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveSection(item.id)}
              className={cn(
                "flex-1 md:flex-none flex items-center justify-center lg:justify-start gap-3 p-2.5 rounded-2xl transition-all duration-300 group relative border border-transparent whitespace-nowrap",
                activeSection === item.id
                  ? "bg-white/80 dark:bg-white/10 border-white/80 dark:border-white/10 shadow-sm text-primary"
                  : "text-muted-foreground/60 hover:text-foreground hover:bg-white/50 dark:hover:bg-white/5 hover:border-white/40 dark:hover:border-white/5"
              )}
            >
              <item.icon className={cn("h-4 w-4 shrink-0 transition-transform duration-300", activeSection === item.id ? "scale-110" : "group-hover:scale-110")} />
              <span className="hidden lg:block text-[10px] font-black uppercase tracking-[0.15em]">{item.label}</span>
              {activeSection === item.id && <motion.div layoutId="activeNavIndicator" className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-primary rounded-r-full hidden md:block" />}
            </button>
          ))}
        </nav>

        {/* ── EDITOR CANVAS ── */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8 custom-scrollbar relative pb-24 md:pb-12">
          <div className="max-w-2xl mx-auto">
            <AnimatePresence mode="wait">
              {activeSection === "conteudo" && (
                <motion.div key="conteudo" variants={itemVariants} initial="hidden" animate="visible" exit="exit" className="space-y-6">

                  <section className="space-y-5">
                    <div className="flex items-center gap-3">
                      <div className="h-6 w-1 bg-gradient-to-b from-blue-500 to-purple-500 rounded-full shadow-sm" />
                      <h3 className="text-lg font-black tracking-tight text-foreground">Identidade</h3>
                    </div>

                    {/* MAGIC FILL CORRETOR */}
                    <motion.div whileHover={{ y: -2 }} className="p-4 rounded-[2rem] bg-white/40 dark:bg-white/5 backdrop-blur-2xl border border-white/60 dark:border-white/10 shadow-sm space-y-4 relative overflow-hidden group transition-all duration-300 hover:shadow-lg">
                      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/80 dark:via-white/20 to-transparent z-20" />
                      <div className="flex items-center justify-between relative z-10">
                        <div className="flex items-center gap-2">
                          <div className="p-1.5 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl shadow-sm border border-white/20">
                            <Sparkles className="w-3 h-3 text-white" />
                          </div>
                          <span className="text-[9px] font-black uppercase tracking-[0.15em] text-blue-600 dark:text-blue-400">Magic Fill Corretor</span>
                        </div>
                        {searchingBrokers && <Zap className="w-3 h-3 text-blue-500 animate-pulse" />}
                      </div>

                      <div className="relative group/search z-10">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/50 group-focus-within/search:text-blue-500 transition-colors" />
                        {/* INPUT ARREDONDADO (PILL) */}
                        <Input
                          placeholder="Buscar corretor por nome..."
                          className="h-11 pl-12 pr-20 rounded-full bg-white/50 dark:bg-black/20 backdrop-blur-md border border-white/60 dark:border-white/10 focus:ring-4 focus:ring-blue-500/20 transition-all font-bold text-xs shadow-inner hover:shadow-[0_0_15px_rgba(59,130,246,0.1)]"
                          value={brokerSearchQuery}
                          onChange={(e) => setBrokerSearchQuery(e.target.value)}
                          onKeyDown={(e) => e.key === "Enter" && handleSearchBrokers()}
                        />
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={handleSearchBrokers}
                          disabled={searchingBrokers}
                          className="absolute right-1.5 top-1/2 -translate-y-1/2 h-8 px-4 rounded-full text-blue-600 dark:text-blue-400 bg-blue-500/10 hover:bg-blue-500/20 font-black text-[9px] uppercase tracking-widest transition-all"
                        >
                          {searchingBrokers ? "..." : "Buscar"}
                        </Button>
                      </div>

                      {brokerSearchResults.length > 0 && (
                        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="grid grid-cols-1 gap-2 pt-1 relative z-10">
                          {brokerSearchResults.map((b, idx) => (
                            <div
                              key={idx}
                              onClick={() => applyBrokerData(b)}
                              className="flex items-center gap-3 p-3 bg-white/60 dark:bg-white/5 backdrop-blur-xl rounded-[1.5rem] border border-white/60 dark:border-white/10 hover:border-blue-500/40 hover:shadow-md cursor-pointer transition-all group/item"
                            >
                              <div className="w-10 h-10 rounded-full overflow-hidden shadow-sm border border-white/40 dark:border-white/10">
                                <img src={b.imagem_url || "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100"} className="w-full h-full object-cover" />
                              </div>
                              <div className="flex-1">
                                <div className="text-xs font-black text-foreground">{b.nome}</div>
                                <div className="text-[9px] font-black text-muted-foreground/60 uppercase tracking-widest">{b.unidade || b.departamento || "Consultor"}</div>
                              </div>
                              <ChevronRight className="w-4 h-4 text-blue-600 opacity-0 group-hover/item:opacity-100 transition-all -translate-x-2 group-hover/item:translate-x-0" />
                            </div>
                          ))}
                        </motion.div>
                      )}
                    </motion.div>

                    <motion.div whileHover={{ y: -2 }} className="flex flex-col md:flex-row gap-6 items-start p-6 rounded-[2.5rem] bg-white/40 dark:bg-white/5 backdrop-blur-2xl border border-white/60 dark:border-white/10 shadow-sm relative transition-all duration-300 hover:shadow-lg">
                      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/80 dark:via-white/20 to-transparent z-20" />
                      <div className="relative group shrink-0 self-center md:self-start">
                        <div className="w-24 h-24 rounded-full bg-white/50 dark:bg-black/20 backdrop-blur-md border border-white/80 dark:border-white/10 shadow-lg overflow-hidden relative cursor-pointer transition-transform duration-500 group-hover:scale-105">
                          {formData.foto_url ? (
                            <img src={formData.foto_url} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" style={{ objectPosition: formData.tema.foto_posicao || "center" }} />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-muted-foreground/30"><ImageIcon className="h-8 w-8" /></div>
                          )}
                          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity duration-300">
                            <Plus className="h-8 w-8 text-white" />
                          </div>
                        </div>
                      </div>

                      <div className="flex-1 space-y-4 w-full">
                        <div className="space-y-1.5">
                          <Label className="text-[9px] font-black uppercase text-muted-foreground/60 tracking-[0.15em] ml-2">Nome Profissional</Label>
                          {/* INPUT ARREDONDADO (PILL) */}
                          <Input value={formData.nome} onChange={(e) => setFormData({ ...formData, nome: e.target.value })} className="h-11 rounded-full px-5 bg-white/50 dark:bg-black/20 backdrop-blur-md border border-white/60 dark:border-white/10 focus:ring-4 focus:ring-blue-500/20 transition-all font-bold text-xs shadow-inner hover:shadow-[0_0_15px_rgba(59,130,246,0.1)]" />
                        </div>

                        <div className="space-y-1.5">
                          <Label className="text-[9px] font-black uppercase text-muted-foreground/60 tracking-[0.15em] ml-2">Título / Cargo</Label>
                          {/* INPUT ARREDONDADO (PILL) */}
                          <Input value={formData.headline} onChange={(e) => setFormData({ ...formData, headline: e.target.value })} placeholder="Ex: Corretor" className="h-11 rounded-full px-5 bg-white/50 dark:bg-black/20 backdrop-blur-md border border-white/60 dark:border-white/10 focus:ring-4 focus:ring-blue-500/20 transition-all font-bold text-xs shadow-inner hover:shadow-[0_0_15px_rgba(59,130,246,0.1)]" />
                        </div>

                        <div className="space-y-1.5">
                          <div className="flex items-center justify-between ml-2">
                            <Label className="text-[9px] font-black uppercase text-muted-foreground/60 tracking-[0.15em]">Link (slug)</Label>
                            <div className="flex items-center gap-1 bg-white/50 dark:bg-black/30 backdrop-blur-md px-2 py-0.5 rounded-full border border-white/40 dark:border-white/5">
                              {slugStatus === 'checking' && <Zap className="w-2.5 h-2.5 text-blue-500 animate-pulse" />}
                              {slugStatus === 'available' && <CheckCircle2 className="w-2.5 h-2.5 text-emerald-500" />}
                              {slugStatus === 'taken' && <AlertCircle className="w-2.5 h-2.5 text-destructive" />}
                              {slugStatus === 'invalid' && <AlertCircle className="w-2.5 h-2.5 text-amber-500" />}
                              <span className={cn("text-[8px] font-black uppercase tracking-widest", slugStatus === 'available' ? "text-emerald-500" : slugStatus === 'taken' ? "text-destructive" : slugStatus === 'invalid' ? "text-amber-500" : "text-blue-500")}>
                                {slugStatus === 'idle' && "Digite"}
                                {slugStatus === 'checking' && "..."}
                                {slugStatus === 'available' && "Livre"}
                                {slugStatus === 'taken' && "Em uso"}
                                {slugStatus === 'invalid' && "Inválido"}
                              </span>
                            </div>
                          </div>
                          <div className="relative group">
                            <span className="absolute left-5 top-1/2 -translate-y-1/2 text-[10px] font-black text-muted-foreground/40 pointer-events-none">bio/</span>
                            {/* INPUT ARREDONDADO (PILL) */}
                            <Input value={formData.slug} onChange={(e) => setFormData({ ...formData, slug: e.target.value.toLowerCase().trim() })} placeholder="seu-nome" className={cn("h-11 rounded-full bg-white/50 dark:bg-black/20 backdrop-blur-md border border-white/60 dark:border-white/10 focus:ring-4 transition-all font-bold text-xs pl-[46px] shadow-inner hover:shadow-[0_0_15px_rgba(59,130,246,0.1)]", slugStatus === 'available' ? "focus:ring-emerald-500/20 border-emerald-500/30 hover:shadow-[0_0_15px_rgba(16,185,129,0.1)]" : slugStatus === 'taken' ? "focus:ring-destructive/20 border-destructive/30" : "focus:ring-blue-500/20")} />
                          </div>
                        </div>

                        <div className="space-y-1.5">
                          <Label className="text-[9px] font-black uppercase text-muted-foreground/60 tracking-[0.15em] ml-2">Enquadramento da Foto</Label>
                          {/* SELECT ARREDONDADO (PILL) */}
                          <Select value={formData.tema.foto_posicao || "center"} onValueChange={(v) => setFormData({ ...formData, tema: { ...formData.tema, foto_posicao: v } })}>
                            <SelectTrigger className="h-11 rounded-full px-5 bg-white/50 dark:bg-black/20 backdrop-blur-md border border-white/60 dark:border-white/10 focus:ring-4 focus:ring-blue-500/20 transition-all font-bold text-xs shadow-inner hover:shadow-[0_0_15px_rgba(59,130,246,0.1)]">
                              <SelectValue placeholder="Selecione" />
                            </SelectTrigger>
                            <SelectContent className="rounded-3xl border-white/40 dark:border-white/10 bg-white/90 dark:bg-zinc-900/90 backdrop-blur-2xl p-2">
                              <SelectItem value="top" className="font-bold text-xs rounded-full py-2">Topo (Rosto)</SelectItem>
                              <SelectItem value="center" className="font-bold text-xs rounded-full py-2">Centro (Padrão)</SelectItem>
                              <SelectItem value="bottom" className="font-bold text-xs rounded-full py-2">Fundo</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-1.5">
                          <Label className="text-[9px] font-black uppercase text-muted-foreground/60 tracking-[0.15em] ml-2">Descrição</Label>
                          {/* TEXTAREA SUPER ARREDONDADO */}
                          <Textarea value={formData.bio} onChange={(e) => setFormData({ ...formData, bio: e.target.value })} className="min-h-[100px] rounded-[2rem] bg-white/50 dark:bg-black/20 backdrop-blur-md border border-white/60 dark:border-white/10 focus:ring-4 focus:ring-blue-500/20 transition-all text-xs font-bold resize-none p-5 shadow-inner hover:shadow-[0_0_15px_rgba(59,130,246,0.1)]" placeholder="Especialista em imóveis..." />
                        </div>
                      </div>
                    </motion.div>
                  </section>

                  {/* ── SEÇÃO LINKS E BOTÕES ── */}
                  <section className="space-y-5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="h-6 w-1 bg-gradient-to-b from-blue-500 to-purple-500 rounded-full shadow-sm" />
                        <h3 className="text-lg font-black tracking-tight text-foreground">Links e Botões</h3>
                      </div>
                      <Button onClick={addLink} variant="ghost" className="h-9 rounded-full px-4 text-[9px] font-black uppercase tracking-[0.15em] bg-blue-500/10 text-blue-600 dark:text-blue-400 hover:bg-blue-600 hover:text-white transition-all shadow-sm hover:scale-105 active:scale-95">
                        <Plus className="h-3 w-3 mr-1" /> Add
                      </Button>
                    </div>

                    <Reorder.Group axis="y" values={formData.links} onReorder={handleReorderLinks} className="space-y-4">
                      {formData.links.map((link: any) => (
                        <Reorder.Item key={link.id} value={link} className="group">
                          <motion.div whileHover={{ scale: 1.01 }} className="bg-white/60 dark:bg-white/5 backdrop-blur-xl border border-white/60 dark:border-white/10 p-5 rounded-[2.5rem] shadow-sm hover:shadow-lg transition-all duration-300">
                            <div className="flex items-center gap-4">
                              <div className="cursor-grab active:cursor-grabbing p-2.5 rounded-full bg-white/40 dark:bg-white/5 hover:bg-white/80 text-muted-foreground transition-all opacity-40 group-hover:opacity-100 shadow-inner">
                                <GripVertical className="h-5 w-5" />
                              </div>
                              <div className="flex-1 space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                  {/* INPUTS DE LINK - ARREDONDADOS (PILL) */}
                                  <div className="space-y-1.5">
                                    <Label className="text-[8px] font-black uppercase text-muted-foreground/60 tracking-widest ml-2">Título</Label>
                                    <Input placeholder="Título do Botão" value={link.title} onChange={(e) => updateLink(link.id, "title", e.target.value)} className="h-10 rounded-full px-4 bg-white/50 dark:bg-black/20 backdrop-blur-md border border-white/40 dark:border-white/10 text-xs font-black focus:ring-2 focus:ring-blue-500/20 shadow-inner hover:shadow-sm transition-all" />
                                  </div>
                                  <div className="space-y-1.5">
                                    <Label className="text-[8px] font-black uppercase text-muted-foreground/60 tracking-widest ml-2">URL Destino</Label>
                                    <div className="relative">
                                      <ExternalLink className="absolute left-3.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 opacity-40" />
                                      <Input placeholder="https://..." value={link.url} onChange={(e) => updateLink(link.id, "url", e.target.value)} className="h-10 rounded-full pl-9 pr-4 bg-white/50 dark:bg-black/20 backdrop-blur-md border border-white/40 dark:border-white/10 text-[11px] font-bold text-blue-500 focus:ring-2 focus:ring-blue-500/20 shadow-inner truncate hover:shadow-sm transition-all" />
                                    </div>
                                  </div>
                                </div>

                                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-1">
                                  <div className="space-y-1.5">
                                    <Label className="text-[8px] font-black uppercase text-muted-foreground/60 tracking-widest ml-2">Tipo</Label>
                                    <Select value={link.type || "link"} onValueChange={(v) => updateLink(link.id, "type", v)}>
                                      <SelectTrigger className="h-9 text-[10px] px-4 rounded-full bg-white/50 dark:bg-black/20 backdrop-blur-md border border-white/40 dark:border-white/10 font-bold shadow-inner hover:shadow-sm transition-all"><SelectValue /></SelectTrigger>
                                      <SelectContent className="rounded-2xl border-white/40 dark:border-white/10 bg-white/90 dark:bg-zinc-900/90 backdrop-blur-3xl p-1"><SelectItem value="link" className="text-xs rounded-full">Link</SelectItem><SelectItem value="youtube" className="text-xs rounded-full">YouTube</SelectItem><SelectItem value="spotify" className="text-xs rounded-full">Spotify</SelectItem><SelectItem value="vcard" className="text-xs rounded-full">VCard</SelectItem></SelectContent>
                                    </Select>
                                  </div>
                                  <div className="space-y-1.5">
                                    <Label className="text-[8px] font-black uppercase text-muted-foreground/60 tracking-widest ml-2">Efeito</Label>
                                    <Select value={link.animation || "none"} onValueChange={(v) => updateLink(link.id, "animation", v)}>
                                      <SelectTrigger className="h-9 text-[10px] px-4 rounded-full bg-white/50 dark:bg-black/20 backdrop-blur-md border border-white/40 dark:border-white/10 font-bold shadow-inner hover:shadow-sm transition-all"><SelectValue /></SelectTrigger>
                                      <SelectContent className="rounded-2xl border-white/40 dark:border-white/10 bg-white/90 dark:bg-zinc-900/90 backdrop-blur-3xl p-1"><SelectItem value="none" className="text-xs rounded-full">Nenhum</SelectItem><SelectItem value="pulse" className="text-xs rounded-full">Pulse</SelectItem><SelectItem value="vibrate" className="text-xs rounded-full">Vibrate</SelectItem><SelectItem value="glow" className="text-xs rounded-full">Glow</SelectItem></SelectContent>
                                    </Select>
                                  </div>
                                  <div className="col-span-2 space-y-1.5">
                                    <Label className="text-[8px] font-black uppercase text-muted-foreground/60 tracking-widest ml-2">Exibição Programada (Opcional)</Label>
                                    <div className="flex gap-2">
                                      {/* INPUTS DE DATA (PILL) */}
                                      <Input type="date" value={link.schedule?.start} onChange={(e) => updateLink(link.id, "schedule.start", e.target.value)} className="h-9 text-[10px] rounded-full bg-white/50 dark:bg-black/20 backdrop-blur-md border border-white/40 dark:border-white/10 font-bold px-3 w-full shadow-inner focus:ring-2 focus:ring-blue-500/20 hover:shadow-sm transition-all" />
                                      <Input type="date" value={link.schedule?.end} onChange={(e) => updateLink(link.id, "schedule.end", e.target.value)} className="h-9 text-[10px] rounded-full bg-white/50 dark:bg-black/20 backdrop-blur-md border border-white/40 dark:border-white/10 font-bold px-3 w-full shadow-inner focus:ring-2 focus:ring-blue-500/20 hover:shadow-sm transition-all" />
                                    </div>
                                  </div>
                                </div>
                              </div>
                              <Button variant="ghost" size="icon" className="h-10 w-10 rounded-full text-destructive bg-rose-500/5 hover:bg-rose-500/20 hover:scale-110 border border-rose-500/10 self-start transition-all shadow-sm" onClick={() => removeLink(link.id)}>
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </motion.div>
                        </Reorder.Item>
                      ))}
                    </Reorder.Group>
                  </section>
                </motion.div>
              )}

              {activeSection === "design" && (
                <motion.div key="design" variants={itemVariants} initial="hidden" animate="visible" exit="exit" className="space-y-8">
                  <section className="space-y-5">
                    <div className="flex items-center gap-3">
                      <div className="h-6 w-1 bg-gradient-to-b from-blue-500 to-purple-500 rounded-full shadow-sm" />
                      <h3 className="text-lg font-black tracking-tight text-foreground">Estilos Visuais</h3>
                    </div>
                    <div className="grid grid-cols-3 gap-4">
                      {["modern", "glass", "minimalist"].map((p) => (
                        <motion.button
                          whileHover={{ scale: 1.05, y: -2 }}
                          whileTap={{ scale: 0.95 }}
                          key={p}
                          onClick={() => applyPreset(p)}
                          className={cn(
                            "flex flex-col items-center gap-3 p-5 rounded-[2rem] border-2 transition-all duration-300 group relative overflow-hidden",
                            formData.tema.preset === p ? "border-blue-500 bg-white/60 dark:bg-white/10 shadow-lg backdrop-blur-xl" : "border-white/50 dark:border-white/10 bg-white/30 dark:bg-white/5 backdrop-blur-md opacity-70 hover:opacity-100"
                          )}
                        >
                          <div className={cn(
                            "w-10 h-10 rounded-2xl flex items-center justify-center shadow-sm transition-transform duration-300 border border-white/40",
                            p === "modern" ? "bg-zinc-900 text-white" : p === "glass" ? "bg-white/40 backdrop-blur-md text-black border-white/60" : "bg-black text-white"
                          )}>
                            <Layout className="h-4 w-4" strokeWidth={2.5} />
                          </div>
                          <span className="text-[9px] font-black uppercase tracking-[0.2em]">{p}</span>
                        </motion.button>
                      ))}
                    </div>
                  </section>

                  {/* PRESETS DE CORES FACILITADOS */}
                  <section className="space-y-5">
                    <div className="flex items-center gap-3">
                      <div className="h-6 w-1 bg-gradient-to-b from-pink-500 to-rose-500 rounded-full shadow-sm" />
                      <h3 className="text-lg font-black tracking-tight text-foreground">Modo de Cores</h3>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <motion.button
                        whileHover={{ scale: 1.02, y: -2 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => setFormData({ ...formData, tema: { ...formData.tema, bg_color: "#ffffff", text_color: "#000000", button_bg: "#e91c74", button_text: "#ffffff" } })}
                        className="flex items-center justify-between p-5 rounded-[2rem] bg-white/60 backdrop-blur-xl border border-white/80 shadow-sm hover:shadow-lg transition-all group"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-2xl bg-slate-100 flex items-center justify-center border border-black/5 shadow-inner">
                            <Sparkles className="w-4 h-4 text-[#e91c74]" />
                          </div>
                          <span className="text-xs font-black uppercase tracking-widest text-black">Modo Claro</span>
                        </div>
                        <div className="flex gap-1.5">
                          <div className="w-3.5 h-3.5 rounded-full bg-[#e91c74] shadow-sm" />
                          <div className="w-3.5 h-3.5 rounded-full bg-slate-200 shadow-sm border border-black/5" />
                        </div>
                      </motion.button>

                      <motion.button
                        whileHover={{ scale: 1.02, y: -2 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => setFormData({ ...formData, tema: { ...formData.tema, bg_color: "#050505", text_color: "#ffffff", button_bg: "#e91c74", button_text: "#ffffff" } })}
                        className="flex items-center justify-between p-5 rounded-[2rem] bg-[#111111]/80 backdrop-blur-xl border border-white/10 shadow-sm hover:shadow-lg transition-all group"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-2xl bg-white/5 flex items-center justify-center border border-white/10 shadow-inner">
                            <Sparkles className="w-4 h-4 text-[#e91c74]" />
                          </div>
                          <span className="text-xs font-black uppercase tracking-widest text-white">Modo Escuro</span>
                        </div>
                        <div className="flex gap-1.5">
                          <div className="w-3.5 h-3.5 rounded-full bg-[#e91c74] shadow-sm" />
                          <div className="w-3.5 h-3.5 rounded-full bg-white/10 shadow-sm border border-white/5" />
                        </div>
                      </motion.button>
                    </div>
                  </section>

                  <motion.section whileHover={{ y: -2 }} className="p-6 rounded-[2.5rem] bg-white/40 dark:bg-white/5 backdrop-blur-2xl border border-white/60 dark:border-white/10 shadow-sm space-y-6 relative transition-all hover:shadow-lg">
                    <h4 className="text-[9px] font-black tracking-[3px] uppercase text-muted-foreground/50 text-center">Ajuste Fino Avançado</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <div className="space-y-5">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-black uppercase tracking-[0.15em] text-muted-foreground/70">Fundo</span>
                          <div className="flex items-center gap-3 bg-white/50 dark:bg-black/20 backdrop-blur-md px-3 py-1.5 rounded-full shadow-inner border border-white/60 dark:border-white/10 hover:shadow-[0_0_10px_rgba(255,255,255,0.2)] transition-all">
                            <span className="text-[9px] font-bold opacity-60 uppercase">{formData.tema.bg_color}</span>
                            <input type="color" value={formData.tema.bg_color} onChange={(e) => setFormData({ ...formData, tema: { ...formData.tema, bg_color: e.target.value } })} className="w-6 h-6 rounded-full border-none cursor-pointer overflow-hidden bg-transparent" />
                          </div>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-black uppercase tracking-[0.15em] text-muted-foreground/70">Textos</span>
                          <div className="flex items-center gap-3 bg-white/50 dark:bg-black/20 backdrop-blur-md px-3 py-1.5 rounded-full shadow-inner border border-white/60 dark:border-white/10 hover:shadow-[0_0_10px_rgba(255,255,255,0.2)] transition-all">
                            <span className="text-[9px] font-bold opacity-60 uppercase">{formData.tema.text_color}</span>
                            <input type="color" value={formData.tema.text_color} onChange={(e) => setFormData({ ...formData, tema: { ...formData.tema, text_color: e.target.value } })} className="w-6 h-6 rounded-full border-none cursor-pointer overflow-hidden bg-transparent" />
                          </div>
                        </div>
                      </div>
                      <div className="space-y-5 md:border-l border-black/10 dark:border-white/10 md:pl-8">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-black uppercase tracking-[0.15em] text-muted-foreground/70">Botões</span>
                          <div className="flex items-center gap-3 bg-white/50 dark:bg-black/20 backdrop-blur-md px-3 py-1.5 rounded-full shadow-inner border border-white/60 dark:border-white/10 hover:shadow-[0_0_10px_rgba(255,255,255,0.2)] transition-all">
                            <span className="text-[9px] font-bold opacity-60 uppercase">{formData.tema.button_bg}</span>
                            <input type="color" value={formData.tema.button_bg} onChange={(e) => setFormData({ ...formData, tema: { ...formData.tema, button_bg: e.target.value } })} className="w-6 h-6 rounded-full border-none cursor-pointer overflow-hidden bg-transparent" />
                          </div>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-black uppercase tracking-[0.15em] text-muted-foreground/70">Labels</span>
                          <div className="flex items-center gap-3 bg-white/50 dark:bg-black/20 backdrop-blur-md px-3 py-1.5 rounded-full shadow-inner border border-white/60 dark:border-white/10 hover:shadow-[0_0_10px_rgba(255,255,255,0.2)] transition-all">
                            <span className="text-[9px] font-bold opacity-60 uppercase">{formData.tema.button_text}</span>
                            <input type="color" value={formData.tema.button_text} onChange={(e) => setFormData({ ...formData, tema: { ...formData.tema, button_text: e.target.value } })} className="w-6 h-6 rounded-full border-none cursor-pointer overflow-hidden bg-transparent" />
                          </div>
                        </div>
                      </div>
                    </div>
                  </motion.section>
                </motion.div>
              )}

              {activeSection === "config" && (
                <motion.div key="config" variants={itemVariants} initial="hidden" animate="visible" exit="exit" className="space-y-8">
                  <motion.section whileHover={{ y: -2 }} className="p-6 rounded-[2.5rem] bg-white/40 dark:bg-white/5 backdrop-blur-2xl border border-white/60 dark:border-white/10 shadow-sm space-y-6 relative transition-all hover:shadow-lg">
                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <div className="flex items-center gap-3">
                          <div className="h-6 w-1 bg-gradient-to-b from-green-400 to-emerald-600 rounded-full shadow-sm" />
                          <h3 className="text-lg font-black tracking-tight text-foreground">WhatsApp</h3>
                        </div>
                        <p className="text-[9px] font-black text-muted-foreground/60 uppercase tracking-[0.15em] ml-4">Contato no hub</p>
                      </div>
                      <Switch checked={formData.whatsapp.enabled} onCheckedChange={(v) => setFormData({ ...formData, whatsapp: { ...formData.whatsapp, enabled: v } })} className="data-[state=checked]:bg-emerald-500 shadow-sm" />
                    </div>

                    {formData.whatsapp.enabled && (
                      <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} className="grid grid-cols-1 gap-5 pt-2">
                        <div className="space-y-1.5">
                          <Label className="text-[9px] font-black uppercase text-muted-foreground/60 tracking-[0.15em] ml-2">WhatsApp (com DDD)</Label>
                          {/* INPUT ARREDONDADO (PILL) */}
                          <Input placeholder="Ex: 63999999999" value={formData.whatsapp.number} onChange={(e) => setFormData({ ...formData, whatsapp: { ...formData.whatsapp, number: e.target.value } })} className="h-11 rounded-full px-5 bg-white/50 dark:bg-black/20 backdrop-blur-md border border-white/60 dark:border-white/10 focus:ring-4 focus:ring-emerald-500/20 transition-all font-bold text-xs shadow-inner hover:shadow-[0_0_15px_rgba(16,185,129,0.1)]" />
                        </div>
                        <div className="space-y-1.5">
                          <Label className="text-[9px] font-black uppercase text-muted-foreground/60 tracking-[0.15em] ml-2">Mensagem Inicial</Label>
                          {/* INPUT ARREDONDADO (PILL) */}
                          <Input placeholder="Olá, vim pelo seu Link na Bio" value={formData.whatsapp.message} onChange={(e) => setFormData({ ...formData, whatsapp: { ...formData.whatsapp, message: e.target.value } })} className="h-11 rounded-full px-5 bg-white/50 dark:bg-black/20 backdrop-blur-md border border-white/60 dark:border-white/10 focus:ring-4 focus:ring-emerald-500/20 transition-all font-bold text-xs shadow-inner hover:shadow-[0_0_15px_rgba(16,185,129,0.1)]" />
                        </div>
                      </motion.div>
                    )}
                  </motion.section>
                </motion.div>
              )}

              {activeSection === "extra" && (
                <motion.div key="extra" variants={itemVariants} initial="hidden" animate="visible" exit="exit" className="space-y-8">
                  <motion.section whileHover={{ y: -2 }} className="p-6 rounded-[2.5rem] bg-white/40 dark:bg-white/5 backdrop-blur-2xl border border-white/60 dark:border-white/10 shadow-sm space-y-6 relative transition-all hover:shadow-lg">
                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <div className="flex items-center gap-3">
                          <div className="h-6 w-1 bg-gradient-to-b from-blue-500 to-cyan-500 rounded-full shadow-sm" />
                          <h3 className="text-lg font-black tracking-tight text-foreground">Imóveis</h3>
                        </div>
                        <p className="text-[9px] font-black text-muted-foreground/60 uppercase tracking-[0.15em] ml-4">Portfolio Real</p>
                      </div>
                      <Switch checked={formData.featured_properties.enabled} onCheckedChange={(v) => setFormData({ ...formData, featured_properties: { ...formData.featured_properties, enabled: v } })} className="data-[state=checked]:bg-blue-600 shadow-sm" />
                    </div>

                    {formData.featured_properties.enabled && (
                      <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} className="space-y-6 pt-2">
                        {/* FOLDER MANAGEMENT */}
                        <div className="p-5 rounded-[2rem] bg-gradient-to-br from-purple-500/5 to-pink-500/5 dark:from-purple-500/10 dark:to-pink-500/10 backdrop-blur-xl border border-purple-500/30 dark:border-purple-500/20 shadow-inner space-y-4">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <div className="p-1.5 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl shadow-sm border border-white/20">
                                <Library className="w-3 h-3 text-white" />
                              </div>
                              <span className="text-[9px] font-black uppercase tracking-[0.15em] text-purple-600 dark:text-purple-400">Pastas de Imóveis</span>
                            </div>
                            <button
                              onClick={() => setShowNewFolderDialog(!showNewFolderDialog)}
                              className="text-[8px] font-black text-purple-600 dark:text-purple-400 bg-purple-500/10 hover:bg-purple-500/20 px-3 py-1.5 rounded-full transition-all hover:text-purple-700 dark:hover:text-purple-300 flex items-center gap-1.5"
                            >
                              <Plus className="w-3 h-3" /> Nova Pasta
                            </button>
                          </div>

                          {showNewFolderDialog && (
                            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="p-4 bg-white/60 dark:bg-white/5 rounded-2xl border border-purple-500/20 space-y-3">
                              {!id && (
                                <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-lg flex items-center gap-2 mb-2">
                                  <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400 flex-shrink-0" />
                                  <span className="text-[9px] font-bold text-amber-600 dark:text-amber-400">Salve a bio primeiro para criar pastas</span>
                                </div>
                              )}
                              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                <input
                                  type="text"
                                  placeholder="Nome da pasta..."
                                  value={newFolderName}
                                  onChange={(e) => setNewFolderName(e.target.value)}
                                  disabled={!id}
                                  className="col-span-1 md:col-span-2 px-4 py-2.5 rounded-xl bg-white/60 dark:bg-black/20 border border-white/40 dark:border-white/10 focus:ring-2 focus:ring-purple-500 text-sm font-bold placeholder:text-muted-foreground/50 disabled:opacity-50 disabled:cursor-not-allowed"
                                />
                                <input
                                  type="color"
                                  value={newFolderColor}
                                  onChange={(e) => setNewFolderColor(e.target.value)}
                                  disabled={!id}
                                  className="w-full h-11 rounded-xl cursor-pointer border border-white/40 dark:border-white/10 disabled:opacity-50 disabled:cursor-not-allowed"
                                />
                              </div>
                              <div className="flex gap-2">
                                <button
                                  onClick={createPropertyFolder}
                                  disabled={!id || !newFolderName.trim()}
                                  className="flex-1 px-4 py-2.5 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl font-black text-[9px] uppercase tracking-widest hover:shadow-lg transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                  Criar Pasta
                                </button>
                                <button
                                  onClick={() => setShowNewFolderDialog(false)}
                                  className="flex-1 px-4 py-2.5 bg-white/60 dark:bg-white/5 border border-white/40 dark:border-white/10 rounded-xl font-black text-[9px] uppercase tracking-widest hover:bg-white/80 dark:hover:bg-white/10 transition-all"
                                >
                                  Cancelar
                                </button>
                              </div>
                            </motion.div>
                          )}

                          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                            {propertyFolders.length > 0 ? (
                              propertyFolders.map((folder) => {
                                const folderItemCount = formData.featured_properties.items?.filter((item: any) => item.folder_id === folder.id).length || 0;
                                const isSelected = selectedFolderId === folder.id;
                                
                                return (
                                  <motion.div
                                    key={folder.id}
                                    whileHover={{ y: -4, scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                    onClick={() => setSelectedFolderId(folder.id)}
                                    className={cn(
                                      "relative cursor-pointer group transition-all rounded-[1.2rem] overflow-hidden",
                                      "bg-white/60 dark:bg-white/5 backdrop-blur-xl border-2",
                                      "p-4 flex flex-col items-center text-center gap-2.5",
                                      "hover:shadow-lg active:shadow-none",
                                      isSelected
                                        ? "border-2 shadow-lg shadow-blue-500/40 ring-2 ring-blue-500/30"
                                        : "border-white/40 dark:border-white/10 hover:border-white/60 dark:hover:border-white/20"
                                    )}
                                    style={isSelected ? { 
                                      backgroundColor: `${folder.color}15`,
                                      borderColor: folder.color
                                    } : {}}
                                  >
                                    {/* Folder Icon */}
                                    <div className={cn(
                                      "w-12 h-12 rounded-lg flex items-center justify-center transition-all",
                                      isSelected ? "scale-110" : "group-hover:scale-105"
                                    )} style={{ backgroundColor: `${folder.color}30` }}>
                                      {isSelected ? (
                                        <FolderOpen className="w-6 h-6" style={{ color: folder.color }} strokeWidth={1.5} />
                                      ) : (
                                        <Folder className="w-6 h-6" style={{ color: folder.color }} strokeWidth={1.5} />
                                      )}
                                    </div>

                                    {/* Folder Name */}
                                    <div className="min-w-0 w-full">
                                      <h4 className="text-[11px] font-black truncate text-foreground">{folder.name}</h4>
                                    </div>

                                    {/* Item Count Badge */}
                                    <div className={cn(
                                      "text-[9px] font-black uppercase tracking-wider px-2 py-1 rounded-full",
                                      "transition-all text-white"
                                    )} style={{ backgroundColor: folder.color }}>
                                      {folderItemCount} {folderItemCount === 1 ? "imóvel" : "imóveis"}
                                    </div>

                                    {/* Delete Button */}
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        deletePropertyFolder(folder.id);
                                      }}
                                      className="absolute top-2 right-2 w-6 h-6 rounded-full bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md text-rose-500 flex items-center justify-center shadow-md opacity-0 group-hover:opacity-100 transition-all hover:bg-rose-500 hover:text-white hover:scale-110"
                                    >
                                      <X className="w-3 h-3" />
                                    </button>

                                    {/* Selection Indicator */}
                                    {isSelected && (
                                      <motion.div
                                        layoutId="folder-indicator"
                                        className="absolute top-2 left-2 w-5 h-5 rounded-full flex items-center justify-center"
                                        style={{ backgroundColor: folder.color }}
                                      >
                                        <Check className="w-3 h-3 text-white" strokeWidth={3} />
                                      </motion.div>
                                    )}
                                  </motion.div>
                                );
                              })
                            ) : (
                              <div className="col-span-2 md:col-span-3 lg:col-span-4 py-8 text-center border-2 border-dashed border-white/40 dark:border-white/10 rounded-[1.2rem] bg-white/20 dark:bg-white/5">
                                <Folder className="w-8 h-8 mx-auto mb-2 text-muted-foreground/40" />
                                <p className="text-[9px] font-black uppercase tracking-[0.15em] text-muted-foreground/50">Nenhuma pasta criada</p>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* BUSCADOR MAGIC FILL IMÓVEIS */}
                        <div className="p-5 rounded-[2rem] bg-white/50 dark:bg-white/5 backdrop-blur-xl border border-white/60 dark:border-white/10 shadow-inner space-y-4">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <div className="p-1.5 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl shadow-sm border border-white/20">
                                <Sparkles className="w-3 h-3 text-white" />
                              </div>
                              <span className="text-[9px] font-black uppercase tracking-[0.15em] text-blue-600 dark:text-blue-400">Magic Fill Portfólio</span>
                            </div>
                            {loading && <Zap className="w-3 h-3 text-blue-500 animate-pulse" />}
                          </div>

                          <div className="relative group/search">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/50 group-focus-within/search:text-blue-500 transition-colors" />
                            {/* INPUT ARREDONDADO (PILL) */}
                            <Input
                              placeholder="Buscar código ou bairro..."
                              className="h-11 pl-11 pr-20 rounded-full bg-white/60 dark:bg-black/20 backdrop-blur-md border border-white/80 dark:border-white/10 focus:ring-4 focus:ring-blue-500/20 transition-all font-bold text-xs shadow-sm hover:shadow-[0_0_15px_rgba(59,130,246,0.1)]"
                              value={searchQuery}
                              onChange={(e) => setSearchQuery(e.target.value)}
                              onKeyDown={(e) => e.key === "Enter" && handleSearchProperties()}
                            />
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={handleSearchProperties}
                              disabled={loading}
                              className="absolute right-1.5 top-1/2 -translate-y-1/2 h-8 px-4 rounded-full text-blue-600 dark:text-blue-400 bg-blue-500/10 hover:bg-blue-500/20 font-black text-[9px] uppercase tracking-widest transition-all"
                            >
                              {loading ? "..." : "Buscar"}
                            </Button>
                          </div>

                          {searchResults.length > 0 && (
                            <div className="grid grid-cols-1 gap-2 max-h-[250px] overflow-y-auto pr-1 custom-scrollbar">
                              {searchResults.map(i => {
                                const isSelected = (formData.featured_properties.items || []).some((s: any) => s.id === i.id);
                                return (
                                  <motion.div
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                    key={i.id}
                                    onClick={() => togglePropertySelection(i)}
                                    className={cn(
                                      "p-3 rounded-[1.5rem] border cursor-pointer flex items-center gap-3 transition-all duration-300 bg-white/80 dark:bg-white/5 backdrop-blur-xl",
                                      isSelected ? "border-blue-500 shadow-sm" : "border-white/60 dark:border-white/10 hover:border-blue-500/30"
                                    )}
                                  >
                                    <div className="w-12 h-12 rounded-xl overflow-hidden shadow-sm shrink-0 border border-white/40 dark:border-white/10">
                                      <img src={i.imagem} className="w-full h-full object-cover" />
                                    </div>
                                    <div className="flex-1 min-w-0 space-y-0.5">
                                      <div className="text-xs font-black truncate text-foreground">{i.titulo}</div>
                                      <div className="flex items-center gap-2">
                                        <span className="text-[10px] font-black text-blue-600 dark:text-blue-400 bg-blue-500/10 px-1.5 rounded-md">{i.preco}</span>
                                        <span className="text-[8px] font-bold opacity-50 uppercase tracking-widest truncate">{i.localizacao}</span>
                                      </div>
                                    </div>
                                    <div className={cn("w-6 h-6 rounded-full flex items-center justify-center transition-all", isSelected ? "bg-blue-500 text-white" : "bg-white/50 dark:bg-white/10 text-muted-foreground")}>
                                      {isSelected ? <Check className="w-3 h-3" /> : <Plus className="w-3 h-3" />}
                                    </div>
                                  </motion.div>
                                );
                              })}
                            </div>
                          )}
                        </div>

                        {/* LISTAGEM DE SELECIONADOS */}
                        <div className="space-y-4">
                          <div className="flex items-center justify-between px-2">
                            <Label className="text-[9px] font-black uppercase text-muted-foreground/60 tracking-[0.15em]">Selecionados ({formData.featured_properties.items?.length || 0})</Label>
                            {formData.featured_properties.items?.length > 0 && (
                              <button
                                onClick={() => setFormData({ ...formData, featured_properties: { ...formData.featured_properties, items: [] } })}
                                className="text-[8px] font-black text-rose-500 uppercase tracking-widest hover:underline bg-rose-500/10 px-3 py-1 rounded-full transition-all hover:bg-rose-500 hover:text-white"
                              >
                                Limpar
                              </button>
                            )}
                          </div>

                          {(!formData.featured_properties.items || formData.featured_properties.items.length === 0) ? (
                            <div className="py-12 text-center border-2 border-dashed border-white/60 dark:border-white/10 rounded-[2rem] bg-white/20 dark:bg-white/5">
                              <LayoutGrid className="w-6 h-6 mx-auto mb-2 text-muted-foreground/40" />
                              <p className="text-[9px] font-black uppercase tracking-[0.15em] text-muted-foreground/50">Nenhum imóvel selecionado</p>
                            </div>
                          ) : (
                            <div className="space-y-5">
                              {propertyFolders.length > 0 ? (
                                propertyFolders.map((folder) => {
                                  const folderItems = formData.featured_properties.items?.filter((item: any) => item.folder_id === folder.id) || [];
                                  if (folderItems.length === 0) return null;
                                  
                                  return (
                                    <motion.div key={folder.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-3">
                                      <div className="px-2 flex items-center gap-2">
                                        <span className="text-xl">{folder.icon}</span>
                                        <span className="text-xs font-black" style={{ color: folder.color }}>
                                          {folder.name} ({folderItems.length})
                                        </span>
                                        <div className="h-px flex-1" style={{ backgroundColor: `${folder.color}40` }} />
                                      </div>
                                      <div className="grid grid-cols-2 gap-4">
                                        {folderItems.map((item: any) => (
                                          <motion.div whileHover={{ y: -2 }} key={item.id} className="group relative bg-white/60 dark:bg-white/5 backdrop-blur-xl border-2 rounded-[2rem] p-3 flex flex-col gap-2 shadow-sm transition-all hover:shadow-lg" style={{ borderColor: `${folder.color}60` }}>
                                            <div className="aspect-video w-full rounded-[1.2rem] overflow-hidden relative border border-white/40 dark:border-white/5 shadow-inner">
                                              <img src={item.imagem} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                                              <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                                              <button
                                                onClick={() => togglePropertySelection(item)}
                                                className="absolute top-2 right-2 w-7 h-7 rounded-full bg-white/90 dark:bg-zinc-900/90 backdrop-blur-md text-rose-500 flex items-center justify-center shadow-md hover:scale-110 opacity-0 group-hover:opacity-100 transition-all hover:bg-rose-500 hover:text-white"
                                              >
                                                <Trash2 className="w-3.5 h-3.5" />
                                              </button>
                                            </div>
                                            <div className="space-y-1 px-1">
                                              <div className="text-xs font-black truncate text-foreground">{item.titulo}</div>
                                              <div className="text-[10px] font-black text-blue-600 dark:text-blue-400">{item.preco}</div>
                                            </div>
                                          </motion.div>
                                        ))}
                                      </div>
                                    </motion.div>
                                  );
                                })
                              ) : (
                                <div className="space-y-3">
                                  <div className="px-2 flex items-center gap-2 opacity-60">
                                    <span className="text-xl">📋</span>
                                    <span className="text-xs font-black text-muted-foreground">Sem Classificação</span>
                                    <div className="h-px flex-1 bg-muted-foreground/20" />
                                  </div>
                                  <div className="grid grid-cols-2 gap-4">
                                    {formData.featured_properties.items?.map((item: any) => (
                                      <motion.div whileHover={{ y: -2 }} key={item.id} className="group relative bg-white/60 dark:bg-white/5 backdrop-blur-xl border border-white/60 dark:border-white/10 rounded-[2rem] p-3 flex flex-col gap-2 shadow-sm transition-all hover:shadow-lg">
                                        <div className="aspect-video w-full rounded-[1.2rem] overflow-hidden relative border border-white/40 dark:border-white/5 shadow-inner">
                                          <img src={item.imagem} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                                          <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                                          <button
                                            onClick={() => togglePropertySelection(item)}
                                            className="absolute top-2 right-2 w-7 h-7 rounded-full bg-white/90 dark:bg-zinc-900/90 backdrop-blur-md text-rose-500 flex items-center justify-center shadow-md hover:scale-110 opacity-0 group-hover:opacity-100 transition-all hover:bg-rose-500 hover:text-white"
                                          >
                                            <Trash2 className="w-3.5 h-3.5" />
                                          </button>
                                        </div>
                                        <div className="space-y-1 px-1">
                                          <div className="text-xs font-black truncate text-foreground">{item.titulo}</div>
                                          <div className="text-[10px] font-black text-blue-600 dark:text-blue-400">{item.preco}</div>
                                        </div>
                                      </motion.div>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </motion.div>
                    )}
                  </motion.section>
                </motion.div>
              )}

              {activeSection === "seo" && (
                <motion.div key="seo" variants={itemVariants} initial="hidden" animate="visible" exit="exit" className="space-y-8">
                  <motion.section whileHover={{ y: -2 }} className="p-6 rounded-[2.5rem] bg-white/40 dark:bg-white/5 backdrop-blur-2xl border border-white/60 dark:border-white/10 shadow-sm space-y-6 relative transition-all hover:shadow-lg">
                    <div className="space-y-1">
                      <div className="flex items-center gap-3">
                        <div className="h-6 w-1 bg-gradient-to-b from-indigo-400 to-purple-600 rounded-full shadow-sm" />
                        <h3 className="text-lg font-black tracking-tight text-foreground">SEO & Social</h3>
                      </div>
                      <p className="text-[9px] font-black text-muted-foreground/60 uppercase tracking-[0.15em] ml-4">Presença Impecável</p>
                    </div>

                    <div className="space-y-5 pt-2">
                      <div className="space-y-1.5">
                        <Label className="text-[9px] font-black uppercase text-muted-foreground/60 tracking-[0.15em] ml-2">Título SEO</Label>
                        {/* INPUT ARREDONDADO (PILL) */}
                        <Input value={formData.seo.title} onChange={(e) => setFormData({ ...formData, seo: { ...formData.seo, title: e.target.value } })} className="h-11 rounded-full px-5 bg-white/50 dark:bg-black/20 backdrop-blur-md border border-white/60 dark:border-white/10 focus:ring-4 focus:ring-indigo-500/20 font-bold text-xs shadow-inner transition-all hover:shadow-[0_0_15px_rgba(99,102,241,0.1)]" />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-[9px] font-black uppercase text-muted-foreground/60 tracking-[0.15em] ml-2">Descrição SEO</Label>
                        {/* TEXTAREA SUPER ARREDONDADO */}
                        <Textarea placeholder="Descreva sua atuação..." value={formData.seo.description} onChange={(e) => setFormData({ ...formData, seo: { ...formData.seo, description: e.target.value } })} className="min-h-[120px] rounded-[2rem] bg-white/50 dark:bg-black/20 backdrop-blur-md border border-white/60 dark:border-white/10 focus:ring-4 focus:ring-indigo-500/20 text-xs font-bold resize-none p-5 shadow-inner transition-all leading-relaxed hover:shadow-[0_0_15px_rgba(99,102,241,0.1)]" />
                      </div>
                    </div>
                  </motion.section>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </main>

        {/* ── PREVIEW DESKTOP (ESCALA MENOR COM VIRTUAL VIEWPORT) ── */}
        <div className="hidden xl:flex w-[380px] bg-white/20 dark:bg-black/20 backdrop-blur-3xl items-center justify-center border-l border-white/60 dark:border-white/10 p-8 relative shadow-inner shrink-0">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_120%,rgba(var(--primary),0.10),transparent)] pointer-events-none" />

          <motion.div
            animate={{ y: [0, -5, 0] }}
            transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
            className="relative w-[280px] h-[580px] bg-zinc-900/80 dark:bg-black/80 backdrop-blur-3xl rounded-[2.5rem] border-[6px] border-zinc-900 dark:border-[#151515] shadow-2xl overflow-hidden ring-1 ring-white/20 z-10"
          >
            {/* Notch Premium */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-24 h-5 bg-zinc-900 dark:bg-[#151515] rounded-b-2xl z-[100] flex justify-center items-end pb-1">
              <div className="w-1 h-1 rounded-full bg-white/10" />
            </div>

            {renderPreviewDevice()}

            <div className="absolute inset-0 z-[90] pointer-events-none bg-gradient-to-tr from-white/10 via-transparent to-transparent opacity-20 mix-blend-overlay" />
            <div className="absolute bottom-1.5 left-1/2 -translate-x-1/2 w-8 h-[3px] bg-white/30 rounded-full z-[100]" />
          </motion.div>

          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-2 px-4 py-1.5 bg-white/50 dark:bg-black/50 backdrop-blur-2xl rounded-full border border-white/40 shadow-sm z-20">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[8px] font-black uppercase tracking-[0.2em] text-foreground/70">Live Preview</span>
          </div>
        </div>
      </div>

      {/* ── BOTÃO FLOATING PARA PREVIEW MOBILE (ANIMADO) ── */}
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={springTransition}
        className="xl:hidden fixed bottom-6 right-6 z-[90]"
      >
        <Button
          onClick={() => setShowMobilePreview(true)}
          className="rounded-full h-12 px-6 bg-primary text-white shadow-xl shadow-primary/30 flex items-center gap-2 border border-white/20 active:scale-95 transition-all hover:shadow-[0_0_20px_rgba(var(--primary),0.4)]"
        >
          <Eye className="w-4 h-4" />
          <span className="text-[10px] font-black uppercase tracking-widest">Preview</span>
        </Button>
      </motion.div>

      {/* ── MODAL PREVIEW MOBILE ── */}
      <AnimatePresence>
        {showMobilePreview && (
          <motion.div
            initial={{ opacity: 0, y: "100%" }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="fixed inset-0 z-[150] bg-white/60 dark:bg-black/60 backdrop-blur-3xl xl:hidden flex flex-col items-center justify-center overflow-hidden"
          >
            {/* BOTÃO DE FECHAR AJUSTADO: Z-INDEX SUPERIOR E REMOÇÃO DE MOTION NO WRAPPER PARA EVITAR CONFLITO TOUCH */}
            <Button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setShowMobilePreview(false);
              }}
              variant="ghost"
              size="icon"
              className="absolute top-6 right-6 bg-white dark:bg-zinc-800 rounded-full border border-black/10 dark:border-white/10 shadow-2xl z-[200] h-12 w-12 text-foreground active:scale-90 transition-transform touch-none"
            >
              <X className="w-6 h-6" />
            </Button>

            <div className="relative w-[280px] h-[580px] max-h-[85vh] bg-zinc-900/80 dark:bg-black/80 backdrop-blur-3xl rounded-[2.5rem] border-[6px] border-zinc-900 dark:border-[#151515] shadow-2xl overflow-hidden ring-1 ring-white/20">
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-24 h-5 bg-zinc-900 dark:bg-[#151515] rounded-b-2xl z-[100] flex justify-center items-end pb-1">
                <div className="w-1 h-1 rounded-full bg-white/10" />
              </div>

              {renderPreviewDevice()}

              <div className="absolute inset-0 z-[90] pointer-events-none bg-gradient-to-tr from-white/10 via-transparent to-transparent opacity-20 mix-blend-overlay" />
              <div className="absolute bottom-1.5 left-1/2 -translate-x-1/2 w-8 h-[3px] bg-white/30 rounded-full z-[100]" />
            </div>

            <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.2 }} className="mt-6 flex items-center gap-2 px-4 py-1.5 bg-white/50 dark:bg-black/50 backdrop-blur-md rounded-full border border-white/40 shadow-sm">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[9px] font-black uppercase tracking-[0.2em] text-foreground/80">Visualização Mobile</span>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── MODAL DE SUCESSO ── */}
      <AnimatePresence>
        {showSuccessModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/60 dark:bg-black/80 backdrop-blur-xl"
          >
            <motion.div
              initial={{ scale: 0.9, y: 20, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.9, y: 20, opacity: 0 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="bg-white/80 dark:bg-zinc-900/80 backdrop-blur-3xl rounded-[2.5rem] p-8 max-w-xs w-full shadow-2xl border border-white/60 dark:border-white/10 text-center relative overflow-hidden"
            >
              <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/80 dark:via-white/20 to-transparent" />

              <div className="relative z-10">
                <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={springTransition} className="w-16 h-16 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-md shadow-emerald-500/30 border border-white/40">
                  <CheckCircle2 className="w-8 h-8 text-white" />
                </motion.div>
                <h2 className="text-xl font-black tracking-tight text-foreground mb-2">Publicado!</h2>
                <p className="text-muted-foreground/80 text-xs font-bold mb-6">
                  Sua página já está no ar com o novo design.
                </p>

                <div className="bg-white/50 dark:bg-black/30 backdrop-blur-md p-3 rounded-2xl mb-6 flex items-center justify-between gap-3 border border-white/60 dark:border-white/10 shadow-inner">
                  <div className="flex items-center gap-2 overflow-hidden ml-1">
                    <Globe className="w-4 h-4 text-blue-500 shrink-0" />
                    <span className="text-[10px] font-black truncate text-foreground/80">flow63.com/bio/{formData.slug}</span>
                  </div>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => {
                      navigator.clipboard.writeText(`${window.location.origin}/bio/${formData.slug}`);
                      toast.success("Link copiado!");
                    }}
                    className="p-2 bg-white/80 dark:bg-zinc-800/80 rounded-xl shadow-sm border border-white/80 dark:border-white/5 transition-all text-blue-600"
                  >
                    <Copy className="w-3.5 h-3.5" />
                  </motion.button>
                </div>

                <div className="flex flex-col gap-3">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => window.open(`/bio/${formData.slug}`, '_blank')}
                    className="w-full py-3.5 bg-primary text-white rounded-[1.2rem] font-black text-[10px] uppercase tracking-[0.15em] shadow-md border border-white/20 transition-all"
                  >
                    Visualizar Online
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setShowSuccessModal(false)}
                    className="w-full py-3.5 bg-white/50 dark:bg-white/5 backdrop-blur-md text-foreground/70 rounded-[1.2rem] font-black text-[10px] uppercase tracking-[0.15em] transition-all border border-white/50 shadow-sm"
                  >
                    Voltar ao Editor
                  </motion.button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}