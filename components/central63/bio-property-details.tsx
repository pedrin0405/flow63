"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence, useMotionValue } from "framer-motion";
import { 
  X, 
  MapPin, 
  Ruler, 
  BedDouble, 
  Bath, 
  Car, 
  Maximize, 
  ChevronLeft, 
  ChevronRight,
  Info,
  Waves,
  UtensilsCrossed,
  Wind,
  Trees,
  Armchair
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface BioPropertyDetailsProps {
  property: any;
  onClose: () => void;
  tema: any;
  whatsappNumber?: string;
}

export function BioPropertyDetails({ property, onClose, tema, whatsappNumber }: BioPropertyDetailsProps) {
  const [images, setImages] = useState<string[]>([]);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [details, setDetails] = useState<any>(null);

  // Valor de movimento para controlar o arrasto manual
  const dragX = useMotionValue(0);

  const accentColor = tema.button_bg;
  const bgColor = tema.bg_color;
  const textColor = tema.text_color;

  const isDark = textColor === "#ffffff" || textColor === "#f8fafc";

  useEffect(() => {
    async function fetchPropertyData() {
      setLoading(true);
      try {
        const codigo = property.id || property.codigo;
        const isNumeric = /^\d+$/.test(codigo);
        
        if (isNumeric) {
          const [fotosRes, detailsRes] = await Promise.all([
            supabase.from("fotos_imoveis_pmw").select("url").eq("imovel_codigo", parseInt(codigo)),
            supabase.from("imovel_pmw").select("*").eq("codigo", parseInt(codigo)).single()
          ]);

          const allImages = [
            property.imagem || property.urlfotoprincipal,
            ...(fotosRes.data?.map(f => f.url) || [])
          ].filter(Boolean);

          setImages(Array.from(new Set(allImages)));
          setDetails(detailsRes.data);
        }
      } catch (error) {
        console.error("Erro ao carregar detalhes do imóvel:", error);
      } finally {
        setLoading(false);
      }
    }

    if (property) fetchPropertyData();
  }, [property]);

  const nextImage = () => {
    if (currentImageIndex < images.length - 1) {
      setCurrentImageIndex((prev) => prev + 1);
    }
  };

  const prevImage = () => {
    if (currentImageIndex > 0) {
      setCurrentImageIndex((prev) => prev - 1);
    }
  };

  const handleDragEnd = (event: any, info: any) => {
    const swipeThreshold = 50;
    const { offset, velocity } = info;

    if (offset.x < -swipeThreshold || velocity.x < -500) {
      nextImage();
    } else if (offset.x > swipeThreshold || velocity.x > 500) {
      prevImage();
    }
    // Reseta o dragX para que a animação baseada no Index assuma o controle
    dragX.set(0);
  };

  const transitionSettings = {
    type: "spring",
    damping: 30,
    stiffness: 300,
    mass: 0.8
  };

  if (!property) return null;

  const features = [
    { icon: Ruler, label: "Área", value: details?.areaprincipal ? `${details.areaprincipal}m²` : null },
    { icon: BedDouble, label: "Quartos", value: details?.numeroquartos },
    { icon: Bath, label: "Banhos", value: details?.numerobanhos },
    { icon: Car, label: "Vagas", value: details?.numerovagas },
    { icon: Maximize, label: "Lote", value: details?.area_lote ? `${details.area_lote}m²` : null },
  ].filter(f => f.value);

  const amenities = [
    { icon: Waves, label: "Piscina", value: details?.possui_piscina },
    { icon: UtensilsCrossed, label: "Churrasqueira", value: details?.possui_churrasqueira },
    { icon: Wind, label: "Ar Condicionado", value: details?.possui_ar_condicionado },
    { icon: Trees, label: "Quintal", value: details?.possui_quintal },
    { icon: Armchair, label: "Mobiliado", value: details?.esta_mobiliado },
    { icon: Info, label: "Varanda Gourmet", value: details?.possui_varanda_gourmet },
  ].filter(a => a.value);

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[1000] flex items-end md:items-center justify-center p-0 md:p-10 backdrop-blur-md bg-black/40"
      onClick={onClose}
    >
      <motion.div 
        initial={{ y: "100%", opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: "100%", opacity: 0 }}
        transition={{ type: "spring", damping: 25, stiffness: 200 }}
        className="relative w-full max-w-5xl h-[95vh] md:h-auto md:max-h-[90vh] rounded-t-[2.5rem] md:rounded-[2.5rem] overflow-hidden shadow-2xl flex flex-col md:flex-row border-t md:border border-white/20 backdrop-blur-3xl"
        style={{ 
          backgroundColor: isDark 
            ? (bgColor.startsWith('#') ? `${bgColor}F2` : bgColor)
            : "rgba(255, 255, 255, 0.95)",
          color: textColor 
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* INDICADOR DE DRAG MOBILE */}
        <div className="md:hidden absolute top-3 left-1/2 -translate-x-1/2 w-12 h-1.5 bg-black/20 rounded-full z-[60]" />
        
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 md:top-6 md:right-6 z-50 p-2.5 rounded-full bg-black/10 hover:bg-black/20 text-current backdrop-blur-md transition-all border border-black/5"
        >
          <X className="w-5 h-5" />
        </button>

        {/* GALERIA DE IMAGENS - CARROSSEL FLUIDO */}
        <div className="relative w-full md:w-3/5 h-[40vh] md:h-auto bg-black shrink-0 overflow-hidden group">
          <motion.div
            className="flex h-full w-full cursor-grab active:cursor-grabbing"
            drag="x"
            dragConstraints={{ left: 0, right: 0 }}
            style={{ x: dragX }}
            onDragEnd={handleDragEnd}
            animate={{ 
              x: `calc(-${currentImageIndex * 100}%)` 
            }}
            transition={transitionSettings}
          >
            {images.map((src, index) => (
              <div key={index} className="w-full h-full flex-shrink-0">
                <img 
                  src={src} 
                  alt={`Imagem ${index + 1}`}
                  className="w-full h-full object-cover pointer-events-none select-none" 
                />
              </div>
            ))}
          </motion.div>

          <div className="absolute top-4 left-4 px-3 py-1 rounded-full bg-black/40 backdrop-blur-md text-white text-[10px] font-bold z-10">
            {currentImageIndex + 1} / {images.length}
          </div>

          {images.length > 1 && (
            <>
              <button 
                onClick={(e) => { e.stopPropagation(); prevImage(); }}
                disabled={currentImageIndex === 0}
                className="hidden md:flex absolute left-4 top-1/2 -translate-y-1/2 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-all z-10 disabled:opacity-30"
              >
                <ChevronLeft className="w-6 h-6" />
              </button>
              <button 
                onClick={(e) => { e.stopPropagation(); nextImage(); }}
                disabled={currentImageIndex === images.length - 1}
                className="hidden md:flex absolute right-4 top-1/2 -translate-y-1/2 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-all z-10 disabled:opacity-30"
              >
                <ChevronRight className="w-6 h-6" />
              </button>

              <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-1.5 pointer-events-none z-10">
                {images.map((_, idx) => (
                  <div 
                    key={idx} 
                    className={cn(
                      "w-1.5 h-1.5 rounded-full transition-all duration-300",
                      idx === currentImageIndex ? "bg-white w-5" : "bg-white/40"
                    )} 
                  />
                ))}
              </div>
            </>
          )}
        </div>

        {/* INFORMAÇÕES */}
        <div className="flex-1 p-6 md:p-12 overflow-y-auto custom-scrollbar flex flex-col">
          <div className="space-y-2 mb-6">
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest text-white shadow-lg" style={{ backgroundColor: accentColor }}>
                {details?.tipo || "Imóvel"}
              </span>
              <span className="px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest opacity-60" style={{ backgroundColor: isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.05)" }}>
                {details?.situacao || "Venda"}
              </span>
            </div>
            <h2 className="text-xl md:text-3xl font-black tracking-tighter leading-tight mt-2">
              {details?.titulo || property.titulo}
            </h2>
            <p className="flex items-center gap-1.5 text-xs font-bold opacity-40">
              <MapPin className="w-3.5 h-3.5" />
              {details?.bairro}, {details?.cidade}
            </p>
          </div>

          <div className="text-2xl md:text-3xl font-black mb-8 tracking-tighter" style={{ color: accentColor }}>
            {details?.valor || property.preco}
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 md:gap-3 mb-8">
            {features.map((f, idx) => (
              <div 
                key={idx} 
                className="flex flex-col gap-1 p-3 md:p-4 rounded-2xl border"
                style={{ 
                  backgroundColor: isDark ? "rgba(255,255,255,0.05)" : "rgba(255,255,255,0.4)", 
                  borderColor: isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.05)" 
                }}
              >
                <f.icon className="w-4 h-4 opacity-30 mb-1" />
                <span className="text-[9px] font-bold opacity-40 uppercase tracking-widest leading-none">{f.label}</span>
                <span className="text-[14px] font-black leading-tight">{f.value}</span>
              </div>
            ))}
          </div>

          {amenities.length > 0 && (
            <div className="mb-8">
              <h3 className="text-[9px] font-black uppercase tracking-[2px] opacity-30 mb-4">Diferenciais</h3>
              <div className="flex flex-wrap gap-2">
                {amenities.map((a, idx) => (
                  <div 
                    key={idx} 
                    className="flex items-center gap-2 px-3 py-1.5 rounded-xl border bg-white/5"
                    style={{ borderColor: isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.03)" }}
                  >
                    <a.icon className="w-3 h-3" style={{ color: accentColor }} />
                    <span className="text-[9px] font-bold uppercase tracking-wider opacity-70">{a.label}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="space-y-3 mb-20 md:mb-0">
            <h3 className="text-[9px] font-black uppercase tracking-[2px] opacity-30">Descrição Completa</h3>
            <p className="text-sm font-medium leading-relaxed opacity-70 whitespace-pre-wrap">
              {details?.descricao || "Sem descrição disponível."}
            </p>
          </div>

          <div className="sticky md:relative bottom-0 left-0 w-full pt-4 pb-2 md:pt-12 md:pb-0 mt-auto bg-inherit">
            <Button 
              className="w-full h-14 rounded-2xl font-black text-[11px] uppercase tracking-[3px] shadow-2xl hover:scale-[1.02] active:scale-95 transition-all"
              style={{ backgroundColor: accentColor, color: "#ffffff" }}
              onClick={() => {
                const message = `Olá! Tenho interesse no imóvel: ${details?.titulo || property.titulo}, código ${details?.codigo || property.id}.`;
                const phone = whatsappNumber?.replace(/\D/g, "") || "";
                window.open(`https://wa.me/${phone}?text=${encodeURIComponent(message)}`, "_blank");
              }}
            >
              Falar com o Corretor
            </Button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}