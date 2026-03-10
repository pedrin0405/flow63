"use client";

import { motion } from "framer-motion";
import { UserPlus, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface ThemeProps {
  data: any;
  visibleLinks: any[];
  handleLinkClick: (link: any, index: number) => void;
  getAnimationProps: (type: string) => any;
  isPreview?: boolean;
}

export function GlassTheme({ data, visibleLinks, handleLinkClick, getAnimationProps, isPreview }: ThemeProps) {
  return (
    <div className={cn(
      "w-full mx-auto min-h-full pb-24 relative font-sans text-white transition-all",
      isPreview ? "max-w-full" : "max-w-md md:max-w-2xl px-6"
    )}>
      {/* BACKGROUND GRADIENT FLOW - MUDADO PARA ABSOLUTE */}
      <div className="absolute inset-0 -z-20 pointer-events-none bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 animate-gradient-flow" />

      {/* HEADER */}
      <header className="pt-12 mb-12 text-center px-4">
        <motion.div initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="inline-block relative mb-6">
          <div className="w-24 h-24 mx-auto relative z-10 overflow-hidden rounded-[2.5rem] border-4 border-white/30 backdrop-blur-xl shadow-2xl bg-white/10">
            <img src={data.foto_url || "/placeholder-user.jpg"} className="w-full h-full object-cover" />
          </div>
        </motion.div>
        <h1 className="text-2xl font-black mb-2 tracking-tighter drop-shadow-md">{data.nome}</h1>
        <p className="text-[11px] leading-relaxed max-w-[280px] mx-auto opacity-80 font-bold uppercase tracking-widest">{data.bio}</p>
      </header>

      {/* LINKS LIST */}
      <div className="px-4 space-y-4">
        {visibleLinks?.map((link: any, index: number) => {
          if (link.type === "youtube" || link.type === "spotify") {
            return (
              <motion.div key={index} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} className="overflow-hidden mb-4 rounded-[2rem] shadow-2xl border border-white/20 backdrop-blur-xl">
                {link.type === "youtube" ? (
                  <iframe width="100%" className="aspect-video" src={`https://www.youtube.com/embed/${link.url.split('v=')[1]?.split('&')[0]}`} frameBorder="0" allowFullScreen></iframe>
                ) : (
                  <iframe src={link.url.replace("open.spotify.com", "open.spotify.com/embed")} width="100%" height="152" frameBorder="0" allowTransparency={true}></iframe>
                )}
              </motion.div>
            );
          }

          return (
            <motion.a 
              key={index} 
              href={link.type === "vcard" ? "#" : link.url}
              onClick={(e) => { if (link.type === "vcard") e.preventDefault(); handleLinkClick(link, index); }}
              whileHover={{ scale: 1.02, y: -2 }}
              className="relative group flex items-center justify-center transition-all duration-300 h-16 rounded-2xl bg-white/10 backdrop-blur-xl border border-white/20 shadow-xl"
            >
              <div className="flex items-center gap-2">
                {link.type === "vcard" && <UserPlus className="w-4 h-4" />}
                <span className="font-black uppercase tracking-[2px] text-center text-xs">{link.title}</span>
              </div>
            </motion.a>
          );
        })}
      </div>

      {/* PORTFOLIO GRID */}
      {data.featured_properties?.enabled && data.featured_properties.items?.length > 0 && (
        <div className="mt-20 px-4 space-y-12">
          <div className="flex items-center gap-4">
            <span className="text-[9px] font-black uppercase tracking-[5px] opacity-30 whitespace-nowrap text-white">Featured Deck</span>
            <div className="h-[1px] w-full bg-white/10" />
          </div>
          <div className={cn(
            "grid gap-8",
            isPreview ? "grid-cols-1" : "grid-cols-1 md:grid-cols-2"
          )}>
            {data.featured_properties.items.map((imovel: any) => (
              <motion.div 
                key={imovel.id} 
                initial={{ opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                whileHover={{ y: -10, scale: 1.02 }}
                className="overflow-hidden group relative transition-all duration-700 rounded-[3rem] border border-white/20 bg-white/10 backdrop-blur-3xl shadow-2xl"
              >
                <div className="aspect-[16/10] relative overflow-hidden">
                  <img src={imovel.imagem} className="w-full h-full object-cover transition-transform duration-[3s] group-hover:scale-110" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-60" />
                  <div className="absolute top-6 left-6 flex gap-2">
                    <span className="bg-white/90 backdrop-blur-md text-black text-[9px] font-black px-4 py-1.5 rounded-full uppercase tracking-widest shadow-xl">Exclusive</span>
                  </div>
                </div>
                <div className="p-8 text-white">
                  <div className="flex justify-between items-start mb-4">
                    <div className="space-y-1 overflow-hidden">
                      <h4 className="font-black text-xl leading-tight tracking-tighter uppercase truncate">{imovel.titulo}</h4>
                      <p className="text-[10px] font-bold text-white/60 tracking-[3px] uppercase truncate">{imovel.localizacao}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-2xl font-black tracking-tighter">{imovel.preco}</p>
                    </div>
                  </div>
                  <Button className="w-full h-14 rounded-2xl font-black uppercase text-[10px] tracking-[4px] bg-white text-black hover:bg-white/90 shadow-2xl">Solicitar Informações</Button>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* WHATSAPP */}
      {data.whatsapp?.enabled && data.whatsapp.number && (
        <motion.a 
          href={`https://wa.me/${data.whatsapp.number.replace(/\D/g, "")}?text=${encodeURIComponent(data.whatsapp.message)}`}
          target="_blank"
          className={cn(
            "fixed rounded-full flex items-center justify-center shadow-2xl z-[100] transition-all bg-white/20 backdrop-blur-3xl border border-white/30 text-white shadow-white/10",
            isPreview ? "bottom-6 right-6 w-12 h-12" : "bottom-8 right-8 w-14 h-14"
          )}
          whileHover={{ scale: 1.1, rotate: 10 }}
        >
          <MessageCircle className="w-6 h-6" />
        </motion.a>
      )}
    </div>
  );
}
