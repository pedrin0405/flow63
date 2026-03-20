"use client";

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  UserPlus, 
  MessageCircle, 
  ArrowUpRight,
  Maximize2,
  Youtube
} from "lucide-react";
import { cn } from "@/lib/utils";
import { BioPropertyDetails } from "../bio-property-details";
import { 
  getSocialIcon, 
  getYouTubeEmbed, 
  getSpotifyEmbed, 
  processLinks, 
  BioThemeProps 
} from "@/lib/bio-utils";

export function MinimalistTheme({ data, visibleLinks, handleLinkClick, getAnimationProps, isPreview }: BioThemeProps) {
  const [selectedProperty, setSelectedProperty] = useState<any>(null);
  const [propertyFolders, setPropertyFolders] = useState<any[]>([]);
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);

  // Fetch property folders when data changes
  useMemo(() => {
    if (data.id && typeof window !== 'undefined') {
      const { supabase } = require("@/lib/supabase");
      const fetchFolders = async () => {
        try {
          const { data: folders } = await supabase
            .from('bio_property_folders')
            .select('*')
            .eq('bio_page_id', data.id)
            .order('order_index', { ascending: true });
          
          if (folders && folders.length > 0) {
            setPropertyFolders(folders);
            setSelectedFolderId(folders[0].id);
          }
        } catch (error) {
          console.error('Error fetching property folders:', error);
        }
      };
      
      fetchFolders();
    }
  }, [data.id]);

  const { socialLinks, regularLinks } = useMemo(() => processLinks(visibleLinks), [visibleLinks]);

  const tema = data.tema || { bg_color: "#ffffff", text_color: "#111111", button_bg: "#000000", button_text: "#ffffff" };
  const showWhatsApp = data.whatsapp?.enabled && (data.whatsapp?.number || isPreview);

  const themeStyles = {
    "--theme-bg": tema.bg_color,
    "--theme-text": tema.text_color,
    "--theme-primary": tema.button_bg,
    "--theme-primary-text": tema.button_text,
    "--theme-text-fade-15": `${tema.text_color}15`,
    "--theme-text-fade-10": `${tema.text_color}10`,
    "--theme-text-fade-05": `${tema.text_color}05`,
    "--theme-text-fade-20": `${tema.text_color}20`,
  } as React.CSSProperties;

  const minimalCardStyle = { 
    backgroundColor: "var(--theme-text-fade-05)", 
    border: `1px solid var(--theme-text-fade-15)`, 
  };

  const handlePropertyClick = (imovel: any) => {
    handleLinkClick({ title: `Portfólio: ${imovel.titulo}`, url: `property-${imovel.id}`, type: 'property' }, 0);
    setSelectedProperty(imovel);
  };

  const handleWhatsAppClick = () => {
    handleLinkClick({ title: 'Botão WhatsApp', url: `https://wa.me/${data.whatsapp?.number}`, type: 'whatsapp' }, 0);
  };

  // Group properties by folder
  const groupedProperties = useMemo(() => {
    if (!data.featured_properties?.items) return {};
    
    const grouped: Record<string, any[]> = {};
    data.featured_properties.items.forEach((item: any) => {
      const folderId = item.folder_id || 'unfolded';
      if (!grouped[folderId]) {
        grouped[folderId] = [];
      }
      grouped[folderId].push(item);
    });
    
    return grouped;
  }, [data.featured_properties?.items]);

  const filteredProperties = useMemo(() => {
    if (selectedFolderId && groupedProperties[selectedFolderId]) {
      return groupedProperties[selectedFolderId];
    }
    return data.featured_properties?.items || [];
  }, [selectedFolderId, groupedProperties, data.featured_properties?.items]);

  return (
    <div 
      className={cn("w-full font-sans overflow-x-hidden relative transition-colors duration-500", isPreview ? "min-h-full bg-transparent" : "min-h-screen")} 
      style={{ ...themeStyles, color: "var(--theme-text)", backgroundColor: isPreview ? "transparent" : "var(--theme-bg)" }}
    >
      
      <div 
        className={cn("pointer-events-none -z-20", isPreview ? "absolute inset-0 h-[200%]" : "fixed inset-0")} 
        style={{ backgroundColor: "var(--theme-bg)" }} 
      />
      
      <div className={cn("mx-auto flex flex-col relative z-10 transition-all", isPreview ? "max-w-full px-4 pt-6 pb-24 gap-4" : "max-w-[1100px] lg:flex-row lg:py-16 pt-8 px-4 lg:px-0 gap-10 pb-24")}>
        
        <div className={cn("w-full shrink-0 relative", !isPreview && "lg:w-[420px]")}>
          <div className={cn(!isPreview && "lg:sticky lg:top-16")}>
            <motion.div 
              initial={{ y: -20, opacity: 0 }} 
              animate={{ y: 0, opacity: 1 }} 
              className={cn("relative w-full rounded-[3rem] overflow-hidden transition-all", isPreview ? "p-6" : "p-10")} 
              style={minimalCardStyle}
            >
              <div className="relative z-10 flex flex-col items-center text-center">
                <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ delay: 0.1 }}>
                  <img 
                    src={data.foto_url || "/placeholder-user.jpg"} 
                    alt={data.nome} 
                    className={cn("mx-auto rounded-full object-cover p-1", isPreview ? "w-20 h-20" : "w-32 h-32")} 
                    style={{ border: `1px solid var(--theme-text-fade-20)`, objectPosition: data.foto_posicao || "center" }} 
                  />
                </motion.div>
                <h2 className="mt-8 text-[11px] font-bold uppercase tracking-[4px] opacity-60" style={{ color: "var(--theme-text)" }}>{data.headline || "Corretor Imobiliário"}</h2>
                <h1 className={cn("mt-3 mb-4 font-bold leading-[1.1] tracking-tight", isPreview ? "text-[24px]" : "text-4xl")} style={{ color: "var(--theme-text)" }}>{data.nome}</h1>
                <p className={cn("leading-relaxed opacity-70 font-normal", isPreview ? "text-[13px] px-2" : "text-[16px] px-4")} style={{ color: "var(--theme-text)" }}>{data.bio}</p>
                {showWhatsApp && (
                  <motion.a 
                    href={data.whatsapp?.number ? `https://wa.me/${data.whatsapp.number.replace(/\D/g, "")}?text=${encodeURIComponent(data.whatsapp.message || "Olá, vim pelo seu Link na Bio")}` : "#"}
                    target={data.whatsapp?.number ? "_blank" : undefined}
                    onClick={handleWhatsAppClick}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className={cn("mt-8 w-full py-4 rounded-full flex items-center justify-center gap-0 font-bold text-[12px] uppercase tracking-[2px] transition-all shadow-sm", !data.whatsapp?.number && "opacity-50 grayscale cursor-help")}
                    style={{ backgroundColor: "var(--theme-primary)", color: "var(--theme-primary-text)" }}
                  >
                    <MessageCircle className="w-5 h-5 mr-3" />
                    <span>WhatsApp {!data.whatsapp?.number && "(Sem Número)"}</span>
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
                    className="transition-transform hover:-translate-y-1 p-4 rounded-full" 
                    style={{ ...minimalCardStyle, color: "var(--theme-text)" }}
                  >
                    {getSocialIcon(link.url)}
                  </a>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="flex-1 w-full flex flex-col">
          {socialLinks.length > 0 && ( 
            <div className={cn("flex flex-wrap items-center justify-center gap-4 mt-6", (isPreview) ? "mb-6" : "lg:hidden mb-8")}>
              {socialLinks.map((link: any, index: number) => (
                <a 
                  key={`mobile-social-${index}`} 
                  href={link.url} 
                  onClick={(e) => handleLinkClick(link, index)} 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="p-3.5 rounded-full transition-transform hover:scale-105" 
                  style={{ ...minimalCardStyle, color: "var(--theme-text)" }}
                >
                  {getSocialIcon(link.url)}
                </a>
              ))}
            </div> 
          )}
          
          {data.featured_properties?.enabled && data.featured_properties.items?.length > 0 && (
            <div className={cn(isPreview ? "mt-2" : "mt-8 lg:mt-0")}>
              <div className="flex items-center justify-between mb-5 px-2">
                <h3 className="text-[11px] font-bold uppercase tracking-[3px] opacity-60" style={{ color: "var(--theme-text)" }}>Portfólio</h3>
              </div>

              {propertyFolders.length > 0 && (
                <div className="mb-6 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 px-2">
                  {propertyFolders.map((folder) => {
                    const folderItemCount = data.featured_properties.items?.filter((item: any) => item.folder_id === folder.id).length || 0;
                    const isSelected = selectedFolderId === folder.id;
                    return (
                      <motion.button
                        key={folder.id}
                        whileHover={{ y: -4, scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => setSelectedFolderId(folder.id)}
                        className={cn(
                          "relative p-4 rounded-[1.5rem] transition-all group",
                          "flex flex-col items-center text-center gap-2",
                          "border-2",
                          isSelected
                            ? "shadow-md ring-2"
                            : "shadow hover:shadow-md"
                        )}
                        style={{
                          backgroundColor: isSelected ? `${folder.color}20` : `${folder.color}08`,
                          borderColor: isSelected ? folder.color : `${folder.color}30`
                        }}
                      >
                        {/* Folder Icon - Large */}
                        <div className={cn(
                          "w-14 h-12 rounded-lg flex items-center justify-center transition-all",
                          "relative overflow-hidden"
                        )} style={{ backgroundColor: `${folder.color}15` }}>
                          <span className="text-3xl">{isSelected ? "📂" : folder.icon}</span>
                        </div>

                        {/* Folder Name */}
                        <div className="min-w-0 w-full">
                          <p className="text-[10px] font-black uppercase tracking-wider truncate" style={{ color: isSelected ? folder.color : "inherit" }}>
                            {folder.name}
                          </p>
                        </div>

                        {/* Item Count Badge */}
                        <div className="text-[8px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full text-white" style={{ backgroundColor: folder.color }}>
                          {folderItemCount} {folderItemCount === 1 ? "item" : "itens"}
                        </div>

                        {/* Selection Indicator */}
                        {isSelected && (
                          <motion.div
                            layoutId={`folder-indicator-${folder.id}`}
                            className="absolute top-2 right-2 w-4 h-4 rounded-full flex items-center justify-center text-white text-[10px] font-black"
                            style={{ backgroundColor: folder.color }}
                          >
                            ✓
                          </motion.div>
                        )}
                      </motion.button>
                    );
                  })}
                </div>
              )}

              <div className="w-full relative">
                <div className={cn("flex pt-2 pb-6 snap-x snap-mandatory gap-4 overflow-x-auto", !isPreview && "lg:grid lg:grid-cols-2 lg:overflow-x-visible lg:pb-0 lg:pt-0", "[&::-webkit-scrollbar]:h-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-gray-400/40 [&::-webkit-scrollbar-thumb]:rounded-full", "[scrollbar-width:thin] [scrollbar-color:rgba(156,163,175,0.4)_transparent]")}>
                  {filteredProperties.map((imovel: any) => (
                    <motion.div 
                      key={imovel.id} 
                      whileHover={{ y: -4 }} 
                      onClick={() => handlePropertyClick(imovel)} 
                      className={cn("flex-none snap-start relative rounded-[2rem] overflow-hidden group cursor-pointer", isPreview ? "w-[240px] h-[300px]" : "w-[260px] sm:w-[280px] lg:w-full h-[320px]")} 
                      style={minimalCardStyle}
                    >
                      <div className="absolute inset-2 rounded-[1.5rem] overflow-hidden bg-black/5">
                        <img src={imovel.imagem} alt={imovel.titulo} className="absolute inset-0 w-full h-full object-cover transition-transform duration-[2s] group-hover:scale-110" />
                        <div className="absolute inset-0 bg-black/10 group-hover:bg-black/20 transition-colors duration-300" />
                      </div>
                      <div className="absolute top-5 right-5 p-2 rounded-full bg-white opacity-0 group-hover:opacity-100 transition-all shadow-sm"><Maximize2 className="w-4 h-4 text-black" /></div>
                      <div className="absolute bottom-4 left-4 right-4 p-4 rounded-2xl shadow-lg" style={{ backgroundColor: "var(--theme-bg)" }}>
                        <h4 className="font-bold text-[14px] leading-tight mb-1 line-clamp-2" style={{ color: "var(--theme-text)" }}>{imovel.titulo}</h4>
                        <p className="opacity-60 text-[10px] font-bold uppercase tracking-[1px] truncate" style={{ color: "var(--theme-text)" }}>{imovel.preco || imovel.localizacao}</p>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {regularLinks.length > 0 && (
            <div className={cn("flex flex-col gap-4", isPreview ? "mt-6" : "mt-8")}>
              {regularLinks.map((link: any, index: number) => {
                if (link.type === "youtube" || link.type === "spotify") {
                  return ( 
                    <motion.div 
                      key={index} 
                      className="w-full overflow-hidden rounded-[2rem] flex flex-col group" 
                      style={minimalCardStyle}
                    >
                      <div className="flex items-center gap-4 px-5 py-4 border-b" style={{ borderColor: "var(--theme-text-fade-10)" }}>
                        <div 
                          className={cn("rounded-full flex items-center justify-center shrink-0", isPreview ? "w-9 h-9" : "w-11 h-11")} 
                          style={{ backgroundColor: "var(--theme-primary)", color: "var(--theme-primary-text)" }}
                        >
                          {link.type === "youtube" ? <Youtube className={cn(isPreview ? "w-4 h-4" : "w-5 h-5")} /> : getSocialIcon(link.url)}
                        </div>
                        <span 
                          className={cn("font-bold uppercase tracking-[2px] truncate", isPreview ? "text-[10px]" : "text-[11px]")} 
                          style={{ color: "var(--theme-text)" }}
                        >
                          {link.title || (link.type === "youtube" ? "Vídeo em Destaque" : "Música em Destaque")}
                        </span>
                      </div>
                      <div className="w-full p-2">
                        <div className="rounded-[1.2rem] overflow-hidden bg-black/5">
                          {link.type === "youtube" ? (
                            <iframe width="100%" className="aspect-video" src={getYouTubeEmbed(link.url)} title="YouTube video player" frameBorder="0" allowFullScreen /> 
                          ) : (
                            <iframe src={getSpotifyEmbed(link.url)} width="100%" height="152" frameBorder="0" allowFullScreen allow="autoplay" loading="lazy" style={{ marginBottom: "-4px" }} />
                          )}
                        </div>
                      </div>
                    </motion.div> 
                  );
                }
                return ( 
                  <motion.a 
                    key={index} 
                    href={link.type === "vcard" ? "#" : link.url} 
                    onClick={(e) => { if (link.type === "vcard") e.preventDefault(); handleLinkClick(link, index); }} 
                    whileHover={{ scale: 1.01 }} 
                    whileTap={{ scale: 0.99 }} 
                    className="w-full rounded-[2rem] flex items-center justify-between transition-colors group hover:bg-black/5 dark:hover:bg-white/5" 
                    style={{ ...minimalCardStyle, padding: isPreview ? "12px" : "16px" }}
                  >
                    <div className="flex items-center gap-5 overflow-hidden px-2">
                      <div 
                        className={cn("rounded-full flex items-center justify-center shrink-0", isPreview ? "w-10 h-10" : "w-12 h-12")} 
                        style={{ backgroundColor: "var(--theme-primary)", color: "var(--theme-primary-text)" }}
                      >
                        {link.type === "vcard" ? <UserPlus className="w-5 h-5" /> : getSocialIcon(link.url)}
                      </div>
                      <span 
                        className={cn("font-bold uppercase tracking-[2px] truncate", isPreview ? "text-[11px]" : "text-[12px]")} 
                        style={{ color: "var(--theme-text)" }}
                      >
                        {link.title}
                      </span>
                    </div>
                    <div className="pr-4 opacity-30 group-hover:opacity-100 transition-opacity">
                      <ArrowUpRight className="w-5 h-5" style={{ color: "var(--theme-text)" }} />
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
      
      {showWhatsApp && (
        <motion.a 
          href={data.whatsapp?.number ? `https://wa.me/${data.whatsapp.number.replace(/\D/g, "")}?text=${encodeURIComponent(data.whatsapp.message || "Olá, vim pelo seu Link na Bio")}` : "#"}
          target={data.whatsapp?.number ? "_blank" : undefined}
          onClick={handleWhatsAppClick}
          initial={{ scale: 0, opacity: 0 }} 
          animate={{ scale: 1, opacity: 1 }} 
          whileHover={{ scale: 1.1, rotate: 5 }} 
          whileTap={{ scale: 0.9 }} 
          className={cn("fixed rounded-full flex items-center justify-center z-[100] transition-all shadow-lg", isPreview ? "bottom-6 right-6 w-14 h-14" : "bottom-8 left-8 w-14 h-14", !data.whatsapp?.number && "opacity-50 grayscale cursor-help")} 
          style={{ backgroundColor: "#25D366", color: "#ffffff" }}
        >
          <MessageCircle className="w-6 h-6" />
        </motion.a>
      )}
    </div>
  );
}