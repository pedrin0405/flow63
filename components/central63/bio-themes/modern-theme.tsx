"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
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
  Facebook,
  Mail,
  Phone,
  Music
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
  if (lowerUrl.includes("wa.me") || lowerUrl.includes("whatsapp.com")) return <MessageCircle className="w-5 h-5" />;
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
    if (urlObj.hostname.includes('spotify.com')) {
      return `https://open.spotify.com/embed${urlObj.pathname}?utm_source=generator`;
    }
  } catch (e) {
    return url;
  }
  return url;
};

export function ModernTheme({ data, visibleLinks, handleLinkClick, getAnimationProps, isPreview }: ThemeProps) {
  const [selectedProperty, setSelectedProperty] = useState<any>(null);

  // Todo link adicionado manualmente agora aparece como um botão (regularLinks)
  // Deixamos apenas as redes sociais automáticas (se existirem no futuro no payload específico) para ícones
  const socialLinks = []; // Desativando a separação automática por domínio
  const regularLinks = visibleLinks || [];

  const tema = data.tema || { 
    bg_color: "#050505", 
    text_color: "#ffffff", 
    button_bg: "#3b82f6", 
    button_text: "#ffffff" 
  };

  return (
    <div 
      className={cn(
        "w-full font-sans overflow-x-hidden relative transition-colors duration-500",
        isPreview ? "min-h-full bg-transparent" : "min-h-screen"
      )}
      style={{ backgroundColor: tema.bg_color, color: tema.text_color }}
    >
      <div 
        className={cn(
          "-z-20 transition-colors duration-500",
          isPreview ? "absolute inset-0" : "fixed inset-0"
        )}
        style={{ backgroundColor: tema.bg_color }}
      />

      <div className={cn(
        "mx-auto flex flex-col pb-24",
        isPreview ? "max-w-full px-4 pt-4 gap-4" : "max-w-[1100px] lg:flex-row lg:py-16 pt-8 px-4 lg:px-0 gap-10"
      )}>

        {/* COLUNA ESQUERDA: HERO CARD */}
        <div className={cn(
          "w-full shrink-0",
          !isPreview && "lg:w-[420px]"
        )}>
          <div className={cn(!isPreview && "lg:sticky lg:top-16")}>

            <motion.div 
              initial={{ y: -20, opacity: 0 }} 
              animate={{ y: 0, opacity: 1 }}
              className={cn(
                "relative w-full rounded-[2.5rem] overflow-hidden shadow-2xl border border-white/5",
                isPreview ? "p-6" : "p-10"
              )}
              style={{ 
                background: `linear-gradient(135deg, ${tema.button_bg}15, ${tema.text_color}05)`,
                backdropFilter: "blur(20px)"
              }}
            >
              <div className="absolute -top-20 -left-20 w-64 h-64 rounded-full mix-blend-overlay filter blur-[80px] pointer-events-none opacity-40" style={{ backgroundColor: tema.button_bg }} />
              <div className="absolute -bottom-20 -right-20 w-64 h-64 rounded-full mix-blend-overlay filter blur-[80px] pointer-events-none opacity-20" style={{ backgroundColor: tema.text_color }} />

              <div className="relative z-10 flex flex-col items-center text-center">
                <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ delay: 0.1 }}>
                  <img 
                    src={data.foto_url || "/placeholder-user.jpg"} 
                    alt={data.nome}
                    className={cn(
                      "mx-auto rounded-full object-cover border-4 shadow-2xl",
                      isPreview ? "w-20 h-20" : "w-28 h-28"
                    )}
                    style={{ 
                      borderColor: tema.button_bg,
                      objectPosition: tema.foto_posicao || "center"
                    }}
                  />
                </motion.div>

                <h2 className="mt-6 text-[11px] font-black uppercase tracking-[4px] opacity-60" style={{ color: tema.text_color }}>
                  {data.headline || "Corretor Imobiliário"}
                </h2>

                <h1 className={cn(
                  "mt-3 mb-4 font-black leading-[1.1] tracking-tighter",
                  isPreview ? "text-[22px]" : "text-4xl"
                )} style={{ color: tema.text_color }}>
                  {data.nome} 
                </h1>

                <p className={cn(
                  "leading-relaxed opacity-70 font-medium",
                  isPreview ? "text-[13px] px-2" : "text-[16px] px-4"
                )} style={{ color: tema.text_color }}>
                  {data.bio}
                </p>

                {data.whatsapp?.enabled && data.whatsapp.number && (
                  <motion.a 
                    href={`https://wa.me/${data.whatsapp.number.replace(/\D/g, "")}?text=${encodeURIComponent(data.whatsapp.message)}`}
                    target="_blank"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="mt-8 w-full py-4 rounded-full flex items-center justify-center gap-0 font-black text-[11px] uppercase tracking-[3px] transition-all shadow-[0_0_40px_rgba(0,0,0,0.2)] hover:shadow-[0_0_40px_rgba(0,0,0,0.4)] border border-white/10"
                    style={{ backgroundColor: tema.button_bg, color: "#ffffff" }}
                  >
                    <MessageCircle className="w-5 h-5 mr-3" />
                    <span>WhatsApp</span>
                  </motion.a>
                )}
              </div>
            </motion.div>

            {socialLinks.length > 0 && !isPreview && (
              <div className="hidden lg:flex flex-wrap items-center justify-center gap-4 mt-8 px-4">
                {socialLinks.map((link: any, index: number) => (
                  <a 
                    key={`desktop-social-${index}`}
                    href={link.url}
                    onClick={(e) => handleLinkClick(link, index)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="transition-all hover:-translate-y-1 p-3.5 rounded-full border border-white/10 shadow-lg backdrop-blur-md"
                    style={{ backgroundColor: `${tema.button_bg}15`, color: tema.text_color }}
                  >
                    {getSocialIcon(link.url)}
                  </a>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* COLUNA DIREITA: CONTEÚDO */}
        <div className="flex-1 w-full flex flex-col">

          {socialLinks.length > 0 && (
            <div className={cn(
              "flex flex-wrap items-center justify-center gap-4 mt-6",
              !isPreview && "lg:hidden mb-8"
            )}>
              {socialLinks.map((link: any, index: number) => (
                <a 
                  key={`mobile-social-${index}`}
                  href={link.url}
                  onClick={(e) => handleLinkClick(link, index)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-3.5 rounded-full border border-white/10 shadow-lg backdrop-blur-md transition-transform hover:scale-110"
                  style={{ backgroundColor: `${tema.button_bg}15`, color: tema.text_color }}
                >
                  {getSocialIcon(link.url)}
                </a>
              ))}
            </div>
          )}

          {data.featured_properties?.enabled && data.featured_properties.items?.length > 0 && (
            <div className={cn(isPreview ? "mt-6" : "mt-8 lg:mt-0")}>
              <div className="flex items-center justify-between mb-5 px-1">
                <h3 className="text-[11px] font-black uppercase tracking-[4px] opacity-50" style={{ color: tema.text_color }}>Portfólio</h3>
                <span className="text-[9px] font-black uppercase tracking-widest opacity-40 cursor-pointer hover:opacity-80 transition-opacity">exclusivos</span>
              </div>

              {/* GRID RESPONSIVO: Scroll no mobile, Grid no Desktop */}
              <div className={cn(
                "flex pb-6 snap-x snap-mandatory scrollbar-hide",
                isPreview ? "gap-4 overflow-x-auto" : "gap-4 overflow-x-auto lg:grid lg:grid-cols-2 lg:overflow-x-visible lg:pb-0"
              )}>
                {data.featured_properties.items.map((imovel: any) => (
                  <motion.div 
                    key={imovel.id} 
                    whileHover={{ y: -6 }}
                    onClick={() => setSelectedProperty(imovel)}
                    className={cn(
                      "shrink-0 snap-center relative rounded-[2rem] overflow-hidden shadow-2xl group cursor-pointer border border-white/10",
                      isPreview ? "w-[180px] h-[240px]" : "min-w-[260px] w-full lg:w-auto h-[320px]"
                    )}
                  >
                    <img src={imovel.imagem} alt={imovel.titulo} className="absolute inset-0 w-full h-full object-cover transition-transform duration-[2s] group-hover:scale-110" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent" />

                    <div className="absolute top-4 right-4 p-2 rounded-full bg-white/10 backdrop-blur-md opacity-0 group-hover:opacity-100 transition-all">
                      <Maximize2 className="w-4 h-4 text-white" />
                    </div>

                    <div className="absolute bottom-5 left-5 right-5">
                      <h4 className="text-white font-bold text-[16px] leading-tight mb-1 line-clamp-2">{imovel.titulo}</h4>
                      <p className="text-white/60 text-[10px] font-bold uppercase tracking-[2px] truncate">{imovel.preco || imovel.localizacao}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          )}

          {/* LINKS REGULARES E EMBEDS */}
          {regularLinks.length > 0 && (
            <div className={cn("flex flex-col gap-3.5", isPreview ? "mt-4" : "mt-8")}>
              {regularLinks.map((link: any, index: number) => {

                // RENDER DO PLAYER (YouTube / Spotify)
                if (link.type === "youtube" || link.type === "spotify") {
                  return (
                    <motion.div 
                      key={index} 
                      className="w-full overflow-hidden rounded-[1.5rem] border border-white/5 shadow-xl bg-black/20 backdrop-blur-md flex flex-col group"
                    >
                      <div 
                        className="flex items-center gap-4 px-4 py-3 border-b border-white/5"
                        style={{ backgroundColor: `${tema.button_bg}10` }}
                      >
                        <div 
                          className={cn(
                            "rounded-full flex items-center justify-center shrink-0 shadow-[0_0_15px_rgba(0,0,0,0.2)]",
                            isPreview ? "w-9 h-9" : "w-11 h-11"
                          )}
                          style={{ backgroundColor: tema.button_bg, color: "#ffffff" }}
                        >
                          {link.type === "youtube" ? (
                            <Youtube className={cn(isPreview ? "w-4 h-4" : "w-5 h-5")} />
                          ) : (
                            <svg viewBox="0 0 24 24" fill="currentColor" className={cn(isPreview ? "w-4 h-4" : "w-5 h-5")}>
                              <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.84.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15.001 10.62 18.72 12.9c.36.181.54.78.241 1.14zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.6.18-1.2.72-1.38 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z"/>
                            </svg>
                          )}
                        </div>
                        <span 
                          className={cn("font-bold uppercase tracking-[2px] truncate", isPreview ? "text-[10px]" : "text-[12px]")} 
                          style={{ color: tema.text_color }}
                        >
                          {link.title || (link.type === "youtube" ? "Vídeo em Destaque" : "Música em Destaque")}
                        </span>
                      </div>

                      <div className="w-full bg-black/40">
                        {link.type === "youtube" ? (
                          <iframe 
                            width="100%" 
                            className="aspect-video" 
                            src={getYouTubeEmbed(link.url)} 
                            title="YouTube video player"
                            frameBorder="0" 
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" 
                            allowFullScreen 
                          />
                        ) : (
                          <iframe 
                            src={getSpotifyEmbed(link.url)} 
                            width="100%" 
                            height="152" 
                            frameBorder="0" 
                            allowFullScreen 
                            allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture" 
                            loading="lazy"
                            style={{ marginBottom: "-4px" }} 
                          />
                        )}
                      </div>
                    </motion.div>
                  );
                }

                return (
                  <motion.a 
                    key={index} 
                    href={link.type === "vcard" ? "#" : link.url}
                    onClick={(e) => { if (link.type === "vcard") e.preventDefault(); handleLinkClick(link, index); }}
                    whileHover={{ scale: 1.01, x: 4 }}
                    whileTap={{ scale: 0.99 }}
                    className="w-full border border-white/5 shadow-xl rounded-[1.5rem] flex items-center justify-between transition-all backdrop-blur-md group"
                    style={{ 
                      backgroundColor: `${tema.button_bg}10`, 
                      padding: isPreview ? "12px" : "14px" 
                    }}
                  >
                    <div className="flex items-center gap-4 overflow-hidden px-2">
                      <div 
                        className={cn(
                          "rounded-full flex items-center justify-center shrink-0 shadow-[0_0_20px_rgba(0,0,0,0.2)]",
                          isPreview ? "w-10 h-10" : "w-12 h-12"
                        )}
                        style={{ backgroundColor: tema.button_bg, color: "#ffffff" }}
                      >
                        {link.type === "vcard" ? <UserPlus className="w-5 h-5" /> : getSocialIcon(link.url)}
                      </div>
                      <span 
                        className={cn("font-bold uppercase tracking-[2px] truncate", isPreview ? "text-[11px]" : "text-[13px]")} 
                        style={{ color: tema.text_color }}
                      >
                        {link.title}
                      </span>
                    </div>

                    <div className="pr-5 opacity-20 group-hover:opacity-100 transition-opacity">
                      <ArrowUpRight className="w-5 h-5" style={{ color: tema.text_color }} />
                    </div>
                  </motion.a>
                );
              })}
            </div>
          )}
        </div>

      </div>

      <AnimatePresence>
        {selectedProperty && (
          <BioPropertyDetails 
            property={selectedProperty} 
            onClose={() => setSelectedProperty(null)} 
            tema={tema}
            whatsappNumber={data.whatsapp?.number}
          />
        )}
      </AnimatePresence>

      {/* WHATSAPP FLUTUANTE */}
      {data.whatsapp?.enabled && data.whatsapp.number && !isPreview && (
        <motion.a 
          href={`https://wa.me/${data.whatsapp.number.replace(/\D/g, "")}?text=${encodeURIComponent(data.whatsapp.message)}`}
          target="_blank"
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          whileHover={{ scale: 1.1, rotate: 5 }}
          whileTap={{ scale: 0.9 }}
          className={cn(
            "fixed rounded-full flex items-center justify-center shadow-2xl z-[100] transition-all bottom-8 right-8 w-16 h-16"
          )}
          style={{ backgroundColor: "#25D366", color: "#ffffff" }}
        >
          <MessageCircle className="w-8 h-8" />
          <span className="absolute -top-1 -right-1 flex h-4 w-4">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-4 w-4 bg-green-500"></span>
          </span>
        </motion.a>
      )}
    </div>
  );
}