"use client";

import { useState, useEffect } from "react";
import { saveBioLead, trackBioClick, trackBioView } from "@/app/actions/bio-analytics";
import { ModernTheme } from "./bio-themes/modern-theme";
import { GlassTheme } from "./bio-themes/glass-theme";
import { MinimalistTheme } from "./bio-themes/minimalist-theme";

interface BioClientContentProps {
  data: any;
  slug: string;
  isPreview?: boolean; // Prop para forçar modo mobile no editor
}

export default function BioClientContent({ data, slug, isPreview = false }: BioClientContentProps) {
  const [leadForm, setLeadForm] = useState({ nome: "", email: "" });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (data.id && !isPreview) {
      trackBioView(data.id);
    }
  }, [data.id, isPreview]);

  const preset = data.tema?.preset || "modern";

  const handleDownloadVCF = () => {
    const vcard = `BEGIN:VCARD
VERSION:3.0
FN:${data.nome}
NOTE:${data.bio}
${data.whatsapp?.enabled ? `TEL;TYPE=CELL:${data.whatsapp.number}` : ""}
URL:${window.location.href}
END:VCARD`;
    
    const blob = new Blob([vcard], { type: "text/vcard" });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `${data.nome.replace(/\s+/g, "_")}.vcf`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleLinkClick = (link: any, index: number) => {
    if (!isPreview) trackBioClick(data.id, index);
    if (link.type === "vcard") {
      handleDownloadVCF();
    }
  };

  const getAnimationProps = (type: string) => {
    switch (type) {
      case "pulse": return { animate: { scale: [1, 1.03, 1] }, transition: { repeat: Infinity, duration: 2 } };
      case "vibrate": return { animate: { x: [-1, 1, -1, 1, 0] }, transition: { repeat: Infinity, duration: 0.5, repeatDelay: 2 } };
      case "glow":
        return {
          animate: { 
            boxShadow: preset === "glass" 
              ? ["0 0 0px rgba(255,255,255,0)", "0 0 20px rgba(255,255,255,0.3)", "0 0 0px rgba(255,255,255,0)"]
              : ["0 0 0px rgba(0,0,0,0)", "0 0 15px rgba(59,130,246,0.5)", "0 0 0px rgba(0,0,0,0)"] 
          },
          transition: { repeat: Infinity, duration: 2 }
        };
      default: return {};
    }
  };

  const now = new Date();
  const visibleLinks = data.links?.filter((link: any) => {
    if (!link.schedule?.start && !link.schedule?.end) return true;
    const start = link.schedule.start ? new Date(link.schedule.start) : null;
    const end = link.schedule.end ? new Date(link.schedule.end) : null;
    if (start && now < start) return false;
    if (end && now > end) return false;
    return true;
  });

  const themeProps = {
    data,
    visibleLinks,
    handleLinkClick,
    getAnimationProps,
    isPreview
  };

  if (preset === "glass") return <GlassTheme {...themeProps} />;
  if (preset === "minimalist") return <MinimalistTheme {...themeProps} />;
  return <ModernTheme {...themeProps} />;
}
