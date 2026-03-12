"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence, useMotionValue, useSpring, useTransform, useMotionTemplate } from "framer-motion";
import { 
  UserPlus, 
  MessageCircle, 
  Instagram, 
  Linkedin, 
  Github, 
  Youtube, 
  Globe, 
  Twitter,
  Link as LinkIcon,
  ArrowUpRight,
  Maximize2,
  Sparkles,
  Facebook,
  Music,
  Mail,
  Phone
} from "lucide-react";
import { cn } from "@/lib/utils";
import { BioPropertyDetails } from "../bio-property-details";

interface ThemeProps {
  data: any;
  visibleLinks: any[];
  handleLinkClick: (link: any, index: number) => void;
  getAnimationProps: (type: string) => any;
  isPreview?: boolean;
}

const getSocialIcon = (url: string) => {
  const lowerUrl = url.toLowerCase();
  if (lowerUrl.includes("instagram.com")) return <Instagram className="w-5 h-5" />;
  if (lowerUrl.includes("linkedin.com")) return <Linkedin className="w-5 h-5" />;
  if (lowerUrl.includes("twitter.com") || lowerUrl.includes("x.com")) return <Twitter className="w-5 h-5" />;
  if (lowerUrl.includes("facebook.com") || lowerUrl.includes("fb.com")) return <Facebook className="w-5 h-5" />;
  if (lowerUrl.includes("github.com")) return <Github className="w-5 h-5" />;
  if (lowerUrl.includes("youtube.com") || lowerUrl.includes("youtu.be")) return <Youtube className="w-5 h-5" />;
  if (lowerUrl.includes("tiktok.com")) return <Music className="w-5 h-5" />;
  if (lowerUrl.startsWith("whatsapp.com") || lowerUrl.includes("wa.me")) return <MessageCircle className="w-5 h-5" />;
  if (lowerUrl.startsWith("mailto:")) return <Mail className="w-5 h-5" />;
  if (lowerUrl.startsWith("tel:")) return <Phone className="w-5 h-5" />;
  return <Globe className="w-5 h-5" />;
};

