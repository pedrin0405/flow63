"use client"

import { useState, useEffect, Suspense, useRef } from "react"
import {
  CreditCard, Menu, FileText, Camera, Loader2,
  Zap, ChevronRight, QrCode, ShieldCheck, Star, User
} from "lucide-react"
import { Sidebar } from "@/components/central63/sidebar"
import { useToast } from "@/hooks/use-toast"
import { supabase } from "@/lib/supabase"
import Loading from "@/app/loading"
import { getCardWithBenefits, updateCardSettings } from "@/app/actions/benefit-cards"
import { toPng } from "html-to-image"
import jsPDF from "jspdf"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Slider } from "@/components/ui/slider"
import { Input } from "@/components/ui/input"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"

/* ─────────────────────────────────────────────────────────────────────────────
   GLOBAL CSS — Apple Glass Light (visionOS / macOS Sonoma inspired)
───────────────────────────────────────────────────────────────────────────── */
const GLASS_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Instrument+Sans:ital,wght@0,400;0,500;0,600;0,700;1,700&family=montserrat:ital,wght@1,600;1,700&display=swap');

  :root {
    --pink:        #e91c74;
    --pink-glow:   rgba(233,28,116,0.22);
    --s1:          rgba(255,255,255,0.84);
    --s2:          rgba(255,255,255,0.66);
    --s3:          rgba(255,255,255,0.46);
    --b1:          rgba(255,255,255,0.95);
    --b2:          rgba(200,212,235,0.52);
    --b3:          rgba(185,198,225,0.34);
    --t1:          #11111a;
    --t2:          #3a3a58;
    --t3:          #7878a0;
    --t4:          #aaaac8;
    --sh-xs:       0 1px 3px rgba(70,90,150,0.07), 0 1px 2px rgba(70,90,150,0.04);
    --sh-sm:       0 4px 16px rgba(70,90,150,0.10), 0 1px 4px rgba(70,90,150,0.06), inset 0 1px 0 rgba(255,255,255,0.96);
    --sh-md:       0 10px 40px rgba(60,80,150,0.13), 0 2px 10px rgba(60,80,150,0.07), inset 0 1px 0 rgba(255,255,255,0.96);
    --sh-card:     0 60px 120px rgba(30,50,120,0.24), 0 20px 40px rgba(30,50,120,0.14), inset 0 1px 0 rgba(255,255,255,0.14);
  }

  .gf { font-family: 'Instrument Sans', -apple-system, sans-serif; color: var(--t1); }
  .gi { font-family: 'Montserrat', -apple-system, sans-serif; }

  /* Glass panels */
  .gp1 { background:var(--s1); backdrop-filter:blur(32px) saturate(200%) brightness(1.04); -webkit-backdrop-filter:blur(32px) saturate(200%) brightness(1.04); border:1px solid var(--b1); box-shadow:var(--sh-md); }
  .gp2 { background:var(--s2); backdrop-filter:blur(20px) saturate(180%); -webkit-backdrop-filter:blur(20px) saturate(180%); border:1px solid var(--b2); box-shadow:var(--sh-sm); }
  .gp3 { background:var(--s3); backdrop-filter:blur(14px) saturate(160%); -webkit-backdrop-filter:blur(14px) saturate(160%); border:1px solid var(--b3); box-shadow:var(--sh-xs); }

  /* Physical card */
  .gc {
    background: linear-gradient(148deg, #16161e 0%, #21212c 48%, #181822 100%);
    border:1px solid rgba(255,255,255,0.07);
    border-radius:2rem; overflow:hidden;
    box-shadow:var(--sh-card);
    transform-style:preserve-3d;
    transition:transform 0.9s cubic-bezier(0.23,1,0.32,1), box-shadow 0.9s;
  }
  .gc:hover {
    transform:perspective(1000px) rotateY(5deg) rotateX(2.5deg) scale(1.018);
    box-shadow:0 80px 160px rgba(30,50,120,0.32), 0 30px 60px rgba(30,50,120,0.18), inset 0 1px 0 rgba(255,255,255,0.13);
  }

  /* Specular sweep */
  @keyframes sweep {
    0%   { transform:translateX(-130%) skewX(-18deg); opacity:0; }
    8%   { opacity:1; }
    92%  { opacity:1; }
    100% { transform:translateX(330%) skewX(-18deg); opacity:0; }
  }
  .gsweep { position:absolute; inset:0; z-index:25; pointer-events:none; background:linear-gradient(100deg,transparent 12%,rgba(255,255,255,0.065) 50%,transparent 88%); animation:sweep 7s ease-in-out infinite; }

  /* Highlight pill */
  .gpill { display:inline-flex; align-items:center; padding:2px 9px; border-radius:20px; background:var(--pink); color:#fff; font-weight:800; font-size:9px; letter-spacing:0.05em; box-shadow:0 2px 10px var(--pink-glow); margin:0 3px; vertical-align:middle; }

  /* Benefit card */
  .gbc { background:rgba(255,255,255,0.74); backdrop-filter:blur(18px) saturate(180%); -webkit-backdrop-filter:blur(18px) saturate(180%); border:1px solid rgba(255,255,255,0.90); box-shadow:0 2px 12px rgba(70,90,160,0.08),0 1px 3px rgba(70,90,160,0.05),inset 0 1px 0 rgba(255,255,255,0.99); border-radius:1.5rem; overflow:hidden; display:flex; flex-direction:column; transition:transform 0.5s cubic-bezier(0.23,1,0.32,1),box-shadow 0.5s,border-color 0.3s; cursor:pointer; }
  .gbc:hover { transform:translateY(-7px) scale(1.012); box-shadow:0 24px 56px rgba(233,28,116,0.13),0 6px 22px rgba(70,90,160,0.10),inset 0 1px 0 #fff; border-color:rgba(233,28,116,0.28); }
  .gbc img { transition:transform 0.85s cubic-bezier(0.23,1,0.32,1); display:block; }
  .gbc:hover img { transform:scale(1.08); }

  /* Buttons */
  .gbtn1 { background:linear-gradient(148deg,#13131b,#1e1e2a); color:#fff; border:none; box-shadow:0 4px 18px rgba(18,18,32,0.24),0 1px 4px rgba(18,18,32,0.14),inset 0 1px 0 rgba(255,255,255,0.09); transition:background 0.3s,transform 0.2s,box-shadow 0.3s; cursor:pointer; display:flex; align-items:center; justify-content:center; gap:10px; }
  .gbtn1:hover { background:linear-gradient(148deg,#c8145a,#e91c74); box-shadow:0 8px 30px var(--pink-glow),0 2px 8px rgba(233,28,116,0.14),inset 0 1px 0 rgba(255,255,255,0.12); transform:translateY(-2px); }
  .gbtn1:active { transform:scale(0.97); }
  .gbtn1:disabled { opacity:0.5; cursor:not-allowed; }

  .gbtn2 { background:var(--s2); color:var(--t1); border:1px solid var(--b2); backdrop-filter:blur(12px); box-shadow:var(--sh-xs); transition:background 0.3s,transform 0.2s,box-shadow 0.3s,border-color 0.3s,color 0.3s; cursor:pointer; display:flex; align-items:center; justify-content:center; gap:9px; }
  .gbtn2:hover { background:linear-gradient(148deg,#c8145a,#e91c74); color:#fff; border-color:var(--pink); box-shadow:0 6px 22px var(--pink-glow); transform:translateY(-2px); }
  .gbtn2:active { transform:scale(0.97); }

  /* Scrollbar */
  .gscroll::-webkit-scrollbar { width:4px; }
  .gscroll::-webkit-scrollbar-track { background:transparent; }
  .gscroll::-webkit-scrollbar-thumb { background:rgba(90,110,180,0.16); border-radius:99px; }

  /* Pulse dot */
  @keyframes gdot { 0%,100%{opacity:.65;transform:scale(1);} 50%{opacity:1;transform:scale(1.55);} }
  .gdot { animation:gdot 2.2s ease-in-out infinite; }

  /* Fade-up stagger */
  @keyframes gup { from{opacity:0;transform:translateY(16px);} to{opacity:1;transform:translateY(0);} }
  .ganim { animation:gup 0.55s cubic-bezier(0.23,1,0.32,1) both; }

  /* Page in */
  @keyframes gpage { from{opacity:0;transform:translateY(8px);} to{opacity:1;transform:translateY(0);} }
  .gpagein { animation:gpage 0.6s cubic-bezier(0.23,1,0.32,1) both; }

  /* Noise grain */
  .gnoise::after { content:''; position:absolute; inset:0; border-radius:inherit; background-image:url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='1'/%3E%3C/svg%3E"); opacity:0.022; pointer-events:none; z-index:60; mix-blend-mode:overlay; }

  /* Customize dropdown */
  .gcustom { background:rgba(252,252,255,0.93) !important; backdrop-filter:blur(44px) saturate(210%) !important; -webkit-backdrop-filter:blur(44px) saturate(210%) !important; border:1px solid rgba(255,255,255,0.98) !important; box-shadow:0 24px 72px rgba(50,70,150,0.18),0 6px 22px rgba(50,70,150,0.10),inset 0 1px 0 #fff !important; }

  /* Modal */
  .gmodal { background:rgba(250,251,255,0.95) !important; backdrop-filter:blur(52px) saturate(220%) !important; -webkit-backdrop-filter:blur(52px) saturate(220%) !important; border:1px solid rgba(255,255,255,0.99) !important; box-shadow:0 40px 100px rgba(50,70,160,0.22),0 10px 36px rgba(50,70,160,0.12),inset 0 1px 0 #fff !important; }
`

/* ── Highlight Values ── */
const HighlightValue = ({ text }: { text: string }) => {
  if (!text) return null
  const parts = text.split(/(\d+%|OFF|VIP|GRÁTIS|DESCONTO|CORTESIA)/gi)
  return (
    <>
      {parts.map((part, i) =>
        /(\d+%|OFF|VIP|GRÁTIS|DESCONTO|CORTESIA)/i.test(part)
          ? <span key={i} className="gpill">{part}</span>
          : part
      )}
    </>
  )
}

/* ─────────────────────────────────────────────────────────────────────────────
   PAGE
───────────────────────────────────────────────────────────────────────────── */
export default function MyBenefitCardPage() {
  const { toast } = useToast()
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

  const loadData = async () => {
    setIsLoading(true)
    try {
      const { data: { user: authUser } } = await supabase.auth.getUser()
      if (authUser) {
        const { data: profile } = await supabase.from("profiles").select("*").eq("id", authUser.id).single()
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
    } catch (e) {
      console.error(e)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => { loadData() }, [])

  useEffect(() => {
    if (!card || !hasLoadedSettings) return
    const t = setTimeout(async () => {
      await updateCardSettings(card.id, {
        card_image_pos_x: imagePos.x,
        card_image_pos_y: imagePos.y,
        card_image_zoom: imageZoom,
        card_image_opacity: imageOpacity,
        card_display_name: cardName,
      })
    }, 1000)
    return () => clearTimeout(t)
  }, [imagePos, imageZoom, imageOpacity, cardName, card, hasLoadedSettings])

  const handleUploadImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !card) return
    setIsUploading(true)
    try {
      const ext = file.name.split(".").pop()
      const filePath = `benefit-cards/user-card-${card.id}-${Math.random().toString(36).substring(2)}.${ext}`
      const { error: upErr } = await supabase.storage.from("user-uploads").upload(filePath, file)
      if (upErr) throw upErr
      const { data: { publicUrl } } = supabase.storage.from("user-uploads").getPublicUrl(filePath)
      const res = await updateCardSettings(card.id, { card_image_url: publicUrl })
      if (res.success) {
        toast({ title: "Foto atualizada" })
        setCard({ ...card, card_image_url: publicUrl })
      } else {
        throw new Error(res.error)
      }
    } catch (err: any) {
      toast({ title: "Erro no upload", description: err.message, variant: "destructive" })
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
        toast({ title: "Foto removida" })
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
      const dataUrl = await toPng(cardRef.current, {
        cacheBust: true,
        pixelRatio: 3,
        style: { borderRadius: "0" },
      })
      const pdf = new jsPDF({ orientation: "landscape", unit: "mm", format: [85.6, 54] })
      pdf.addImage(dataUrl, "PNG", 0, 0, 85.6, 54)
      pdf.save(`ticket-central63-${user?.full_name?.split(" ")[0] || "membro"}.pdf`)
      toast({ title: "PDF gerado!" })
    } catch {
      toast({ title: "Erro", description: "Falha ao gerar PDF.", variant: "destructive" })
    } finally {
      setIsExporting(false)
    }
  }

  if (isLoading && !card) return <Loading />

  const BG = "radial-gradient(ellipse 90% 70% at 12% 4%, rgba(205,222,255,0.72) 0%, transparent 52%), radial-gradient(ellipse 70% 65% at 88% 92%, rgba(255,205,232,0.62) 0%, transparent 50%), radial-gradient(ellipse 55% 55% at 52% 48%, rgba(228,238,255,0.50) 0%, transparent 55%), radial-gradient(ellipse 42% 42% at 28% 82%, rgba(215,245,232,0.42) 0%, transparent 50%), linear-gradient(158deg, #ecf1fc 0%, #f4f0fb 45%, #edf4ff 100%)"

  return (
    <Suspense fallback={<Loading />}>
      <style>{GLASS_CSS}</style>

      <div className="gf" style={{ display: "flex", height: "100vh", overflow: "hidden", background: BG, backgroundColor: "#ecf1fc" }}>

        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} activeTab={activeTab} onTabChange={setActiveTab} />

        <main style={{ flex: 1, display: "flex", flexDirection: "column", height: "100%", overflow: "hidden", borderLeft: "1px solid rgba(195,210,240,0.38)" }}>

          {/* ── Header ── */}
          <header className="gp1 gnoise" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "13px 28px", position: "relative", zIndex: 30, borderRadius: 0, borderLeft: "none", borderTop: "none", borderRight: "none", borderBottom: "1px solid rgba(195,210,240,0.42)" }}>

            <div style={{ display: "flex", alignItems: "center", gap: 13 }}>
              <button
                className="lg:hidden gp3"
                onClick={() => setSidebarOpen(true)}
                style={{ padding: 9, borderRadius: 12, cursor: "pointer", border: "none", background: "none" }}
              >
                <Menu size={18} color="var(--t2)" />
              </button>

              <div className="gp2 gnoise" style={{ display: "flex", alignItems: "center", gap: 11, padding: "7px 16px 7px 9px", borderRadius: 17, position: "relative" }}>
                <div style={{ width: 33, height: 33, borderRadius: 10, flexShrink: 0, background: "linear-gradient(148deg, #15151e, #20202c)", boxShadow: "0 3px 10px rgba(18,18,36,0.28), inset 0 1px 0 rgba(255,255,255,0.09)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <CreditCard size={14} color="white" />
                </div>
                <div>
                  <div className="gi" style={{ fontSize: 14, fontWeight: 700, fontStyle: "italic", letterSpacing: "-0.01em", color: "var(--t1)", lineHeight: 1.1 }}>Club Casa63+</div>
                  <div style={{ fontSize: 9, fontWeight: 600, letterSpacing: "0.20em", textTransform: "uppercase", color: "var(--t4)", marginTop: 2 }}>Member Portal</div>
                </div>
              </div>
            </div>

            <div className="gp3" style={{ display: "flex", alignItems: "center", gap: 8, padding: "7px 14px", borderRadius: 99 }}>
              <span className="gdot" style={{ display: "block", width: 7, height: 7, borderRadius: 99, background: "#e91c74", boxShadow: "0 0 8px rgba(233,28,116,0.55)", flexShrink: 0 }} />
              <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.16em", textTransform: "uppercase", color: "var(--t2)" }}>Sistema Ativo</span>
            </div>
          </header>

          {/* ── Body ── */}
          <div className="gscroll gpagein" style={{ flex: 1, overflowY: "auto", padding: "36px 28px 80px" }}>
            <div style={{ maxWidth: 1380, margin: "0 auto" }}>

              {card ? (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(12, 1fr)", gap: "2rem", alignItems: "start" }}>

                  {/* ── LEFT COLUMN ── */}
                  <div className="lg:sticky lg:top-0" style={{ gridColumn: "span 5", display: "flex", flexDirection: "column", gap: 20 }}>

                    {/* Card + ambient */}
                    <div style={{ position: "relative" }}>
                      <div style={{ position: "absolute", inset: -56, borderRadius: "50%", pointerEvents: "none", zIndex: 0, background: "radial-gradient(ellipse at 65% 30%, rgba(233,28,116,0.16) 0%, transparent 62%)", filter: "blur(28px)" }} />
                      <div style={{ position: "absolute", inset: -40, borderRadius: "50%", pointerEvents: "none", zIndex: 0, background: "radial-gradient(ellipse at 28% 72%, rgba(90,110,255,0.09) 0%, transparent 58%)", filter: "blur(22px)" }} />

                      <div ref={cardRef} className="gc" style={{ aspectRatio: "1.586/1", position: "relative", color: "white", zIndex: 1 }}>

                        {/* Layers */}
                        <div style={{ position: "absolute", inset: 0, zIndex: 1, pointerEvents: "none", background: "repeating-linear-gradient(82deg, transparent, transparent 2px, rgba(255,255,255,0.011) 2px, rgba(255,255,255,0.011) 3px)" }} />
                        <div style={{ position: "absolute", inset: 0, zIndex: 2, pointerEvents: "none", background: "radial-gradient(ellipse at 88% 0%, rgba(233,28,116,0.40) 0%, transparent 50%), radial-gradient(ellipse at 12% 100%, rgba(233,28,116,0.17) 0%, transparent 44%)" }} />
                        <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 1, zIndex: 3, pointerEvents: "none", background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.30) 28%, rgba(255,255,255,0.15) 72%, transparent)" }} />
                        <div className="gsweep" />

                        {card.card_image_url && (
                          <div style={{ position: "absolute", inset: 0, zIndex: 0, pointerEvents: "none" }}>
                            <img
                              src={card.card_image_url}
                              alt=""
                              style={{
                                position: "absolute",
                                left: `${imagePos.x}%`,
                                top: `${imagePos.y}%`,
                                transform: `translate(-50%,-50%) scale(${imageZoom})`,
                                opacity: imageOpacity,
                                width: "100%",
                                height: "100%",
                                objectFit: "cover",
                                filter: "grayscale(1)",
                                mixBlendMode: "overlay",
                              }}
                            />
                            <div style={{ position: "absolute", inset: 0, background: "linear-gradient(100deg, rgba(16,16,22,0.90) 0%, rgba(16,16,22,0.28) 60%, transparent 100%)" }} />
                          </div>
                        )}

                        {/* Card content */}
                        <div style={{ position: "relative", zIndex: 10, display: "flex", flexDirection: "column", justifyContent: "space-between", height: "100%", padding: "26px 26px 22px" }}>

                          {/* Top */}
                          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                              <div style={{ width: 42, height: 42, borderRadius: 13, flexShrink: 0, background: "rgba(255,255,255,0.07)", backdropFilter: "blur(10px)", border: "1px solid rgba(255,255,255,0.13)", boxShadow: "inset 0 1px 0 rgba(255,255,255,0.12)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                                <div style={{ width: 21, height: 21, backgroundColor: "#e91c74", maskImage: "url(/icon.svg)", WebkitMaskImage: "url(/icon.svg)", maskRepeat: "no-repeat", WebkitMaskRepeat: "no-repeat", maskSize: "contain", WebkitMaskSize: "contain", maskPosition: "center", WebkitMaskPosition: "center" }} />
                              </div>
                              <div>
                                <div className="gi" style={{ fontWeight: 700, fontSize: 15, fontStyle: "italic", textTransform: "uppercase", letterSpacing: "-0.01em", lineHeight: 1 }}>Club Casa63+</div>
                                <div style={{ fontSize: 9, fontWeight: 600, letterSpacing: "0.24em", textTransform: "uppercase", opacity: 0.36, marginTop: 4 }}>Exclusivo</div>
                              </div>
                            </div>

                            {/* Customize trigger */}
                            <DropdownMenu open={menuOpen} onOpenChange={setMenuOpen}>
                              <DropdownMenuTrigger asChild>
                                <button
                                  style={{ display: "flex", alignItems: "center", gap: 6, padding: "5px 13px", borderRadius: 99, background: "rgba(255,255,255,0.10)", backdropFilter: "blur(12px)", border: "1px solid rgba(255,255,255,0.14)", color: "white", cursor: "pointer", fontSize: 9, fontWeight: 800, letterSpacing: "0.14em", textTransform: "uppercase" }}
                                  onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(233,28,116,0.85)"; e.currentTarget.style.borderColor = "rgba(233,28,116,0.7)" }}
                                  onMouseLeave={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.10)"; e.currentTarget.style.borderColor = "rgba(255,255,255,0.14)" }}
                                >
                                  <span className="gdot" style={{ display: "inline-block", width: 5, height: 5, borderRadius: 99, background: "#e91c74", boxShadow: "0 0 6px rgba(233,28,116,0.9)" }} />
                                  VÁLIDO
                                </button>
                              </DropdownMenuTrigger>

                              <DropdownMenuContent
                                side="right"
                                sideOffset={66}
                                align="center"
                                className="gcustom"
                                style={{ borderRadius: "2rem", border: "none", padding: "28px", width: 288 }}
                              >
                                <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
                                  <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: "0.18em", textTransform: "uppercase", color: "var(--t4)", borderBottom: "1px solid rgba(0,0,0,0.06)", paddingBottom: 12 }}>
                                    Personalizar Cartão
                                  </div>

                                  <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                                    <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 10, fontWeight: 700, color: "var(--t3)" }}>
                                      <User size={11} /> Nome Impresso
                                    </label>
                                    <Input
                                      value={cardName}
                                      onChange={(e) => setCardName(e.target.value)}
                                      placeholder="Nome no cartão"
                                      style={{ height: 44, borderRadius: 12, background: "rgba(0,0,0,0.035)", border: "1px solid rgba(0,0,0,0.07)", fontWeight: 600, fontSize: 13 }}
                                    />
                                  </div>

                                  {([
                                    { label: "Posição X", value: [imagePos.x], min: 0, max: 100, step: 1, display: `${imagePos.x.toFixed(0)}%`, onChange: ([v]: number[]) => setImagePos((p) => ({ ...p, x: v })) },
                                    { label: "Posição Y", value: [imagePos.y], min: 0, max: 100, step: 1, display: `${imagePos.y.toFixed(0)}%`, onChange: ([v]: number[]) => setImagePos((p) => ({ ...p, y: v })) },
                                    { label: "Zoom", value: [imageZoom], min: 1, max: 3, step: 0.01, display: `${(imageZoom * 100).toFixed(0)}%`, onChange: ([v]: number[]) => setImageZoom(v) },
                                  ] as const).map(({ label, value, min, max, step, display, onChange }) => (
                                    <div key={label} style={{ display: "flex", flexDirection: "column", gap: 7 }}>
                                      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10, fontWeight: 700, color: "var(--t3)" }}>
                                        <span>{label}</span>
                                        <span style={{ color: "#e91c74" }}>{display}</span>
                                      </div>
                                      <Slider value={[...value]} min={min} max={max} step={step} onValueChange={onChange} />
                                    </div>
                                  ))}

                                  <div style={{ display: "flex", flexDirection: "column", gap: 8, paddingTop: 4 }}>
                                    <button
                                      className="gbtn2"
                                      onClick={() => document.getElementById("card-photo-upload")?.click()}
                                      style={{ width: "100%", height: 44, borderRadius: 12, fontSize: 11, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase" }}
                                    >
                                      <Camera size={14} /> Trocar Foto
                                    </button>
                                    {card.card_image_url && (
                                      <button
                                        onClick={removeImage}
                                        style={{ background: "none", border: "none", color: "#e91c74", fontSize: 10, fontWeight: 800, letterSpacing: "0.10em", textTransform: "uppercase", cursor: "pointer", padding: "6px 0" }}
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

                          {/* Bottom */}
                          <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", pointerEvents: "none" }}>
                            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                              <div>
                                <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.4em", textTransform: "uppercase", opacity: 0.34, marginBottom: 6 }}>Membro do Club</div>
                                <div className="gi" style={{ fontSize: 20, fontWeight: 700, textTransform: "uppercase", letterSpacing: "-0.01em", maxWidth: 226, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                  {cardName}
                                </div>
                              </div>
                              <div style={{ display: "flex", gap: 28 }}>
                                {[{ l: "Level", v: card.nivel_beneficio }, { l: "Validade", v: new Date(card.data_validade).toLocaleDateString("pt-BR") }].map(({ l, v }) => (
                                  <div key={l}>
                                    <div style={{ fontSize: 8, fontWeight: 700, letterSpacing: "0.2em", textTransform: "uppercase", opacity: 0.34, marginBottom: 4 }}>{l}</div>
                                    <div style={{ fontSize: 12, fontWeight: 700, opacity: 0.88 }}>{v}</div>
                                  </div>
                                ))}
                              </div>
                            </div>
                            <div style={{ width: 64, height: 64, background: "white", borderRadius: 14, padding: 5, boxShadow: "0 4px 18px rgba(0,0,0,0.28)", border: "1px solid rgba(255,255,255,0.22)", overflow: "hidden" }}>
                              <img src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${card.id}&margin=10`} alt="QR" style={{ width: "100%", height: "100%", filter: "grayscale(1)", display: "block" }} />
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Action buttons */}
                    <div style={{ display: "flex", gap: 10 }}>
                      <button
                        className="gbtn1"
                        onClick={handleDownloadPDF}
                        disabled={isExporting}
                        style={{ flex: 2, height: 52, borderRadius: 16, fontSize: 10, fontWeight: 800, letterSpacing: "0.12em", textTransform: "uppercase" }}
                      >
                        {isExporting ? <Loader2 size={15} className="animate-spin" /> : <FileText size={15} />}
                        Obter Passe (PDF)
                      </button>
                      <button
                        className="gbtn2"
                        onClick={() => setIsValidateModalOpen(true)}
                        style={{ flex: 1, height: 52, borderRadius: 16, fontSize: 10, fontWeight: 800, letterSpacing: "0.12em", textTransform: "uppercase" }}
                      >
                        <QrCode size={15} /> Validar
                      </button>
                    </div>

                    {/* Info strip */}
                    <div className="gp2 gnoise" style={{ display: "flex", alignItems: "center", gap: 14, padding: "14px 18px", borderRadius: 18, position: "relative" }}>
                      <div style={{ width: 36, height: 36, borderRadius: 11, flexShrink: 0, background: "linear-gradient(135deg, rgba(233,28,116,0.11), rgba(233,28,116,0.05))", border: "1px solid rgba(233,28,116,0.17)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <ShieldCheck size={15} color="#e91c74" />
                      </div>
                      <div>
                        <div style={{ fontSize: 12, fontWeight: 700, color: "var(--t1)", letterSpacing: "-0.01em" }}>Cartão verificado e ativo</div>
                        <div style={{ fontSize: 10, fontWeight: 500, color: "var(--t3)", marginTop: 2, lineHeight: 1.45 }}>Suas vantagens estão liberadas automaticamente.</div>
                      </div>
                    </div>
                  </div>

                  {/* ── RIGHT COLUMN ── */}
                  <div style={{ gridColumn: "span 7", display: "flex", flexDirection: "column", gap: 20 }}>

                    {/* Section header */}
                    <div className="gp1 gnoise" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 22px", borderRadius: 20, position: "relative" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                        <div style={{ width: 42, height: 42, borderRadius: 13, flexShrink: 0, background: "linear-gradient(135deg, rgba(233,28,116,0.11), rgba(233,28,116,0.05))", border: "1px solid rgba(233,28,116,0.16)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                          <Zap size={18} fill="#e91c74" color="#e91c74" />
                        </div>
                        <div>
                          <div className="gi" style={{ fontSize: 20, fontWeight: 700, fontStyle: "italic", letterSpacing: "-0.02em", color: "var(--t1)" }}>Vantagens Ativas</div>
                          <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.22em", textTransform: "uppercase", color: "var(--t4)", marginTop: 2 }}>Curadoria Club Casa63+</div>
                        </div>
                      </div>
                      <div style={{ padding: "5px 14px", borderRadius: 99, background: "linear-gradient(148deg, #13131b, #1e1e2a)", color: "#fff", fontSize: 10, fontWeight: 800, letterSpacing: "0.08em", boxShadow: "0 3px 12px rgba(18,18,36,0.22), inset 0 1px 0 rgba(255,255,255,0.09)" }}>
                        {card.card_benefits?.length || 0} ITENS
                      </div>
                    </div>

                    {/* Benefits grid */}
                    <div className="gp2 gnoise" style={{ padding: 14, borderRadius: 28, position: "relative" }}>
                      {card.card_benefits?.length > 0 ? (
                        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 14 }}>
                          {card.card_benefits.map((cb: any, idx: number) => (
                            <div key={cb.benefits.id} className="gbc ganim" style={{ animationDelay: `${idx * 55}ms` }}>

                              <div style={{ position: "relative", width: "100%", aspectRatio: "16/10", overflow: "hidden", borderRadius: "1.5rem 1.5rem 0 0", flexShrink: 0 }}>
                                {cb.benefits.image_url
                                  ? <img src={cb.benefits.image_url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                                  : (
                                    <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", background: "linear-gradient(135deg, #eef0f8, #e8e8f3)" }}>
                                      <Star size={26} color="#c0c0d8" />
                                    </div>
                                  )
                                }
                                <div style={{ position: "absolute", top: 9, right: 9, background: "rgba(18,18,28,0.60)", backdropFilter: "blur(10px)", borderRadius: 99, padding: "3px 10px", color: "white", fontSize: 8, fontWeight: 800, letterSpacing: "0.10em", textTransform: "uppercase", border: "1px solid rgba(255,255,255,0.14)" }}>
                                  Nív {cb.benefits.nivel_minimo}+
                                </div>
                                <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(255,255,255,0.18) 0%, transparent 40%)", pointerEvents: "none" }} />
                              </div>

                              <div style={{ display: "flex", flexDirection: "column", gap: 5, flex: 1, padding: "14px 16px" }}>
                                <div style={{ fontSize: 12, fontWeight: 800, letterSpacing: "-0.01em", textTransform: "uppercase", lineHeight: 1.25, color: "var(--t1)" }}>
                                  {cb.benefits.nome}
                                </div>
                                <div style={{ fontSize: 11, fontWeight: 500, color: "var(--t3)", lineHeight: 1.55, flex: 1 }}>
                                  <HighlightValue text={cb.benefits.descricao} />
                                </div>
                              </div>

                              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 16px", borderTop: "1px solid rgba(175,190,225,0.20)" }}>
                                <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                                  <span className="gdot" style={{ display: "block", width: 6, height: 6, borderRadius: 99, background: "#e91c74", boxShadow: "0 0 6px rgba(233,28,116,0.62)" }} />
                                  <span style={{ fontSize: 9, fontWeight: 800, letterSpacing: "0.14em", textTransform: "uppercase", color: "#e91c74" }}>Ativado</span>
                                </div>
                                <ChevronRight size={13} color="var(--t4)" style={{ opacity: 0.5 }} />
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 14, padding: "80px 0", opacity: 0.22, textAlign: "center" }}>
                          <Zap size={34} color="var(--t3)" />
                          <p style={{ fontSize: 11, fontWeight: 800, letterSpacing: "0.20em", textTransform: "uppercase", color: "var(--t3)" }}>Nenhuma vantagem ativa</p>
                        </div>
                      )}
                    </div>
                  </div>

                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 28, padding: "100px 0", textAlign: "center" }}>
                  <div className="gp1" style={{ width: 96, height: 96, borderRadius: 28, display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <CreditCard size={34} style={{ opacity: 0.12, color: "var(--t1)" }} />
                  </div>
                  <div>
                    <div className="gi" style={{ fontSize: 22, fontWeight: 700, fontStyle: "italic", textTransform: "uppercase", letterSpacing: "-0.02em", color: "var(--t1)", marginBottom: 10 }}>Cartão não identificado</div>
                    <p style={{ fontSize: 13, color: "var(--t3)", maxWidth: 320, margin: "0 auto", lineHeight: 1.6 }}>Entre em contato com o suporte para vincular seu benefício.</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </main>
      </div>

      {/* ── Validation Modal ── */}
      <Dialog open={isValidateModalOpen} onOpenChange={setIsValidateModalOpen}>
        <DialogContent className="gmodal gnoise" style={{ width: "90vw", maxWidth: 420, padding: 0, overflow: "hidden", borderRadius: "3rem", border: "none", position: "relative" }}>
          <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 200, zIndex: 0, pointerEvents: "none", background: "radial-gradient(ellipse at 50% 0%, rgba(233,28,116,0.09) 0%, transparent 68%)" }} />

          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 26, padding: "44px 36px", position: "relative", zIndex: 1, textAlign: "center" }}>

            <div style={{ width: 68, height: 68, borderRadius: 22, background: "linear-gradient(148deg, #cc1460, #e91c74)", boxShadow: "0 14px 40px rgba(233,28,116,0.38), 0 4px 12px rgba(233,28,116,0.22), inset 0 1px 0 rgba(255,255,255,0.20)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <QrCode size={28} color="white" />
            </div>

            <DialogHeader style={{ gap: 6 }}>
              <DialogTitle className="gi" style={{ fontSize: 22, fontWeight: 700, fontStyle: "italic", textTransform: "uppercase", letterSpacing: "-0.02em", color: "var(--t1)" }}>
                Validação Club
              </DialogTitle>
              <DialogDescription style={{ fontSize: 13, fontWeight: 500, color: "var(--t3)" }}>
                Apresente este código para resgate.
              </DialogDescription>
            </DialogHeader>

            <div
              style={{ background: "white", padding: 14, borderRadius: "2rem", boxShadow: "0 8px 30px rgba(50,70,160,0.11), 0 2px 8px rgba(50,70,160,0.06)", border: "1px solid rgba(195,210,240,0.50)", transition: "transform 0.4s cubic-bezier(0.23,1,0.32,1)" }}
              onMouseEnter={(e) => { e.currentTarget.style.transform = "scale(1.04)" }}
              onMouseLeave={(e) => { e.currentTarget.style.transform = "scale(1)" }}
            >
              <img src={`https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${card?.id}&margin=10`} alt="QR Code" style={{ width: 190, height: 190, filter: "grayscale(1)", display: "block" }} />
            </div>

            <div style={{ width: "100%", padding: "18px 22px", borderRadius: "1.6rem", background: "rgba(238,242,255,0.72)", backdropFilter: "blur(12px)", border: "1px solid rgba(200,212,240,0.48)", boxShadow: "inset 0 1px 0 rgba(255,255,255,0.92)" }}>
              <div style={{ fontSize: 9, fontWeight: 800, letterSpacing: "0.22em", textTransform: "uppercase", color: "var(--t4)", marginBottom: 7 }}>Membro VIP</div>
              <div className="gi" style={{ fontSize: 20, fontWeight: 700, fontStyle: "italic", letterSpacing: "-0.01em", color: "var(--t1)", lineHeight: 1.1 }}>{cardName}</div>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, marginTop: 10 }}>
                <span className="gdot" style={{ display: "inline-block", width: 7, height: 7, borderRadius: 99, background: "#e91c74", boxShadow: "0 0 8px rgba(233,28,116,0.62)" }} />
                <span style={{ fontSize: 10, fontWeight: 800, letterSpacing: "0.14em", textTransform: "uppercase", color: "#e91c74" }}>Level {card?.nivel_beneficio} • Ativo</span>
              </div>
            </div>

            <button
              className="gbtn1"
              onClick={() => setIsValidateModalOpen(false)}
              style={{ width: "100%", height: 52, borderRadius: 16, fontSize: 10, fontWeight: 800, letterSpacing: "0.14em", textTransform: "uppercase" }}
            >
              Fechar Validador
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </Suspense>
  )
}