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
  Armchair,
  MessageCircle
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
    if (currentImageIndex < images.length - 1) setCurrentImageIndex((prev) => prev + 1);
  };

  const prevImage = () => {
    if (currentImageIndex > 0) setCurrentImageIndex((prev) => prev - 1);
  };

  const handleDragEnd = (event: any, info: any) => {
    const swipeThreshold = 50;
    const { offset, velocity } = info;
    if (offset.x < -swipeThreshold || velocity.x < -500) nextImage();
    else if (offset.x > swipeThreshold || velocity.x > 500) prevImage();
    dragX.set(0);
  };

  const transitionSettings = { type: "spring", damping: 30, stiffness: 300, mass: 0.8 };

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
      className="fixed inset-0 z-[1000] flex items-end md:items-center justify-center p-0 md:p-6 lg:p-10 backdrop-blur-md bg-black/60"
      onClick={onClose}
    >
      <motion.div 
        initial={{ y: "100%", opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: "100%", opacity: 0 }}
        transition={{ type: "spring", damping: 25, stiffness: 200 }}
        className="relative w-full max-w-6xl h-[92vh] md:h-[90vh] rounded-t-[2.5rem] md:rounded-[2.5rem] overflow-hidden shadow-2xl flex flex-col md:flex-row border-t md:border border-white/20 backdrop-blur-3xl"
        style={{ 
          backgroundColor: isDark 
            ? (bgColor.startsWith('#') ? `${bgColor}FA` : bgColor)
            : "rgba(255, 255, 255, 0.98)",
          color: textColor 
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* BOTÃO FECHAR */}
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 md:top-6 md:right-6 z-[70] p-2.5 rounded-full bg-black/20 hover:bg-black/40 text-white backdrop-blur-xl transition-all border border-white/10"
        >
          <X className="w-5 h-5" />
        </button>

        {/* GALERIA DE IMAGENS */}
        <div className="relative w-full md:w-[55%] h-[35vh] sm:h-[45vh] md:h-full bg-neutral-900 shrink-0 overflow-hidden group">
          <motion.div
            className="flex h-full w-full cursor-grab active:cursor-grabbing"
            drag="x"
            dragConstraints={{ left: 0, right: 0 }}
            style={{ x: dragX }}
            onDragEnd={handleDragEnd}
            animate={{ x: `calc(-${currentImageIndex * 100}%)` }}
            transition={transitionSettings}
          >
            {images.map((src, index) => (
              <div key={index} className="w-full h-full flex-shrink-0">
                <img 
                  src={src} 
                  alt={`Foto ${index + 1}`}
                  className="w-full h-full object-cover pointer-events-none select-none" 
                />
              </div>
            ))}
          </motion.div>

          {/* INDICADORES */}
          <div className="absolute top-4 left-4 px-3 py-1.5 rounded-full bg-black/50 backdrop-blur-md text-white text-[12px] font-bold z-10 border border-white/10">
            {currentImageIndex + 1} / {images.length}
          </div>

          {images.length > 1 && (
            <>
              <button 
                onClick={(e) => { e.stopPropagation(); prevImage(); }} 
                disabled={currentImageIndex === 0} 
                className="hidden md:flex absolute left-4 top-1/2 -translate-y-1/2 p-3 rounded-full bg-white/10 hover:bg-white/20 text-white backdrop-blur-md opacity-0 group-hover:opacity-100 transition-all z-20 disabled:opacity-0"
              >
                <ChevronLeft className="w-6 h-6" />
              </button>
              <button 
                onClick={(e) => { e.stopPropagation(); nextImage(); }} 
                disabled={currentImageIndex === images.length - 1} 
                className="hidden md:flex absolute right-4 top-1/2 -translate-y-1/2 p-3 rounded-full bg-white/10 hover:bg-white/20 text-white backdrop-blur-md opacity-0 group-hover:opacity-100 transition-all z-20 disabled:opacity-0"
              >
                <ChevronRight className="w-6 h-6" />
              </button>
              
              <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2 z-10">
                {images.map((_, idx) => (
                  <div key={idx} className={cn("w-1.5 h-1.5 rounded-full transition-all duration-300", idx === currentImageIndex ? "bg-white w-6" : "bg-white/30")} />
                ))}
              </div>
            </>
          )}
        </div>

        {/* ÁREA DE CONTEÚDO */}
        <div className="flex-1 flex flex-col h-full overflow-hidden relative">
          
          {/* Scroll container (Removido o pb gigante que falhava em alguns casos) */}
          <div className="flex-1 overflow-y-auto custom-scrollbar p-6 md:p-10 lg:p-12 space-y-8">
            
            {/* TÍTULO E PREÇO */}
            <div className="space-y-4">
              <div className="flex flex-wrap gap-2">
                <span className="px-3 py-1 rounded-lg text-[12px] font-black uppercase tracking-[1.5px] text-white" style={{ backgroundColor: accentColor }}>
                  {details?.tipo || "Imóvel"}
                </span>
                <span className="px-3 py-1 rounded-lg text-[12px] font-black uppercase tracking-[1.5px] border border-current opacity-60">
                  {details?.situacao || "Venda"}
                </span>
              </div>
              <h2 className="text-2xl md:text-4xl font-black tracking-tighter leading-[1.1]">
                {details?.titulo || property.titulo}
              </h2>
              <div className="flex items-center gap-2 text-sm font-medium opacity-50">
                <MapPin className="w-4 h-4 text-rose-500" />
                {details?.bairro}, {details?.cidade}
              </div>
              <div className="text-3xl md:text-4xl font-black tracking-tight pt-2" style={{ color: accentColor }}>
                {details?.valor || property.preco}
              </div>
            </div>

            {/* FEATURES */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {features.map((f, idx) => (
                <div 
                  key={idx} 
                  className="flex flex-col gap-2 p-4 rounded-3xl border"
                  style={{ 
                    backgroundColor: isDark ? "rgba(255,255,255,0.03)" : "rgba(0,0,0,0.02)", 
                    borderColor: isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.05)" 
                  }}
                >
                  <f.icon className="w-5 h-5 opacity-40" />
                  <div>
                    <p className="text-[12px] font-bold uppercase opacity-40 tracking-widest">{f.label}</p>
                    <p className="text-sm font-black tracking-tight">{f.value}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* AMENITIES */}
            {amenities.length > 0 && (
              <div className="space-y-4">
                <h3 className="text-[12px] font-black uppercase tracking-[3px] opacity-30">Infraestrutura</h3>
                <div className="flex flex-wrap gap-2">
                  {amenities.map((a, idx) => (
                    <div 
                      key={idx} 
                      className="flex items-center gap-2.5 px-4 py-2.5 rounded-2xl bg-current/5 border border-current/10"
                    >
                      <a.icon className="w-4 h-4" style={{ color: accentColor }} />
                      <span className="text-[12px] font-bold uppercase tracking-wider">{a.label}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* DESCRIÇÃO */}
            <div className="space-y-4">
              <h3 className="text-[12px] font-black uppercase tracking-[3px] opacity-30">Sobre este imóvel</h3>
              <p className="text-[15px] font-medium leading-relaxed opacity-70 whitespace-pre-wrap">
                {details?.descricao || "Sem descrição disponível."}
              </p>
            </div>

            {/* Spacer vital EXCLUSIVO para mobile: Garante que o usuário consiga rolar
                tudo até o fim sem a descrição ficar presa embaixo do absolute mobile */}
            <div className="w-full h-28 md:hidden shrink-0 pointer-events-none" />
          </div>

          {/* RODAPÉ FIXO 
              Ajuste Chave: Passou de 'absolute' para 'md:relative' - no Desktop ele 
              entra no fluxo normal do layout, impossibilitando totalmente a sobreposição! 
          */}
          <div className="absolute md:relative bottom-0 left-0 w-full p-6 md:p-10 pt-10 bg-gradient-to-t from-black/80 via-black/40 to-transparent md:from-inherit md:via-inherit md:bg-inherit border-t-0 md:border-t border-white/5 md:backdrop-blur-2xl z-20 shrink-0 pointer-events-none md:pointer-events-auto">
            
            {/* O wrapper volta com pointer-events-auto para o botão funcionar,
                mas mantém o gradiente transparente "clicável" / scrollável no mobile */}
            <div className="pointer-events-auto w-full">
              <Button 
                className="w-full h-16 rounded-2xl font-black text-xs uppercase tracking-[3px] shadow-2xl flex items-center justify-center gap-3 hover:scale-[1.01] active:scale-95 transition-all"
                style={{ backgroundColor: accentColor, color: "#ffffff" }}
                onClick={() => {
                  const message = `Olá! Tenho interesse no imóvel: ${details?.titulo || property.titulo}, código ${details?.codigo || property.id}.`;
                  const phone = whatsappNumber?.replace(/\D/g, "") || "";
                  window.open(`https://wa.me/${phone}?text=${encodeURIComponent(message)}`, "_blank");
                }}
              >
                <MessageCircle className="w-5 h-5 fill-current" />
                Falar com o Corretor
              </Button>
            </div>
            
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}