const getYouTubeEmbed = (url: string) => {
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=|shorts\/)([^#&?]*).*/;
  const match = url.match(regExp);
  const videoId = (match && match[2].length === 11) ? match[2] : null;
  return videoId ? `https://www.youtube.com/embed/${videoId}` : url;
};

const getSpotifyEmbed = (url: string) => {
  try {
    const urlObj = new URL(url);
    if (urlObj.hostname.includes('spotify.com') && urlObj.pathname.includes('/track/')) {
        return url.replace('open.spotify.com', 'open.spotify.com/embed');
    }
  } catch (e) { return url; }
  return url;
};

const glassPanelStyle = (tema: any) => {
  const isDark = tema.bg_color === "#050505" || tema.bg_color === "#000000" || tema.text_color === "#ffffff";
  const baseColor = isDark ? "255,255,255" : "0,0,0";
  return {
    background: `linear-gradient(135deg, rgba(${baseColor},0.06) 0%, rgba(${baseColor},0.01) 100%)`,
    backdropFilter: "blur(50px) saturate(210%)",
    WebkitBackdropFilter: "blur(50px) saturate(210%)",
    border: `1px solid rgba(${baseColor}, ${isDark ? "0.12" : "0.08"})`,
    boxShadow: isDark ? `0 25px 60px -10px rgba(0, 0, 0, 0.4), inset 0 0 0 1px rgba(255, 255, 255, 0.08), inset 0 20px 40px -15px rgba(255, 255, 255, 0.05)` : `0 25px 60px -10px rgba(0, 0, 0, 0.05), inset 0 0 0 1px rgba(0, 0, 0, 0.03)`,
  };
};

const FloatParticle = ({ delay = 0, color = "#fff" }) => (
  <motion.div initial={{ opacity: 0, scale: 0 }} animate={{ opacity: [0, 0.5, 0], scale: [0, 1, 0], y: [-20, -100] }} transition={{ duration: 3 + Math.random() * 2, delay, repeat: Infinity, ease: "easeInOut" }} className="absolute w-1 h-1 rounded-full pointer-events-none z-0" style={{ backgroundColor: color, filter: "blur(1px)" }} />
);

export function GlassTheme({ data, visibleLinks, handleLinkClick, getAnimationProps, isPreview }: ThemeProps) {
  const [selectedProperty, setSelectedProperty] = useState<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const tema = data.tema || { bg_color: "#050505", text_color: "#ffffff", button_bg: "#3b82f6", button_text: "#ffffff" };
  const isDark = tema.bg_color === "#050505" || tema.bg_color === "#000000" || tema.text_color === "#ffffff";

  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const springX = useSpring(mouseX, { stiffness: 100, damping: 20 });
  const springY = useSpring(mouseY, { stiffness: 100, damping: 20 });

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!containerRef.current) return;
      const { left, top } = containerRef.current.getBoundingClientRect();
      mouseX.set(e.clientX - left); mouseY.set(e.clientY - top);
    };
    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, [mouseX, mouseY]);

  const socialDomains = ["instagram.com", "linkedin.com", "twitter.com", "x.com", "github.com", "youtube.com", "facebook.com", "tiktok.com"];
  const socialLinks = visibleLinks?.filter(link => link.type !== "youtube" && link.type !== "spotify" && socialDomains.some(domain => link.url?.toLowerCase().includes(domain))) || [];
  const regularLinks = visibleLinks?.filter(link => link.type === "youtube" || link.type === "spotify" || !socialDomains.some(domain => link.url?.toLowerCase().includes(domain))) || [];

  const springTransition = { type: "spring", stiffness: 110, damping: 18, mass: 0.8 };
  const showWhatsApp = data.whatsapp?.enabled && (data.whatsapp?.number || isPreview);

  const handlePropertyClick = (imovel: any) => {
    handleLinkClick({ title: `Portfólio: ${imovel.titulo}`, url: `property-${imovel.id}`, type: 'property' }, 0);
    setSelectedProperty(imovel);
  };

  const handleWhatsAppClick = () => {
    handleLinkClick({ title: 'Botão WhatsApp', url: `https://wa.me/${data.whatsapp?.number}`, type: 'whatsapp' }, 0);
  };

  return (
    <div ref={containerRef} className={cn("w-full font-sans overflow-x-hidden relative transition-colors duration-700 group/body", isPreview ? "min-h-full bg-transparent" : "min-h-screen", isDark ? "selection:bg-white/30" : "selection:bg-black/10")} style={{ backgroundColor: tema.bg_color, color: tema.text_color }}>
      {/* Container do background animado - Ajustado para não quebrar no scroll do preview */}
      <div className={cn("overflow-hidden pointer-events-none -z-20", isPreview ? "absolute inset-0 h-[200%]" : "fixed inset-0")}>
        <motion.div animate={{ x: [0, 50, 0], y: [0, 30, 0], scale: [1, 1.15, 1] }} transition={{ duration: 15, repeat: Infinity, ease: "linear" }} className="absolute top-[-10%] left-[-15%] w-[120%] aspect-square rounded-full mix-blend-screen filter blur-[100px] opacity-20" style={{ backgroundColor: tema.button_bg }} />
        <motion.div animate={{ x: [0, -40, 0], y: [0, -50, 0] }} transition={{ duration: 18, repeat: Infinity, ease: "linear" }} className="absolute bottom-[-10%] right-[-15%] w-[100%] aspect-square rounded-full mix-blend-overlay filter blur-[120px] opacity-25" style={{ backgroundColor: tema.text_color }} />
        <div className="absolute inset-0 bg-[url('/noise.svg')] opacity-[0.03] mix-blend-overlay pointer-events-none" />
      </div>
      
      <div className={cn("mx-auto flex flex-col relative z-10 transition-all", isPreview ? "max-w-full px-4 pt-6 pb-24 gap-2" : "max-w-[1100px] lg:flex-row lg:py-16 pt-8 px-4 lg:px-0 gap-10 pb-24")}>
        
        <div className={cn("w-full shrink-0 relative", !isPreview && "lg:w-[420px]")}>
          <div className={cn(!isPreview && "lg:sticky lg:top-16")}>
            <FloatParticle delay={0.5} color={tema.button_bg} /> <FloatParticle delay={2.2} color={tema.text_color} /> <FloatParticle delay={4.8} color={tema.button_bg} />
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={springTransition} className={cn("relative w-full rounded-[2.5rem] overflow-hidden group/card shadow-[0_0_100px_-20px_rgba(0,0,0,0.5)]", isPreview ? "p-6" : "p-10")} style={glassPanelStyle(tema)}>
              <motion.div className="absolute inset-0 z-0 pointer-events-none opacity-0 group-hover/card:opacity-100 transition-opacity duration-500" style={{ background: useMotionTemplate`radial-gradient(350px circle at ${springX}px ${springY}px, ${isDark ? "rgba(255, 255, 255, 0.07)" : "rgba(0, 0, 0, 0.03)"}, transparent 80%)` }} />
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1/2 h-[2px] blur-[1px]" style={{ background: `linear-gradient(to r, transparent, ${isDark ? "rgba(255,255,255,0.3)" : "rgba(0,0,0,0.1)"}, transparent)` }} />
              <div className="relative z-10 flex flex-col items-center text-center">
                <motion.div whileHover={{ scale: 1.05, y: -5 }} transition={springTransition} className="relative group/photo cursor-pointer mb-6"><div className="absolute inset-0 rounded-full blur-2xl opacity-40 group-hover/photo:opacity-70 transition-opacity animate-pulse" style={{ backgroundColor: tema.button_bg }} /><div className="p-1 rounded-full relative bg-white/5 backdrop-blur-md border border-white/10 shadow-inner"><img src={data.foto_url || "/placeholder-user.jpg"} alt={data.nome} className={cn("mx-auto rounded-full object-cover border-4 border-white shadow-xl", isPreview ? "w-20 h-20" : "w-28 h-28")} style={{ objectPosition: tema.foto_posicao || "center" }} /></div></motion.div>
                <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4, ...springTransition }}><h2 className="text-[11px] font-black uppercase tracking-[5px] inline-flex items-center gap-2 px-3 py-1 rounded-full border" style={{ color: `${tema.text_color}80`, backgroundColor: `${tema.text_color}05`, borderColor: `${tema.text_color}10` }}>{data.headline || "Bem-vindo!"}</h2><h1 className={cn("mt-4 mb-4 font-black leading-[1.1] tracking-tighter drop-shadow-sm", isPreview ? "text-2xl" : "text-4xl")} style={{ color: tema.text_color }}>{data.nome}</h1><p className={cn("leading-relaxed opacity-70 font-light", isPreview ? "text-[14px] px-2" : "text-[16px] px-4")} style={{ color: tema.text_color }}>{data.bio}</p></motion.div>
                {showWhatsApp && (
                  <motion.a 
                    href={data.whatsapp?.number ? `https://wa.me/${data.whatsapp.number.replace(/\D/g, "")}?text=${encodeURIComponent(data.whatsapp.message || "Olá, vim pelo seu Link na Bio")}` : "#"}
                    target={data.whatsapp?.number ? "_blank" : undefined}
                    onClick={handleWhatsAppClick}
                    whileHover={{ scale: 1.02, y: -3 }}
                    whileTap={{ scale: 0.98 }}
                    className={cn("mt-8 w-full py-4 rounded-2xl flex items-center justify-center gap-0 font-black text-[11px] uppercase tracking-[3px] transition-all relative overflow-hidden group/btn shadow-[0_15px_40px_-10px_rgba(0,0,0,0.3)]", !data.whatsapp?.number && "opacity-50 grayscale cursor-help")}
                    style={{ backgroundColor: tema.button_bg, color: tema.button_text }}
                  >
                    <div className="absolute inset-0 bg-white/30 translate-x-[-150%] group-hover/btn:translate-x-[150%] transition-transform duration-1000 skew-x-[-25deg]" /><MessageCircle className="w-5 h-5 mr-3 fill-white/10" /><span className="relative z-10">WhatsApp {!data.whatsapp?.number && "(Sem Número)"}</span>
                  </motion.a>
                )}
              </div>
            </motion.div>
            {socialLinks.length > 0 && !isPreview && ( <div className="hidden lg:flex flex-wrap items-center justify-center gap-4 mt-8 px-4">{socialLinks.map((link: any, index: number) => (<motion.a key={`d-${index}`} href={link.url} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 + index * 0.1 }} whileHover={{ y: -6, scale: 1.1, backgroundColor: isDark ? "rgba(255,255,255,0.12)" : "rgba(0,0,0,0.05)" }} className="p-3.5 rounded-full transition-all border shadow-md backdrop-blur-2xl" style={{ color: tema.text_color, borderColor: `${tema.text_color}10`, backgroundColor: `${tema.text_color}05` }}><motion.div whileHover={{ rotate: [0, 10, -10, 0] }}>{getSocialIcon(link.url)}</motion.div></motion.a>))}</div> )}
          </div>
        </div>

        {/* Removido o overflow-hidden desta div para não cortar o conteúdo no preview */}
        <div className="flex-1 w-full flex flex-col">
          {socialLinks.length > 0 && ( <div className={cn("flex flex-wrap items-center justify-center gap-4 mt-6", (isPreview) ? "mb-6" : "lg:hidden mb-8")}>{socialLinks.map((link: any, index: number) => (<a key={`m-${index}`} href={link.url} className="p-3.5 rounded-xl border backdrop-blur-md active:scale-95 transition-transform" style={{ color: tema.text_color, backgroundColor: `${tema.text_color}05`, borderColor: `${tema.text_color}10` }}>{getSocialIcon(link.url)}</a>))}</div> )}
          
          {data.featured_properties?.enabled && data.featured_properties.items?.length > 0 && (
            <div className={cn(isPreview ? "mt-2" : "mt-8 lg:mt-0")}>
              <div className="flex items-center justify-between mb-4 px-1"><h4 className="text-[20px] font-bold tracking-tight" style={{ color: tema.text_color }}>Oportunidades</h4><motion.div whileHover={{ rotate: 180 }} className="w-10 h-10 rounded-full border opacity-80 hover:opacity-100 cursor-pointer flex items-center justify-center transition-opacity" style={{ backgroundColor: `${tema.text_color}05`, borderColor: `${tema.text_color}10` }}><Sparkles className="w-4 h-4 text-amber-300" /></motion.div></div>
              <div className="w-full relative">
                <div className={cn("flex pt-2 pb-6 snap-x snap-mandatory gap-4 overflow-x-auto", !isPreview && "lg:grid lg:grid-cols-2 lg:overflow-x-visible lg:pb-0 lg:pt-0")}>
                  {data.featured_properties.items.map((imovel: any, idx: number) => (
                    <motion.div key={imovel.id} initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.15 + 0.3, ...springTransition }} whileHover={{ y: -6, scale: 1.01 }} onClick={() => handlePropertyClick(imovel)} className={cn("flex-none snap-start relative rounded-[1.5rem] overflow-hidden cursor-pointer group shadow-[0_20px_40px_-15px_rgba(0,0,0,0.3)] border", isPreview ? "w-[240px] h-[300px]" : "w-[260px] sm:w-[280px] lg:w-full h-[320px]")} style={{ borderColor: `${tema.text_color}10` }}>
                      <img src={imovel.imagem} className="absolute inset-0 w-full h-full object-cover" /><div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/30 to-transparent opacity-90" />
                      <div className="absolute bottom-0 left-0 right-0 p-5"><h4 className="text-white font-bold text-[17px] leading-tight mb-2 truncate">{imovel.titulo}</h4><div className="flex items-center gap-3"><div className="w-6 h-[1px] bg-white/40 shrink-0" /><p className="text-white/80 text-[12px] font-semibold tracking-widest uppercase truncate">{imovel.preco || imovel.localizacao}</p></div></div>
                    </motion.div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {regularLinks.length > 0 && (
            <div className={cn("flex flex-col gap-3.5", isPreview ? "mt-6" : "mt-8")}>
              {regularLinks.map((link: any, index: number) => {
                if (link.type === "youtube" || link.type === "spotify") {
                  return ( <motion.div key={index} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.5 + index * 0.1, ...springTransition }} className="w-full overflow-hidden rounded-[1.5rem] flex flex-col group/player border shadow-inner bg-black/10" style={glassPanelStyle(tema)}><div className="flex items-center justify-between px-4 py-3 border-b relative" style={{ borderColor: `${tema.text_color}10` }}><div className="flex items-center gap-3 z-10"><div className={cn("w-2 h-2 rounded-full animate-pulse", link.type === "youtube" ? "bg-red-500" : "bg-emerald-500")} /><span className="font-black uppercase tracking-[2px] text-[10px] opacity-70" style={{ color: tema.text_color }}>{link.type === "youtube" ? "Conteúdo Exclusivo" : "Podcast / Áudio"}</span></div><div className="opacity-50 z-10 w-4 h-4 flex items-center justify-center" style={{ color: tema.text_color }}>{getSocialIcon(link.url)}</div></div><div className="p-3"><div className="rounded-[1rem] overflow-hidden bg-black/70 relative">{link.type === "youtube" ? <iframe width="100%" className="aspect-video relative z-10" src={getYouTubeEmbed(link.url)} frameBorder="0" allowFullScreen /> : <iframe src={getSpotifyEmbed(link.url)} width="100%" height="152" frameBorder="0" allow="autoplay" loading="lazy" className="relative z-10" style={{ marginBottom: "-4px" }} />}</div></div></motion.div> );
                }
                return ( <motion.a key={index} href={link.type === "vcard" ? "#" : link.url} onClick={(e) => { if (link.type === "vcard") e.preventDefault(); handleLinkClick(link, index); }} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 + index * 0.1, ...springTransition }} whileHover={{ x: 8 }} className="w-full rounded-[2rem] flex items-center justify-between p-2.5 pr-5 transition-all group/link relative overflow-hidden" style={glassPanelStyle(tema)}><div className="flex items-center gap-4 relative z-10"><div className="w-12 h-12 rounded-[1rem] flex items-center justify-center shrink-0 shadow-2xl relative overflow-hidden" style={{ backgroundColor: tema.button_bg, color: tema.button_text }}><div className="absolute inset-0 bg-gradient-to-br from-white/40 via-transparent to-black/20" />{link.type === "vcard" ? <UserPlus className="w-5 h-5" /> : <LinkIcon className="w-4 h-4 opacity-90" />}</div><div className="flex flex-col"><span className="font-extrabold text-[13px] uppercase tracking-[2px]" style={{ color: tema.text_color }}>{link.title}</span><span className="text-[9px] opacity-40 font-bold uppercase tracking-widest mt-0.5 inline-flex items-center gap-1.5" style={{ color: tema.text_color }}>Explorar <ArrowUpRight className="w-3 h-3" /></span></div></div><div className="relative z-10"><ArrowUpRight className="w-5 h-5 opacity-15" style={{ color: tema.text_color }} /></div></motion.a> );
              })}
            </div>
          )}
        </div>
      </div>

      <AnimatePresence>{selectedProperty && ( <BioPropertyDetails property={selectedProperty} onClose={() => setSelectedProperty(null)} tema={tema} whatsappNumber={data.whatsapp?.number} /> )}</AnimatePresence>
      
      {showWhatsApp && (
        <motion.a 
          href={data.whatsapp?.number ? `https://wa.me/${data.whatsapp.number.replace(/\D/g, "")}?text=${encodeURIComponent(data.whatsapp.message || "Olá, vim pelo seu Link na Bio")}` : "#"}
          target={data.whatsapp?.number ? "_blank" : undefined}
          onClick={handleWhatsAppClick}
          initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 1, ...springTransition }} className={cn("fixed bottom-6 right-6 w-14 h-14 rounded-full flex items-center justify-center z-[100] border border-white/20 backdrop-blur-3xl shadow-2xl", !data.whatsapp?.number && "opacity-50 grayscale cursor-help")} style={{ background: `linear-gradient(135deg, ${tema.button_bg}, #111)` }}
        >
          <MessageCircle className="w-7 h-7 text-white" />
        </motion.a>
      )}

      {!isPreview && ( <div className="w-full py-12 flex flex-col items-center opacity-20 hover:opacity-50 transition-opacity gap-3 pointer-events-none"><div className="w-12 h-[1px]" style={{ background: `linear-gradient(to r, transparent, ${tema.text_color}, transparent)` }} /><p className="text-[9px] font-black uppercase tracking-[4px]" style={{ color: tema.text_color }}>CENTRAL63</p></div> )}
    </div>
  );
}