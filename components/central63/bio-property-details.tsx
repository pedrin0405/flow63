"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
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
  DollarSign,
  Calendar,
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

  const nextImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentImageIndex((prev) => (prev + 1) % images.length);
  };

  const prevImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentImageIndex((prev) => (prev - 1 + images.length) % images.length);
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
      className="fixed inset-0 z-[1000] flex items-center justify-center p-4 md:p-10 backdrop-blur-md bg-black/20"
      onClick={onClose}
    >
      <motion.div 
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.9, opacity: 0, y: 20 }}
        className="relative w-full max-w-5xl max-h-[90vh] rounded-[2.5rem] overflow-hidden shadow-2xl flex flex-col md:flex-row border border-white/20 backdrop-blur-3xl"
        style={{ 
          backgroundColor: isDark 
            ? (bgColor.startsWith('#') ? `${bgColor}B3` : bgColor) // Dark Glass (70%)
            : "rgba(255, 255, 255, 0.85)", // Light Glass (Branco Leitoso 85%)
          color: textColor 
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <button 
          onClick={onClose}
          className="absolute top-6 right-6 z-50 p-2 rounded-full bg-black/5 hover:bg-black/10 text-current backdrop-blur-md transition-all border border-black/5"
        >
          <X className="w-5 h-5" />
        </button>

        {/* GALERIA DE IMAGENS */}
        <div className="relative w-full md:w-3/5 h-64 md:h-auto bg-black group shrink-0">
          <AnimatePresence mode="wait">
            <motion.img 
              key={currentImageIndex}
              src={images[currentImageIndex] || property.imagem} 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.4 }}
              className="w-full h-full object-cover"
            />
          </AnimatePresence>

          {images.length > 1 && (
            <>
              <button 
                onClick={prevImage}
                className="absolute left-4 top-1/2 -translate-y-1/2 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-all"
              >
                <ChevronLeft className="w-6 h-6" />
              </button>
              <button 
                onClick={nextImage}
                className="absolute right-4 top-1/2 -translate-y-1/2 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-all"
              >
                <ChevronRight className="w-6 h-6" />
              </button>
              <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-1.5">
                {images.map((_, idx) => (
                  <div 
                    key={idx} 
                    className={cn(
                      "w-1.5 h-1.5 rounded-full transition-all",
                      idx === currentImageIndex ? "bg-white w-4" : "bg-white/40"
                    )} 
                  />
                ))}
              </div>
            </>
          )}
        </div>

        {/* INFORMAÇÕES */}
        <div className="flex-1 p-8 md:p-12 overflow-y-auto custom-scrollbar flex flex-col">
          <div className="space-y-2 mb-8 relative">
            <div className="flex items-center gap-2">
              <span 
                className="px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest text-white shadow-lg"
                style={{ backgroundColor: accentColor }}
              >
                {details?.tipo || "Imóvel"}
              </span>
              <span 
                className="px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest opacity-60"
                style={{ backgroundColor: isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.05)", color: textColor }}
              >
                {details?.situacao || "Venda"}
              </span>
            </div>
            <h2 className="text-2xl md:text-3xl font-black tracking-tighter leading-tight">
              {details?.titulo || property.titulo}
            </h2>
            <p className="flex items-center gap-1.5 text-sm font-bold opacity-40">
              <MapPin className="w-4 h-4" />
              {details?.bairro}, {details?.cidade} - {details?.estado}
            </p>
          </div>

          <div className="text-3xl font-black mb-10 tracking-tighter" style={{ color: accentColor }}>
            {details?.valor || property.preco}
          </div>

          {/* INFORMAÇÕES TÉCNICAS ADAPTÁVEIS */}
          <div className="flex flex-wrap gap-3 mb-10">
            {features.map((f, idx) => (
              <div 
                key={idx} 
                className="flex-1 min-w-[130px] flex flex-col gap-1 p-4 rounded-2xl border transition-colors"
                style={{ 
                  backgroundColor: isDark ? "rgba(255,255,255,0.05)" : "rgba(255,255,255,0.4)", 
                  borderColor: isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.05)" 
                }}
              >
                <f.icon className="w-4 h-4 opacity-30 shrink-0 mb-1" />
                <span className="text-[10px] font-bold opacity-40 uppercase tracking-widest leading-none">
                  {f.label}
                </span>
                <span className="text-[15px] font-black leading-tight whitespace-nowrap">
                  {f.value}
                </span>
              </div>
            ))}
          </div>

          {/* AMENITIES */}
          {amenities.length > 0 && (
            <div className="mb-10">
              <h3 className="text-[10px] font-black uppercase tracking-[3px] opacity-30 mb-5 text-center">Infraestrutura</h3>
              <div className="flex flex-wrap gap-2 justify-center">
                {amenities.map((a, idx) => (
                  <div 
                    key={idx} 
                    className="flex items-center gap-2 px-4 py-2 rounded-xl border transition-colors shadow-sm"
                    style={{ 
                      backgroundColor: isDark ? "rgba(255,255,255,0.05)" : "rgba(255,255,255,0.6)", 
                      borderColor: isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.03)" 
                    }}
                  >
                    <a.icon className="w-3.5 h-3.5" style={{ color: accentColor }} />
                    <span className="text-[10px] font-black uppercase tracking-widest opacity-60">{a.label}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* DESCRIÇÃO */}
          <div className="space-y-4">
            <h3 className="text-[10px] font-black uppercase tracking-[3px] opacity-30">Descrição</h3>
            <p className="text-sm font-medium leading-relaxed opacity-70 whitespace-pre-wrap">
              {details?.descricao || "Sem descrição disponível."}
            </p>
          </div>

          <div className="mt-auto pt-12">
            <Button 
              className="w-full h-14 rounded-2xl font-black text-[11px] uppercase tracking-[3px] shadow-xl hover:scale-[1.02] active:scale-95 transition-all"
              style={{ backgroundColor: accentColor, color: "#ffffff" }}
              onClick={() => {
                const message = `Olá! Tenho interesse no imóvel: ${details?.titulo || property.titulo}, com o codigo ${details?.codigo || property.id}. Poderia me fornecer mais informações?.`;
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
