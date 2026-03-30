"use client"

import { useState, useEffect, Suspense, useRef, useCallback } from "react"
import { useTheme } from "next-themes"
import { CreditCard, Menu, Download, ShieldCheck, Calendar, Star, Info, Plus, FileText, Camera, Loader2, Trash2, Settings2, Maximize, Eye, MoveHorizontal, MoveVertical, Edit2, UploadCloud, User, Percent, Sparkles, Zap, ChevronRight, X, QrCode } from "lucide-react"
import { Sidebar } from "@/components/central63/sidebar"
import { useToast } from "@/hooks/use-toast"
import { supabase } from "@/lib/supabase"
import Loading from "@/app/loading"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { getCardWithBenefits, updateCardSettings } from "@/app/actions/benefit-cards"
import { toPng } from 'html-to-image'

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Slider } from "@/components/ui/slider"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"

// ─── Styles Light Premium (Com suporte a Temas de Cartão) ───────────────
const glassStyles = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,wght@0,300;0,400;0,500;0,600;0,700;1,700&display=swap');

  :root {
    --glass-white: rgba(255, 255, 255, 0.85);
    --glass-border: rgba(255, 255, 255, 1);
    --glass-shadow: 0 16px 40px rgba(0, 0, 0, 0.08), 0 6px 16px rgba(0, 0, 0, 0.05), inset 0 1px 0 rgba(255, 255, 255, 1);
    --pink: #e91c74;
    --pink-glow: rgba(233, 28, 116, 0.35);
    --bg-base: #f5f5f7;
    --bg-mesh: radial-gradient(ellipse 80% 80% at 10% -10%, rgba(233, 28, 116, 0.08) 0%, transparent 60%),
               radial-gradient(ellipse 60% 60% at 90% 100%, rgba(100, 150, 255, 0.08) 0%, transparent 55%),
               radial-gradient(ellipse 50% 50% at 50% 50%, rgba(255, 255, 255, 0.8) 0%, transparent 60%),
               linear-gradient(160deg, #fdfdfd 0%, #f5f5f7 100%);
    --text-main: #111827;
    --text-muted: #6b7280;
    --card-bg: #ffffff;
    --border-subtle: rgba(0, 0, 0, 0.05);
    --btn-ghost-bg: rgba(255, 255, 255, 0.9);
    --btn-ghost-border: rgba(0, 0, 0, 0.08);
    --btn-ghost-hover: #ffffff;
  }

  .dark {
    --glass-white: rgba(24, 24, 27, 0.8);
    --glass-border: rgba(255, 255, 255, 0.1);
    --glass-shadow: 0 16px 40px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.05);
    --bg-base: #09090b;
    --bg-mesh: radial-gradient(ellipse 80% 80% at 10% -10%, rgba(233, 28, 116, 0.15) 0%, transparent 60%),
               radial-gradient(ellipse 60% 60% at 90% 100%, rgba(139, 92, 246, 0.1) 0%, transparent 55%),
               linear-gradient(160deg, #09090b 0%, #18181b 100%);
    --text-main: #f8fafc;
    --text-muted: #94a3b8;
    --card-bg: #18181b;
    --border-subtle: rgba(255, 255, 255, 0.1);
    --btn-ghost-bg: rgba(255, 255, 255, 0.05);
    --btn-ghost-border: rgba(255, 255, 255, 0.1);
    --btn-ghost-hover: rgba(255, 255, 255, 0.1);
  }

  .glass-font { font-family: 'DM Sans', -apple-system, BlinkMacSystemFont, sans-serif; }

  /* ── Painel de vidro (Adaptativo) ── */
  .glass-panel {
    background: var(--glass-white);
    backdrop-filter: blur(32px) saturate(200%);
    -webkit-backdrop-filter: blur(32px) saturate(200%);
    border: 1px solid var(--glass-border);
    box-shadow: var(--glass-shadow);
  }

  /* ── Cartão fisico Base ── */
  .physical-card {
    transform-style: preserve-3d;
    transition: transform 0.8s cubic-bezier(0.23, 1, 0.32, 1), box-shadow 0.8s ease, background 0.5s ease;
  }
  .physical-card:hover {
    transform: perspective(900px) rotateY(4deg) rotateX(2deg) scale(1.015);
  }

  /* Tema Escuro do Cartão */
  .physical-card.theme-dark {
    background: linear-gradient(135deg, #09090b 0%, #1a0812 40%, #100617 100%);
    border: 1px solid rgba(255, 255, 255, 0.15);
    box-shadow: 0 40px 80px rgba(0, 0, 0, 0.25), 0 15px 35px rgba(0, 0, 0, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.1), inset 0 -1px 0 rgba(0, 0, 0, 0.4);
    color: #ffffff;
  }
  .physical-card.theme-dark:hover {
    box-shadow: 0 50px 100px rgba(0, 0, 0, 0.35), 0 20px 40px rgba(0, 0, 0, 0.20), inset 0 1px 0 rgba(255, 255, 255, 0.15), inset 0 -1px 0 rgba(0, 0, 0, 0.4);
  }

  /* Tema Claro do Cartão */
  .physical-card.theme-light {
    background: linear-gradient(135deg, #ffffff 0%, #f8f9fb 40%, #e2e5eb 100%);
    border: 1px solid rgba(255, 255, 255, 0.9);
    box-shadow: 0 40px 80px rgba(0, 0, 0, 0.15), 0 15px 35px rgba(0, 0, 0, 0.10), inset 0 2px 0 rgba(255, 255, 255, 1), inset 0 -1px 0 rgba(0, 0, 0, 0.05);
    color: #111827;
  }
  .physical-card.theme-light:hover {
    box-shadow: 0 50px 100px rgba(0, 0, 0, 0.22), 0 20px 40px rgba(0, 0, 0, 0.14), inset 0 2px 0 rgba(255, 255, 255, 1), inset 0 -1px 0 rgba(0, 0, 0, 0.05);
  }

  /* ── Luz especular animada no cartão ── */
  @keyframes specular-sweep {
    0%   { transform: translateX(-100%) skewX(-15deg); opacity: 0; }
    15%  { opacity: 1; }
    85%  { opacity: 1; }
    100% { transform: translateX(300%) skewX(-15deg); opacity: 0; }
  }
  .specular-sweep {
    position: absolute; inset: 0; z-index: 20; pointer-events: none;
    animation: specular-sweep 5s ease-in-out infinite;
  }

  /* ── Pill highlight ── */
  .highlight-pill {
    display: inline-flex; align-items: center;
    padding: 2px 9px; border-radius: 20px;
    background: var(--pink); color: #fff;
    font-weight: 800; font-size: 9px; letter-spacing: 0.04em;
    box-shadow: 0 4px 12px var(--pink-glow);
    margin: 0 3px; vertical-align: middle;
  }

  /* ── Benefit card (Sombra reforçada) ── */
  .benefit-card {
    background: var(--card-bg);
    backdrop-filter: blur(20px);
    -webkit-backdrop-filter: blur(20px);
    border: 1px solid var(--border-subtle);
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.08), 0 4px 12px rgba(0, 0, 0, 0.04), inset 0 1px 0 rgba(255, 255, 255, 0.05);
    transition: transform 0.5s cubic-bezier(0.23, 1, 0.32, 1), box-shadow 0.5s ease, border-color 0.3s;
  }
  .benefit-card:hover {
    transform: translateY(-6px) scale(1.01);
    box-shadow: 0 24px 48px rgba(233, 28, 116, 0.15), 0 12px 24px rgba(0, 0, 0, 0.08);
    border-color: rgba(233, 28, 116, 0.3);
  }

  /* ── Botão primário (Rosa) ── */
  .btn-primary { 
    background: var(--pink);
    color: #fff;
    border: none;
    box-shadow: 0 8px 24px var(--pink-glow), 0 4px 10px rgba(0,0,0,0.1), inset 0 1px 0 rgba(255, 255, 255, 0.2);
    transition: background 0.3s, transform 0.2s, box-shadow 0.3s;
  }
  .btn-primary:hover {
    background: #d01866;
    box-shadow: 0 12px 32px var(--pink-glow), 0 6px 14px rgba(0,0,0,0.15), inset 0 1px 0 rgba(255, 255, 255, 0.25);
    transform: translateY(-2px);
  }
  .btn-primary:active { transform: scale(0.98); }

  /* ── Botões de Ação que acompanham o Cartão ── */
  .btn-card-dark {
    background: linear-gradient(135deg, #09090b 0%, #1a0812 40%, #100617 100%);
    color: #fff;
    border: 1px solid rgba(255, 255, 255, 0.15);
    box-shadow: 0 8px 24px rgba(0,0,0,0.2), inset 0 1px 0 rgba(255, 255, 255, 0.1);
    transition: transform 0.2s, box-shadow 0.3s, filter 0.3s;
  }
  .btn-card-dark:hover {
    box-shadow: 0 12px 32px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255, 255, 255, 0.2);
    transform: translateY(-2px);
    filter: brightness(1.15);
  }
  .btn-card-dark:active { transform: scale(0.98); }

  .btn-card-light {
    background: linear-gradient(135deg, #ffffff 0%, #f8f9fb 40%, #e2e5eb 100%);
    color: #111827;
    border: 1px solid rgba(255, 255, 255, 0.9);
    box-shadow: 0 8px 24px rgba(0,0,0,0.08), inset 0 2px 0 rgba(255, 255, 255, 1);
    transition: transform 0.2s, box-shadow 0.3s, filter 0.3s;
  }
  .btn-card-light:hover {
    box-shadow: 0 12px 32px rgba(0,0,0,0.12), inset 0 2px 0 rgba(255, 255, 255, 1);
    transform: translateY(-2px);
    filter: brightness(1.02);
  }
  .btn-card-light:active { transform: scale(0.98); }

  /* ── Botão ghost (Adaptativo) ── */
  .btn-ghost {
    background: var(--btn-ghost-bg);
    backdrop-filter: blur(12px);
    border: 1px solid var(--btn-ghost-border);
    color: var(--text-main);
    box-shadow: 0 6px 16px rgba(0, 0, 0, 0.06), 0 2px 6px rgba(0,0,0,0.04);
    transition: background 0.3s, transform 0.2s, border-color 0.3s, color 0.3s, box-shadow 0.3s;
  }
  .btn-ghost:hover {
    background: var(--btn-ghost-hover);
    border-color: var(--btn-ghost-border);
    box-shadow: 0 10px 24px rgba(0, 0, 0, 0.1), 0 4px 10px rgba(0,0,0,0.06);
    transform: translateY(-2px);
  }

  /* ── Scrollbar ── */
  .glass-scroll::-webkit-scrollbar { width: 4px; }
  .glass-scroll::-webkit-scrollbar-track { background: transparent; }
  .glass-scroll::-webkit-scrollbar-thumb { background: rgba(120,120,120,0.2); border-radius: 99px; }

  /* ── Shimmer no badge status ── */
  @keyframes status-pulse {
    0%,100% { opacity: 0.7; transform: scale(1); }
    50% { opacity: 1; transform: scale(1.5); }
  }
  .status-dot { animation: status-pulse 2s ease-in-out infinite; }

  /* ── Fade-in stagger para benefit cards ── */
  @keyframes fadeSlideUp {
    from { opacity:0; transform: translateY(16px); }
    to   { opacity:1; transform: translateY(0); }
  }
  .benefit-appear { animation: fadeSlideUp 0.5s cubic-bezier(0.23,1,0.32,1) both; }

  /* ── Customização dropdown ── */
  .customize-panel {
    background: var(--glass-white) !important;
    backdrop-filter: blur(40px) saturate(180%) !important;
    -webkit-backdrop-filter: blur(40px) saturate(180%) !important;
    border: 1px solid var(--glass-border) !important;
    box-shadow: var(--glass-shadow) !important;
    color: var(--text-main) !important;
  }
`

// ─── Highlight Pills ───────────────────────────────────────────────────────────
const HighlightValue = ({ text }: { text: string }) => {
  if (!text) return null
  const parts = text.split(/(\d+%|OFF|VIP|GRÁTIS|DESCONTO|CORTESIA)/gi)
  return (
    <>
      {parts.map((part, i) =>
        /(\d+%|OFF|VIP|GRÁTIS|DESCONTO|CORTESIA)/i.test(part) ? (
          <span key={i} className="highlight-pill">{part}</span>
        ) : (
          part
        )
      )}
    </>
  )
}

// ─── Main Page ─────────────────────────────────────────────────────────────────
export default function MyBenefitCardPage() {
  const { toast } = useToast()
  const { resolvedTheme } = useTheme()
  const cardRef = useRef<HTMLDivElement>(null)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [activeTab, setActiveTab] = useState("my-card")
  const [card, setCard] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [user, setUser] = useState<any>(null)
  const [isExporting, setIsExporting] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [isValidateModalOpen, setIsValidateModalOpen] = useState(false)

  const [imagePos, setImagePos] = useState({ x: 50, y: 50 })
  const [imageZoom, setImageZoom] = useState(1)
  const [imageOpacity, setImageOpacity] = useState(0.5)
  const [cardName, setCardName] = useState("")
  const [hasLoadedSettings, setHasLoadedSettings] = useState(false)

  // Estado do Tema do Cartão
  const [cardTheme, setCardTheme] = useState<'dark' | 'light'>('dark')

  // Efeito para sincronizar com o tema global
  useEffect(() => {
    const savedTheme = localStorage.getItem('central63_card_theme')
    if (savedTheme === 'light' || savedTheme === 'dark') {
      setCardTheme(savedTheme as 'light' | 'dark')
    } else if (resolvedTheme === 'dark' || resolvedTheme === 'light') {
      setCardTheme(resolvedTheme)
    }
  }, [resolvedTheme])

  const handleThemeChange = (theme: 'dark' | 'light') => {
    setCardTheme(theme)
    localStorage.setItem('central63_card_theme', theme)
  }

  const loadData = async () => {
    setIsLoading(true)
    try {
      const { data: { user: authUser } } = await supabase.auth.getUser()
      if (authUser) {
        const { data: profile } = await supabase.from('profiles').select('*').eq('id', authUser.id).single()
        setUser(profile)
        const result = await getCardWithBenefits(authUser.id)
        if (result.success && result.data) {
          setCard(result.data)
          setImagePos({ x: result.data.card_image_pos_x ?? 50, y: result.data.card_image_pos_y ?? 50 })
          setImageZoom(result.data.card_image_zoom ?? 1)
          setImageOpacity(result.data.card_image_opacity ?? 0.5)
          setCardName(result.data.card_display_name || profile?.full_name || "")
          setHasLoadedSettings(true)
        }
      }
    } catch (error) {
      console.error(error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => { loadData() }, [])

  useEffect(() => {
    if (!card || !hasLoadedSettings) return
    const timer = setTimeout(async () => {
      await updateCardSettings(card.id, {
        card_image_pos_x: imagePos.x,
        card_image_pos_y: imagePos.y,
        card_image_zoom: imageZoom,
        card_image_opacity: imageOpacity,
        card_display_name: cardName
      })
    }, 1000)
    return () => clearTimeout(timer)
  }, [imagePos, imageZoom, imageOpacity, cardName, card, hasLoadedSettings])

  const handleUploadImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !card) return
    setIsUploading(true)
    try {
      const fileExt = file.name.split('.').pop()
      const fileName = `user-card-${card.id}-${Math.random().toString(36).substring(2)}.${fileExt}`
      const filePath = `benefit-cards/${fileName}`
      const { error: uploadError } = await supabase.storage.from('user-uploads').upload(filePath, file)
      if (uploadError) throw uploadError
      const { data: { publicUrl } } = supabase.storage.from('user-uploads').getPublicUrl(filePath)
      const res = await updateCardSettings(card.id, { card_image_url: publicUrl })
      if (res.success) {
        toast({ title: "Sucesso", description: "Foto do cartão atualizada." })
        setCard({ ...card, card_image_url: publicUrl })
      } else throw new Error(res.error)
    } catch (error: any) {
      toast({ title: "Erro no upload", description: error.message, variant: "destructive" })
    } finally {
      setIsUploading(false)
    }
  }

  const removeImage = async () => {
    if (!card) return
    setIsUploading(true)
    try {
      const res = await updateCardSettings(card.id, { card_image_url: "" })
      if (res.success) {
        toast({ title: "Sucesso", description: "Foto removida." })
        setCard({ ...card, card_image_url: "" })
      }
    } catch (e: any) {
      toast({ title: "Erro", description: e.message, variant: "destructive" })
    } finally {
      setIsUploading(false)
    }
  }

  const handleDownloadPDF = async () => {
    if (!cardRef.current) return
    setIsExporting(true)
    toast({ title: "Processando", description: "Gerando seu Ticket PDF..." })
    try {
      // O fundo do PDF se adapta ao tema selecionado para evitar bordas feias
      const pdfBg = cardTheme === 'dark' ? '#0a0a0a' : '#ffffff'
      const dataUrl = await toPng(cardRef.current, { cacheBust: true, pixelRatio: 3, style: { borderRadius: '0', background: pdfBg } })
      const { jsPDF } = await import('jspdf/dist/jspdf.es.min.js')
      const pdf = new jsPDF({ orientation: 'landscape', unit: 'mm', format: [85.6, 54] })
      pdf.addImage(dataUrl, 'PNG', 0, 0, 85.6, 54)
      pdf.save(`ticket-central63-${user?.full_name?.split(' ')[0] || 'membro'}.pdf`)
      toast({ title: "Sucesso!", description: "PDF gerado." })
    } catch (err) {
      console.error(err)
      toast({ title: "Erro", description: "Falha ao gerar PDF.", variant: "destructive" })
    } finally {
      setIsExporting(false)
    }
  }

  if (isLoading && !card) return <Loading />
if (isLoading && !card) return <Loading />

const isAppDark = resolvedTheme === 'dark';
const isCardDark = cardTheme === 'dark';

return (
  <Suspense fallback={<Loading />}>
    <style>{glassStyles}</style>

    <div
      className={`glass-font flex h-screen overflow-hidden transition-colors duration-500 ${isAppDark ? 'dark' : ''}`}
      style={{ background: 'var(--bg-mesh)', backgroundColor: 'var(--bg-base)', color: 'var(--text-main)' }}
    >
        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} activeTab={activeTab} onTabChange={setActiveTab} />

        <main className="flex-1 flex flex-col h-full overflow-hidden">

          {/* ── Header Glass ── */}
          <header
            className="glass-panel z-20 flex items-center justify-between px-5 sm:px-8 py-4 transition-all duration-500"
            style={{ borderRadius: 0, borderLeft: 'none', borderTop: 'none', borderRight: 'none' }}
          >
            <div className="flex items-center gap-3 sm:gap-4">
              <button
                className="lg:hidden p-2 rounded-xl transition-all hover:bg-black/5 dark:hover:bg-white/5"
                onClick={() => setSidebarOpen(true)}
              >
                <Menu size={18} />
              </button>

              {/* Logo pill */}
              <div
                className="flex items-center gap-2.5 px-3 py-1.5 rounded-2xl transition-all duration-500"
                style={{
                  background: 'var(--card-bg)',
                  border: '1px solid var(--border-subtle)',
                  boxShadow: '0 6px 16px rgba(0,0,0,0.06)'
                }}
              >
                <div
                  className="w-8 h-8 rounded-xl flex items-center justify-center transition-all duration-500"
                  style={{
                    background: 'var(--card-bg)',
                    border: '1px solid var(--border-subtle)',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.08)'
                  }}
                >
                  <CreditCard size={15} color="#e91c74" />
                </div>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700, letterSpacing: '-0.02em', color: 'var(--text-main)' }}>
                    Club Casa63+
                  </div>
                  <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.18em', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                    Member Portal
                  </div>
                </div>
              </div>
            </div>

            {/* Status chip */}
            <div
              className="flex items-center gap-2 px-3.5 py-2 rounded-2xl transition-all duration-500"
              style={{
                background: 'var(--card-bg)',
                border: '1px solid var(--border-subtle)',
                boxShadow: '0 4px 12px rgba(0,0,0,0.05)'
              }}
            >
              <span
                className="status-dot block w-1.5 h-1.5 rounded-full"
                style={{ background: '#e91c74', boxShadow: '0 0 6px rgba(233,28,116,0.6)' }}
              />
              <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--text-muted)' }}>
                Sistema Ativo
              </span>
            </div>
          </header>

          {/* ── Body ── */}
          <div
            className="flex-1 overflow-y-auto glass-scroll"
            style={{ padding: '32px 24px 60px' }}
          >
            <div style={{ maxWidth: 1360, margin: '0 auto' }}>
              {card ? (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">

                  {/* ─── LEFT: Card + Actions ─── */}
                  <div className="lg:col-span-5 space-y-6 lg:sticky lg:top-0">

                    {/* Ambient glow behind card (Dinâmico) */}
                    <div className="relative">
                      <div
                        className="absolute -inset-8 rounded-[4rem] blur-3xl pointer-events-none transition-all duration-700"
                        style={{ background: isCardDark ? 'radial-gradient(ellipse at 70% 30%, rgba(233,28,116,0.3) 0%, transparent 60%), radial-gradient(ellipse at 30% 80%, rgba(139, 92, 246, 0.25) 0%, transparent 60%)' : 'radial-gradient(ellipse at 60% 40%, rgba(233,28,116,0.15) 0%, transparent 60%)' }}
                      />

                      {/* Physical card com Tema Dinâmico */}
                      <div
                        ref={cardRef}
                        className={`physical-card group/card relative w-full overflow-hidden ${isCardDark ? 'theme-dark' : 'theme-light'}`}
                        style={{ aspectRatio: '1.586/1', borderRadius: '2.2rem' }}
                      >
                        {/* Metal brushed texture */}
                        <div
                          className="absolute inset-0 pointer-events-none"
                          style={{
                            background: isCardDark ? 'repeating-linear-gradient(83deg, transparent, transparent 2px, rgba(255,255,255,0.015) 2px, rgba(255,255,255,0.015) 3px)' : 'repeating-linear-gradient(83deg, transparent, transparent 2px, rgba(0,0,0,0.015) 2px, rgba(0,0,0,0.015) 3px)',
                            zIndex: 1
                          }}
                        />

                        {/* Color gradient layer interno (Dinâmico) */}
                        <div
                          className="absolute inset-0 pointer-events-none transition-opacity duration-700"
                          style={{
                            background: isCardDark ? 'radial-gradient(ellipse at 80% 0%, rgba(233,28,116,0.3) 0%, transparent 55%), radial-gradient(ellipse at 20% 100%, rgba(139,92,246,0.2) 0%, transparent 50%)' : 'none',
                            zIndex: 2
                          }}
                        />

                        {/* Top highlight edge */}
                        <div
                          className="absolute top-0 left-0 right-0 h-px pointer-events-none"
                          style={{ background: isCardDark ? 'linear-gradient(90deg, transparent, rgba(255,255,255,0.3) 30%, rgba(255,255,255,0.1) 70%, transparent)' : 'linear-gradient(90deg, transparent, rgba(255,255,255,1) 30%, rgba(255,255,255,0.8) 70%, transparent)', zIndex: 3 }}
                        />

                        {/* Specular sweep */}
                        <div 
                          className="specular-sweep" 
                          style={{ background: isCardDark ? 'linear-gradient(100deg, transparent 20%, rgba(255, 255, 255, 0.12) 50%, transparent 80%)' : 'linear-gradient(100deg, transparent 20%, rgba(255, 255, 255, 0.8) 50%, transparent 80%)' }} 
                        />

                        {/* User photo overlay (Dinâmico) */}
                        {card.card_image_url && (
                          <div className="absolute inset-0 z-0 pointer-events-none select-none">
                            <img
                              src={card.card_image_url}
                              alt=""
                              style={{
                                position: 'absolute',
                                left: `${imagePos.x}%`,
                                top: `${imagePos.y}%`,
                                transform: `translate(-50%,-50%) scale(${imageZoom})`,
                                opacity: imageOpacity,
                                width: '100%', height: '100%',
                                objectFit: 'cover',
                                filter: 'grayscale(100%)',
                                mixBlendMode: isCardDark ? 'overlay' : 'multiply'
                              }}
                            />
                            {/* Gradiente cobrindo a imagem */}
                            <div className="absolute inset-0" style={{ background: isCardDark ? 'linear-gradient(100deg, rgba(10,10,12,0.95) 0%, rgba(26,8,18,0.6) 60%, transparent 100%)' : 'linear-gradient(100deg, rgba(255,255,255,0.95) 0%, rgba(255,255,255,0.6) 60%, transparent 100%)' }} />
                          </div>
                        )}

                        {/* Card content */}
                        <div
                          className="relative flex flex-col justify-between h-full"
                          style={{ padding: '28px 28px 24px', zIndex: 10 }}
                        >
                          {/* Top row */}
                          <div className="flex items-start justify-between">
                            <div className="flex items-center gap-3">
                              {/* Logo mark */}
                              <div
                                style={{
                                  width: 44, height: 44,
                                  background: isCardDark ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.9)',
                                  border: isCardDark ? '1px solid rgba(255,255,255,0.15)' : '1px solid rgba(0,0,0,0.05)',
                                  borderRadius: 14,
                                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                                  boxShadow: isCardDark ? '0 4px 12px rgba(0,0,0,0.2)' : '0 4px 12px rgba(0,0,0,0.08)',
                                  transition: 'all 0.5s'
                                }}
                              >
                                <div style={{
                                  width: 22, height: 22,
                                  backgroundColor: '#e91c74',
                                  maskImage: 'url(/icon.svg)',
                                  WebkitMaskImage: 'url(/icon.svg)',
                                  maskRepeat: 'no-repeat', WebkitMaskRepeat: 'no-repeat',
                                  maskSize: 'contain', WebkitMaskSize: 'contain',
                                  maskPosition: 'center', WebkitMaskPosition: 'center'
                                }} />
                              </div>
                              <div>
                                <div style={{ fontWeight: 800, fontSize: 15, letterSpacing: '-0.03em', fontStyle: 'italic', textTransform: 'uppercase', lineHeight: 1 }}>Club Casa63+</div>
                                <div style={{ fontWeight: 700, fontSize: 9, letterSpacing: '0.22em', textTransform: 'uppercase', opacity: isCardDark ? 0.6 : 0.5, marginTop: 3 }}>Exclusivo</div>
                              </div>
                            </div>

                            {/* Customize trigger */}
                            <DropdownMenu open={menuOpen} onOpenChange={setMenuOpen}>
                              <DropdownMenuTrigger asChild>
                                <button
                                  style={{
                                    padding: '6px 14px',
                                    borderRadius: 99,
                                    background: isCardDark ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.5)',
                                    border: isCardDark ? '1px solid rgba(255,255,255,0.2)' : '1px solid rgba(0,0,0,0.08)',
                                    color: isCardDark ? '#ffffff' : '#111827',
                                    fontSize: 9, fontWeight: 800, letterSpacing: '0.14em',
                                    textTransform: 'uppercase',
                                    display: 'flex', alignItems: 'center', gap: 6,
                                    cursor: 'pointer', transition: 'all 0.25s',
                                    boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
                                    minWidth: '85px',
                                    justifyContent: 'center'
                                  }}
                                  onMouseEnter={e => { e.currentTarget.style.background = '#e91c74'; e.currentTarget.style.borderColor = '#e91c74'; e.currentTarget.style.color = '#fff'; }}
                                  onMouseLeave={e => { 
                                    e.currentTarget.style.background = isCardDark ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.5)'; 
                                    e.currentTarget.style.borderColor = isCardDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.08)'; 
                                    e.currentTarget.style.color = isCardDark ? '#ffffff' : '#111827';
                                  }}
                                >
                                  {/* Renderiza "VÁLIDO" estado normal. Ao passar o mouse no card, oculta. */}
                                  <span className="flex items-center gap-1.5 group-hover/card:hidden">
                                    <span style={{ width: 5, height: 5, borderRadius: 99, background: '#e91c74', display: 'inline-block' }} />
                                    VÁLIDO
                                  </span>
                                  {/* Renderiza "EDITAR" apenas ao passar o mouse em qualquer parte do cartão escuro. */}
                                  <span className="hidden items-center gap-1.5 group-hover/card:flex">
                                    <Edit2 size={10} />
                                    EDITAR
                                  </span>
                                </button>
                              </DropdownMenuTrigger>

                              <DropdownMenuContent
                                side="right" sideOffset={60} align="center"
                                className="customize-panel w-72 rounded-[2.2rem] p-6 z-50"
                                style={{ border: 'none' }}
                              >
                                <div className="space-y-5">
                                  <p style={{ fontSize: 10, fontWeight: 800, letterSpacing: '0.18em', textTransform: 'uppercase', opacity: 0.5, borderBottom: '1px solid var(--border-subtle)', paddingBottom: 10 }}>
                                    Customização
                                  </p>

                                  {/* Seletor de Temas Adicionado */}
                                  <div className="space-y-2">
                                    <label style={{ fontSize: 10, fontWeight: 700, opacity: 0.6, display: 'flex', alignItems: 'center', gap: 6 }}>
                                      <Sparkles size={11} /> Estilo do Cartão
                                    </label>
                                    <div className="flex gap-2">
                                      <button 
                                        onClick={() => handleThemeChange('light')}
                                        className={`flex-1 h-10 rounded-[12px] font-bold text-xs border transition-all ${!isCardDark ? 'border-[#e91c74] bg-[#e91c74]/10 text-[#e91c74]' : 'border-current opacity-50 bg-current/5 hover:opacity-100'}`}
                                      >
                                        Claro
                                      </button>
                                      <button 
                                        onClick={() => handleThemeChange('dark')}
                                        className={`flex-1 h-10 rounded-[12px] font-bold text-xs border transition-all ${isCardDark ? 'border-[#e91c74] bg-[#e91c74]/10 text-[#e91c74]' : 'border-current opacity-50 bg-current/5 hover:opacity-100'}`}
                                      >
                                        Escuro
                                      </button>
                                    </div>
                                  </div>

                                  <div className="space-y-2">
                                    <label style={{ fontSize: 10, fontWeight: 700, opacity: 0.6, display: 'flex', alignItems: 'center', gap: 6 }}>
                                      <User size={11} /> Nome Impresso
                                    </label>
                                    <Input
                                      value={cardName}
                                      onChange={(e) => setCardName(e.target.value)}
                                      placeholder="Nome no cartão"
                                      style={{
                                        height: 44, borderRadius: 14,
                                        background: 'rgba(120,120,120,0.05)',
                                        border: '1px solid var(--border-subtle)',
                                        fontWeight: 600, fontSize: 13, color: 'inherit'
                                      }}
                                    />
                                  </div>
                                  <div className="space-y-4">
                                    {[
                                      { label: 'Posição X', value: [imagePos.x], min: 0, max: 100, display: `${imagePos.x.toFixed(0)}%`, onChange: ([v]: number[]) => setImagePos(p => ({ ...p, x: v })) },
                                      { label: 'Posição Y', value: [imagePos.y], min: 0, max: 100, display: `${imagePos.y.toFixed(0)}%`, onChange: ([v]: number[]) => setImagePos(p => ({ ...p, y: v })) },
                                      { label: 'Zoom', value: [imageZoom], min: 1, max: 3, step: 0.01, display: `${(imageZoom * 100).toFixed(0)}%`, onChange: ([v]: number[]) => setImageZoom(v) },
                                    ].map(({ label, value, min, max, step, display, onChange }) => (
                                      <div key={label} className="space-y-1.5">
                                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, fontWeight: 700, opacity: 0.6 }}>
                                          <span>{label}</span><span>{display}</span>
                                        </div>
                                        <Slider
                                          value={value}
                                          min={min}
                                          max={max}
                                          step={step}
                                          onValueChange={onChange}
                                          className="
                                              [&_[role=slider]]:bg-current 
                                              [&_[role=slider]]:border-none 
                                              [&_[data-radix-slider-range]]:bg-current 
                                              [&_[data-radix-slider-track]]:bg-current/10
                                            "
                                        />
                                      </div>
                                    ))}
                                  </div>
                                  <div className="space-y-2 pt-1">
                                    <button
                                      className="btn-ghost w-full rounded-2xl font-bold uppercase text-xs gap-2 flex items-center justify-center"
                                      style={{ height: 44, letterSpacing: '0.1em', border: '1px dashed var(--border-subtle)' }}
                                      onClick={() => document.getElementById('card-photo-upload')?.click()}
                                    >
                                      <Camera size={14} /> Trocar Foto
                                    </button>
                                    {card.card_image_url && (
                                      <button
                                        onClick={removeImage}
                                        style={{ width: '100%', background: 'none', border: 'none', color: '#e91c74', fontSize: 10, fontWeight: 800, letterSpacing: '0.1em', textTransform: 'uppercase', cursor: 'pointer', padding: '6px 0' }}
                                      >
                                        Remover Imagem
                                      </button>
                                    )}
                                  </div>
                                </div>
                                <input id="card-photo-upload" type="file" className="hidden" accept="image/*" onChange={handleUploadImage} />
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>

                          {/* Bottom row */}
                          <div className="flex items-end justify-between" style={{ pointerEvents: 'none' }}>
                            <div className="space-y-4">
                              <div>
                                <div style={{ fontSize: 9, fontWeight: 800, letterSpacing: '0.4em', textTransform: 'uppercase', opacity: isCardDark ? 0.5 : 0.45, marginBottom: 5 }}>Membro do Club</div>
                                <div style={{ fontSize: 22, fontWeight: 800, letterSpacing: '-0.03em', textTransform: 'uppercase', maxWidth: 240, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                  {cardName}
                                </div>
                              </div>
                              <div style={{ display: 'flex', gap: 32 }}>
                                {[
                                  { label: 'Level', value: card.nivel_beneficio },
                                  { label: 'Validade', value: new Date(card.data_validade).toLocaleDateString('pt-BR') }
                                ].map(({ label, value }) => (
                                  <div key={label}>
                                    <div style={{ fontSize: 8, fontWeight: 800, letterSpacing: '0.2em', textTransform: 'uppercase', opacity: isCardDark ? 0.5 : 0.45, marginBottom: 3 }}>{label}</div>
                                    <div style={{ fontSize: 12, fontWeight: 800, opacity: 1 }}>{value}</div>
                                  </div>
                                ))}
                              </div>
                            </div>

                            {/* QR */}
                            <div
                              style={{
                                width: 68, height: 68,
                                background: 'white',
                                borderRadius: 16,
                                padding: 6,
                                boxShadow: isCardDark ? '0 12px 32px rgba(0,0,0,0.2)' : '0 8px 24px rgba(0,0,0,0.08)',
                                border: '1px solid rgba(255,255,255,0.1)',
                                overflow: 'hidden'
                              }}
                            >
                              <img src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${card.id}&margin=10`} alt="QR" style={{ width: '100%', height: '100%' }} />
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Action buttons dinâmicos com o tema */}
                    <div className="flex gap-3">
                      <button
                        className={`${isCardDark ? 'btn-card-dark' : 'btn-card-light'} flex-[2] flex items-center justify-center gap-2.5 rounded-2xl font-black uppercase`}
                        style={{ height: 52, fontSize: 10, letterSpacing: '0.12em' }}
                        onClick={handleDownloadPDF}
                        disabled={isExporting}
                      >
                        {isExporting ? <Loader2 size={16} className="animate-spin" /> : <FileText size={16} />}
                        Obter Passe (PDF)
                      </button>
                      <button
                        className="btn-ghost flex-1 flex items-center justify-center gap-2 rounded-2xl font-black uppercase"
                        style={{ height: 52, fontSize: 10, letterSpacing: '0.12em' }}
                        onClick={() => setIsValidateModalOpen(true)}
                      >
                        <QrCode size={16} /> Validar
                      </button>
                    </div>

                  </div>

                  {/* ─── RIGHT: Benefits ─── */}
                  <div className="lg:col-span-7 space-y-6">

                    {/* Section header */}
                    <div
                      className="glass-panel rounded-[1.8rem] flex items-center justify-between"
                      style={{ padding: '16px 20px' }}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          style={{
                            width: 40, height: 40, borderRadius: 13,
                            background: 'rgba(233,28,116,0.1)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            boxShadow: '0 4px 12px rgba(233,28,116,0.15)'
                          }}
                        >
                          <Zap size={18} fill="#e91c74" color="#e91c74" />
                        </div>
                        <div>
                          <div style={{ fontSize: 18, fontWeight: 800, letterSpacing: '-0.03em', color: 'var(--text-main)' }}>Vantagens Ativas</div>
                          <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.22em', textTransform: 'uppercase', color: 'var(--text-muted)', marginTop: 2 }}>Curadoria Club Casa63+</div>
                        </div>
                      </div>
                      <div
                        style={{
                          padding: '5px 14px', borderRadius: 99,
                          background: 'var(--card-bg)', color: 'var(--text-main)',
                          border: '1px solid var(--border-subtle)',
                          fontSize: 10, fontWeight: 800, letterSpacing: '0.08em',
                          boxShadow: '0 4px 12px rgba(0,0,0,0.05)'
                        }}
                      >
                        {card.card_benefits?.length || 0} ITENS
                      </div>
                    </div>

                    {/* Benefits grid */}
                    <div
                      className="glass-panel rounded-[2.2rem]"
                      style={{ padding: '20px' }}
                    >
                      {card.card_benefits?.length > 0 ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                          {card.card_benefits.map((cb: any, idx: number) => (
                            <div
                              key={cb.benefits.id}
                              className="benefit-card benefit-appear rounded-[1.6rem] overflow-hidden flex flex-col cursor-pointer"
                              style={{ animationDelay: `${idx * 60}ms` }}
                            >
                              {/* Image */}
                              <div style={{ position: 'relative', width: '100%', aspectRatio: '16/10', overflow: 'hidden' }}>
                                {cb.benefits.image_url ? (
                                  <img
                                    src={cb.benefits.image_url}
                                    alt=""
                                    style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.8s cubic-bezier(0.23,1,0.32,1)' }}
                                    onMouseEnter={e => (e.currentTarget.style.transform = 'scale(1.07)')}
                                    onMouseLeave={e => (e.currentTarget.style.transform = 'scale(1)')}
                                  />
                                ) : (
                                  <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--btn-ghost-bg)' }}>
                                    <Star size={28} color="var(--text-muted)" />
                                  </div>
                                )}
                                {/* Level badge */}
                                <div
                                  style={{
                                    position: 'absolute', top: 10, right: 10,
                                    background: 'var(--glass-white)',
                                    backdropFilter: 'blur(8px)',
                                    borderRadius: 99, padding: '4px 10px',
                                    color: 'var(--text-main)', fontSize: 8, fontWeight: 800, letterSpacing: '0.1em',
                                    textTransform: 'uppercase',
                                    border: '1px solid var(--border-subtle)',
                                    boxShadow: '0 4px 12px rgba(0,0,0,0.08)'
                                  }}
                                >
                                  Nív {cb.benefits.nivel_minimo}+
                                </div>
                              </div>

                              {/* Content */}
                              <div style={{ padding: '14px 16px', flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
                                <div style={{ fontSize: 13, fontWeight: 800, letterSpacing: '-0.01em', textTransform: 'uppercase', lineHeight: 1.2, color: 'var(--text-main)' }}>
                                  {cb.benefits.nome}
                                </div>
                                <div style={{ fontSize: 11, fontWeight: 500, color: 'var(--text-muted)', lineHeight: 1.5, flex: 1 }}>
                                  <HighlightValue text={cb.benefits.descricao} />
                                </div>
                              </div>

                              {/* Status bar */}
                              <div
                                style={{
                                  padding: '10px 16px',
                                  borderTop: '1px solid var(--border-subtle)',
                                  background: 'var(--btn-ghost-bg)',
                                  display: 'flex', alignItems: 'center', justifyContent: 'space-between'
                                }}
                              >
                                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                  <span
                                    className="status-dot block"
                                    style={{ width: 6, height: 6, borderRadius: 99, background: '#e91c74', boxShadow: '0 0 6px rgba(233,28,116,0.5)' }}
                                  />
                                  <span style={{ fontSize: 9, fontWeight: 800, letterSpacing: '0.14em', textTransform: 'uppercase', color: '#e91c74' }}>Ativado</span>
                                </div>
                                <ChevronRight size={13} style={{ opacity: 0.4, transition: 'all 0.3s', color: 'var(--text-muted)' }} />
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div style={{ padding: '80px 0', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16, opacity: 0.4 }}>
                          <Zap size={36} />
                          <p style={{ fontSize: 11, fontWeight: 800, letterSpacing: '0.2em', textTransform: 'uppercase' }}>Nenhuma vantagem ativa</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 32, padding: '80px 0', textAlign: 'center' }}>
                  <div
                    className="glass-panel"
                    style={{ width: 100, height: 100, borderRadius: 32, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                  >
                    <CreditCard size={36} color="var(--text-muted)" />
                  </div>
                  <div>
                    <div style={{ fontSize: 24, fontWeight: 800, letterSpacing: '-0.03em', fontStyle: 'italic', textTransform: 'uppercase', marginBottom: 10, color: 'var(--text-main)' }}>Cartão não identificado</div>
                    <p style={{ fontSize: 13, color: 'var(--text-muted)', maxWidth: 340, margin: '0 auto' }}>Entre em contato com o suporte para vincular seu benefício.</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </main>
      </div>

      {/* ── Validation Modal (Light Premium Refined) ── */}
      <Dialog open={isValidateModalOpen} onOpenChange={setIsValidateModalOpen}>
        <DialogContent
          style={{
            width: '92vw', maxWidth: 380,
            borderRadius: '2.5rem',
            padding: 0, overflow: 'hidden',
            background: 'var(--glass-white)',
            backdropFilter: 'blur(40px) saturate(200%)',
            WebkitBackdropFilter: 'blur(40px) saturate(200%)',
            border: '1px solid var(--glass-border)',
            boxShadow: 'var(--glass-shadow)'
          }}
        >
          {/* Luzes ambiente de fundo do modal */}
          <div className="absolute top-0 left-0 w-full h-1/2 bg-gradient-to-b from-[#e91c74]/10 to-transparent pointer-events-none" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 bg-purple-500/10 rounded-full blur-[60px] pointer-events-none" />

          <div style={{ padding: '40px 32px 32px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 28, textAlign: 'center', position: 'relative', zIndex: 10 }}>

            {/* Header Compacto */}
            <div className="flex flex-col items-center gap-3">
              <div
                style={{
                  width: 52, height: 52, borderRadius: 16,
                  background: 'linear-gradient(135deg, #e91c74, #ff4d94)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  boxShadow: '0 8px 24px rgba(233,28,116,0.3)'
                }}
              >
                <QrCode size={24} color="white" />
              </div>
              <div className="space-y-1 mt-1">
                <DialogTitle style={{ fontSize: 22, fontWeight: 800, letterSpacing: '-0.03em', color: 'var(--text-main)', lineHeight: 1 }}>Passe de Acesso</DialogTitle>
                <DialogDescription style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-muted)' }}>Apresente para liberação</DialogDescription>
              </div>
            </div>

            {/* QR container flutuante com Aura */}
            <div className="relative group mt-2">
              <div className="absolute -inset-2 bg-gradient-to-r from-[#e91c74]/20 to-purple-500/20 rounded-[2.5rem] blur-xl opacity-50 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
              <div
                style={{
                  position: 'relative',
                  background: '#ffffff',
                  padding: 16, borderRadius: '2rem',
                  boxShadow: '0 20px 40px rgba(0,0,0,0.08), 0 4px 12px rgba(0,0,0,0.04)',
                  border: '1px solid rgba(0,0,0,0.04)',
                  transform: 'translateZ(0)',
                  transition: 'transform 0.4s cubic-bezier(0.23,1,0.32,1)'
                }}
                onMouseEnter={e => (e.currentTarget.style.transform = 'scale(1.02) translateY(-4px)')}
                onMouseLeave={e => (e.currentTarget.style.transform = 'scale(1) translateY(0)')}
              >
                {/* Efeito sutil de scanline/borda interna */}
                <div className="absolute inset-0 border-2 border-[#e91c74]/5 rounded-[2rem] pointer-events-none" />
                <img
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${card?.id}&margin=0`}
                  alt="QR Code"
                  style={{ width: 180, height: 180, display: 'block', borderRadius: '1rem' }}
                />
              </div>
            </div>

            {/* Member info - Ticket Style Horizontal */}
            <div
              style={{
                width: '100%',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '16px 20px', borderRadius: '1.2rem',
                background: 'var(--btn-ghost-bg)',
                border: '1px solid var(--border-subtle)',
                boxShadow: '0 4px 16px rgba(0,0,0,0.03), inset 0 1px 0 rgba(255,255,255,0.1)',
                textAlign: 'left'
              }}
            >
              <div>
                <div style={{ fontSize: 9, fontWeight: 800, letterSpacing: '0.15em', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 2 }}>Membro VIP</div>
                <div style={{ fontSize: 16, fontWeight: 800, letterSpacing: '-0.02em', color: 'var(--text-main)', maxWidth: '140px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{cardName}</div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6 }}>
                <div style={{ padding: '4px 10px', borderRadius: 99, background: 'rgba(233,28,116,0.1)', color: '#e91c74', fontSize: 10, fontWeight: 800, letterSpacing: '0.05em' }}>
                  Nível {card?.nivel_beneficio}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <span className="status-dot block w-1.5 h-1.5 rounded-full" style={{ background: '#10b981', boxShadow: '0 0 6px rgba(16,185,129,0.5)' }} />
                  <span style={{ fontSize: 9, fontWeight: 800, textTransform: 'uppercase', color: '#10b981', letterSpacing: '0.1em' }}>Ativo</span>
                </div>
              </div>
            </div>

            {/* Botão de Fechar Dinâmico */}
            <button
              className={`${isCardDark ? 'btn-card-dark' : 'btn-card-light'} w-full rounded-2xl font-black uppercase mt-1`}
              style={{ height: 52, fontSize: 10, letterSpacing: '0.14em' }}
              onClick={() => setIsValidateModalOpen(false)}
            >
              Fechar
            </button>

          </div>
        </DialogContent>
      </Dialog>
    </Suspense>
  )
}