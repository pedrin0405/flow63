"use client";

import { useState, useEffect, useRef } from "react";
import { saveBioLead, trackBioView } from "@/app/actions/bio-analytics";
import { ModernTheme } from "./bio-themes/modern-theme";
import { GlassTheme } from "./bio-themes/glass-theme";
import { MinimalistTheme } from "./bio-themes/minimalist-theme";

interface BioClientContentProps {
  data: any;
  slug: string;
  isPreview?: boolean;
}

export default function BioClientContent({ data, slug, isPreview = false }: BioClientContentProps) {
  const sessionIdRef = useRef<string>("");
  const maxScrollRef = useRef<number>(0);
  const startTimeRef = useRef<number>(0);
  const hasSentFinalRef = useRef<boolean>(false);

  // Função de rastreamento resiliente via API Route
  const trackEvent = async (payload: any) => {
    if (isPreview || !data.id) return;
    
    const body = JSON.stringify({
      bio_id: data.id,
      ...payload
    });

    // keepalive: true permite que a requisição continue mesmo se a página fechar
    try {
      if (typeof navigator !== 'undefined' && navigator.sendBeacon && payload.is_final) {
        // sendBeacon é ideal para eventos de fechamento de página
        navigator.sendBeacon('/api/bio/track', body);
      } else {
        fetch('/api/bio/track', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body,
          keepalive: true 
        });
      }
    } catch (e) {
      console.error("Tracking Error:", e);
    }
  };

  useEffect(() => {
    if (!data.id || isPreview) return;

    // 1. Session & Time setup
    let sid = sessionStorage.getItem(`bio_sid_${data.id}`);
    if (!sid) {
      sid = Math.random().toString(36).substring(2, 15);
      sessionStorage.setItem(`bio_sid_${data.id}`, sid);
    }
    sessionIdRef.current = sid;
    startTimeRef.current = Date.now();

    // 2. Track View Inicial
    trackBioView(data.id); // Contador legado
    trackEvent({
      tipo: 'view',
      device_info: {
        session_id: sid,
        referrer: document.referrer,
        user_agent: window.navigator.userAgent,
        screen: `${window.screen.width}x${window.screen.height}`
      }
    });

    // 3. LCP / Performance
    if ('PerformanceObserver' in window) {
      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const lastEntry = entries[entries.length - 1];
        trackEvent({
          tipo: 'view',
          device_info: {
            session_id: sid,
            lcp: lastEntry.startTime / 1000,
            is_performance: true
          }
        });
        observer.disconnect();
      });
      observer.observe({ type: 'largest-contentful-paint', buffered: true });
    }

    // 4. Scroll monitoring
    const handleScroll = () => {
      const winHeight = window.innerHeight;
      const docHeight = document.documentElement.scrollHeight;
      const scrollTop = window.scrollY;
      const scrollPercent = Math.round((scrollTop / (docHeight - winHeight)) * 100);
      if (scrollPercent > maxScrollRef.current) maxScrollRef.current = scrollPercent;
    };

    // 5. Final metrics (VisibilityChange é mais confiável que beforeunload)
    const sendFinal = () => {
      if (hasSentFinalRef.current) return;
      const duration = (Date.now() - startTimeRef.current) / 1000;
      
      trackEvent({
        tipo: 'view',
        device_info: {
          session_id: sessionIdRef.current,
          is_final: true,
          duration: duration,
          max_scroll: maxScrollRef.current
        }
      });
      hasSentFinalRef.current = true;
    };

    window.addEventListener('scroll', handleScroll);
    window.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'hidden') sendFinal();
    });
    window.addEventListener('pagehide', sendFinal); // Backup para mobile

    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('visibilitychange', sendFinal);
      window.removeEventListener('pagehide', sendFinal);
    };
  }, [data.id, isPreview]);

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

  const handleLinkClick = async (link: any, index: number) => {
    if (!isPreview) {
      // Envio de clique via API Route com keepalive
      trackEvent({
        tipo: 'click',
        link_url: link.url || link.title,
        device_info: {
          session_id: sessionIdRef.current,
          link_title: link.title,
          index,
          is_conversion: link.url?.includes('wa.me') || link.url?.includes('whatsapp')
        }
      });
    }
    if (link.type === "vcard") handleDownloadVCF();
  };

  const getAnimationProps = (type: string) => {
    switch (type) {
      case "pulse": return { animate: { scale: [1, 1.03, 1] }, transition: { repeat: Infinity, duration: 2 } };
      case "vibrate": return { animate: { x: [-1, 1, -1, 1, 0] }, transition: { repeat: Infinity, duration: 0.5, repeatDelay: 2 } };
      case "glow":
        return {
          animate: { 
            boxShadow: (data.tema?.preset === "glass") 
              ? ["0 0 0px rgba(255,255,255,0)", "0 0 20px rgba(255,255,255,0.3)", "0 0 0px rgba(255,255,255,0)"]
              : ["0 0 0px rgba(0,0,0,0)", "0 0 15px rgba(59,130,246,0.5)", "0 0 0px rgba(0,0,0,0)"] 
          },
          transition: { repeat: Infinity, duration: 2 }
        };
      default: return {};
    }
  };

  const themeProps = {
    data,
    visibleLinks: data.links?.filter((link: any) => {
      if (!link.schedule?.start && !link.schedule?.end) return true;
      const now = new Date();
      const start = link.schedule.start ? new Date(link.schedule.start) : null;
      const end = link.schedule.end ? new Date(link.schedule.end) : null;
      if (start && now < start) return false;
      if (end && now > end) return false;
      return true;
    }),
    handleLinkClick,
    getAnimationProps,
    isPreview
  };

  if (data.tema?.preset === "glass") return <GlassTheme {...themeProps} />;
  if (data.tema?.preset === "minimalist") return <MinimalistTheme {...themeProps} />;
  return <ModernTheme {...themeProps} />;
}
