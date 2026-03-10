"use client";

import { motion } from "framer-motion";
import { ArrowUpRight, MessageCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface ThemeProps {
  data: any;
  visibleLinks: any[];
  handleLinkClick: (link: any, index: number) => void;
  getAnimationProps: (type: string) => any;
  isPreview?: boolean;
}

export function MinimalistTheme({ data, visibleLinks, handleLinkClick, getAnimationProps, isPreview }: ThemeProps) {
  return (
    <div className={cn(
      "w-full mx-auto min-h-full pb-24 relative font-serif text-black selection:bg-black selection:text-white bg-[#FAF9F6]",
      isPreview ? "max-w-full" : "max-w-md md:max-w-2xl px-6"
    )}>
      {/* HEADER */}
      <header className="pt-12 mb-12 text-center px-4">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 1 }} className="inline-block relative mb-6">
          <div className="w-24 h-24 mx-auto relative z-10 overflow-hidden border border-black/10 grayscale p-1 bg-white rounded-none">
            <img src={data.foto_url || "/placeholder-user.jpg"} className="w-full h-full object-cover" />
          </div>
        </motion.div>
        <h1 className="text-3xl font-normal italic mb-2 tracking-tight">{data.nome}</h1>
        <p className="max-w-[280px] mx-auto opacity-60 italic text-sm leading-relaxed">{data.bio}</p>
      </header>

      {/* LINKS LIST */}
      <div className="px-4 border-t border-black/5 pt-4">
        {visibleLinks?.map((link: any, index: number) => {
          return (
            <motion.a 
              key={index} 
              href={link.type === "vcard" ? "#" : link.url}
              onClick={(e) => { if (link.type === "vcard") e.preventDefault(); handleLinkClick(link, index); }}
              whileHover={{ x: 5 }}
              className="group flex items-center justify-between py-6 border-b border-black/10 transition-all"
            >
              <div className="flex items-center gap-4">
                <span className="text-[10px] font-bold opacity-20">0{index + 1}</span>
                <span className="text-base font-medium tracking-tight group-hover:underline decoration-1 underline-offset-8">{link.title}</span>
              </div>
              <ArrowUpRight className="w-4 h-4 opacity-20 group-hover:opacity-100 transition-opacity" />
            </motion.a>
          );
        })}
      </div>

      {/* PORTFOLIO LIST */}
      {data.featured_properties?.enabled && data.featured_properties.items?.length > 0 && (
        <div className="mt-20 px-4 space-y-12">
          <div className="flex items-center gap-4">
            <span className="font-serif italic capitalize text-lg">Selected Portfolio</span>
            <div className="h-[1px] w-full bg-black/5" />
          </div>
          <div className="space-y-16">
            {data.featured_properties.items.map((imovel: any, idx: number) => (
              <motion.div 
                key={imovel.id}
                className={cn("relative group", !isPreview && idx % 2 !== 0 ? "md:pl-24" : "")}
              >
                <div className="overflow-hidden transition-all duration-[1.5s] relative rounded-none border border-black/5 bg-white">
                  <div className={cn("aspect-[4/5] overflow-hidden", isPreview ? "" : "grayscale hover:grayscale-0 transition-all duration-1000")}>
                    <img src={imovel.imagem} className="w-full h-full object-cover transition-transform duration-[3s] group-hover:scale-110" />
                  </div>
                </div>
                <div className="mt-6 space-y-2">
                  <h4 className="font-serif italic text-2xl tracking-tight leading-tight">{imovel.titulo}</h4>
                  <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-widest opacity-40">
                    <span>{imovel.localizacao}</span>
                    <span className="text-black opacity-100">{imovel.preco}</span>
                  </div>
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
            "fixed rounded-none flex items-center justify-center shadow-2xl z-[100] transition-all bg-black text-white",
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
