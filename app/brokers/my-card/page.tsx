"use client"

import { useState, useEffect, Suspense, useRef, useCallback } from "react"
import { CreditCard, Menu, Download, Share2, ShieldCheck, Calendar, Star, Info, Plus, FileText, Camera, Loader2, Trash2, Settings2, Maximize, Eye, MoveHorizontal, MoveVertical, Edit2, UploadCloud, User } from "lucide-react"
import { Sidebar } from "@/components/central63/sidebar"
import { useToast } from "@/hooks/use-toast"
import { supabase } from "@/lib/supabase"
import Loading from "@/app/loading"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { getCardWithBenefits, updateCardSettings } from "@/app/actions/benefit-cards"
import { toPng } from 'html-to-image'
import jsPDF from 'jspdf'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Slider } from "@/components/ui/slider"
import { Input } from "@/components/ui/input"

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
  
  // Estados para edição
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
        const { data: profile } = await supabase.from('profiles').select('*').eq('id', authUser.id).single()
        setUser(profile)
        
        const result = await getCardWithBenefits(authUser.id)
        if (result.success && result.data) {
          setCard(result.data)
          setImagePos({ 
            x: result.data.card_image_pos_x ?? 50, 
            y: result.data.card_image_pos_y ?? 50 
          })
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

  useEffect(() => {
    loadData()
  }, [])

  // Auto-save com Debounce
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

      const { error: uploadError } = await supabase.storage
        .from('user-uploads')
        .upload(filePath, file)

      if (uploadError) throw uploadError

      const { data: { publicUrl } } = supabase.storage
        .from('user-uploads')
        .getPublicUrl(filePath)

      const res = await updateCardSettings(card.id, { card_image_url: publicUrl })
      if (res.success) {
        toast({ title: "Sucesso", description: "Foto do cartão atualizada." })
        setCard({ ...card, card_image_url: publicUrl })
      } else {
        throw new Error(res.error)
      }
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
      const dataUrl = await toPng(cardRef.current, { 
        cacheBust: true,
        pixelRatio: 3,
        style: {
          borderRadius: '0',
        }
      })
      
      const pdf = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: [85.6, 54]
      })
      
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

  return (
    <Suspense fallback={<Loading />}>
      <div className="flex h-screen bg-background overflow-hidden font-sans text-foreground">
        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} activeTab={activeTab} onTabChange={setActiveTab} />
        
        <main className="flex-1 flex flex-col h-full overflow-hidden relative">
          <header className="w-full bg-card border-b border-border px-6 py-3 flex items-center justify-between shadow-sm z-20">
            <div className="flex items-center gap-4">
              <button className="lg:hidden p-2 text-muted-foreground hover:bg-accent rounded-lg" onClick={() => setSidebarOpen(true)}>
                <Menu />
              </button>
              <CreditCard className="text-primary w-5 h-5 hidden sm:block" />
              <h2 className="text-xl font-bold text-foreground tracking-tight leading-none">Meu Cartão Digital</h2>
            </div>
          </header>

          <div className="flex-1 overflow-y-auto bg-background p-4 lg:p-6">
            <div className="max-w-md mx-auto space-y-8">
              {card ? (
                <>
                  {/* Visual do Cartão */}
                  <div className="relative group perspective-1000 w-full">
                    <div 
                      ref={cardRef}
                      className="relative w-full aspect-[1.586/1] rounded-[2.5rem] bg-[#1c1c1e] p-8 shadow-2xl overflow-hidden border border-white/5 text-white transform transition-all duration-500 hover:rotate-y-6"
                    >
                      
                      {/* Background Effects */}
                      <div className="absolute top-0 right-0 w-full h-full bg-gradient-to-br from-[#e91c74]/15 via-white/[0.03] to-transparent opacity-80 pointer-events-none" />
                      <div className="absolute -top-32 -right-32 w-96 h-96 bg-[#e91c74]/20 rounded-full blur-[100px] animate-pulse duration-[4s] pointer-events-none" />
                      <div className="absolute top-1/4 -left-12 w-48 h-48 bg-[#e91c74]/10 rounded-full blur-[60px] pointer-events-none" />
                      <div className="absolute top-0 left-1/4 w-64 h-32 bg-white/[0.06] rounded-full blur-[50px] -rotate-45 pointer-events-none" />
                      
                      {/* Foto personalizada */}
                      {card.card_image_url && (
                        <div className="absolute inset-0 z-0 select-none pointer-events-none">
                          <img 
                            src={card.card_image_url} 
                            alt="Background" 
                            style={{ 
                              left: `${imagePos.x}%`,
                              top: `${imagePos.y}%`,
                              transform: `translate(-50%, -50%) scale(${imageZoom})`,
                              opacity: imageOpacity
                            }}
                            className="absolute w-full h-full object-cover grayscale mix-blend-overlay transition-all duration-300" 
                          />
                          <div className="absolute inset-0 bg-gradient-to-r from-black via-black/30 to-transparent z-10" />
                        </div>
                      )}
                      
                      {/* Header do Cartão */}
                      <div className="flex justify-between items-start relative z-10">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-white/5 backdrop-blur-xl rounded-2xl flex items-center justify-center border border-white/10 shadow-inner">
                            <div 
                              className="w-5 h-5" 
                              style={{ 
                                backgroundColor: '#e91c74', 
                                maskImage: 'url(/icon.svg)', 
                                WebkitMaskImage: 'url(/icon.svg)',
                                maskRepeat: 'no-repeat', 
                                WebkitMaskRepeat: 'no-repeat',
                                maskSize: 'contain',
                                WebkitMaskSize: 'contain',
                                maskPosition: 'center',
                                WebkitMaskPosition: 'center'
                              }} 
                            />
                          </div>
                          <div>
                            <h1 className="font-black text-sm tracking-tighter uppercase italic text-white/90">
                              Club <span className="text-white">Casa63+</span>
                            </h1>
                            <div className="flex items-center gap-1.5">
                              <div className="w-1 h-1 rounded-full bg-[#e91c74]" />
                              <p className="text-[9px] opacity-40 font-bold uppercase tracking-[0.2em]">Benefits Plus</p>
                            </div>
                          </div>
                        </div>

                        {/* Selo Dinâmico / Botão de Edição */}
                        <div className="z-40">
                          <DropdownMenu open={menuOpen} onOpenChange={setMenuOpen}>
                            <DropdownMenuTrigger asChild>
                              <button className="relative transition-all duration-300 transform hover:scale-105 active:scale-95 group/edit min-w-[64px]">
                                <Badge className="bg-white/5 backdrop-blur-md text-white/70 border-white/10 rounded-full text-[9px] px-3 py-1 uppercase font-bold tracking-wider transition-all duration-300 w-full justify-center group-hover/edit:text-white/90 group-hover/edit:bg-white/10">
                                  <span className="group-hover/edit:hidden">
                                    {card.status === 'ativo' ? 'Válido' : 'Inválido'}
                                  </span>
                                  <span className="hidden group-hover/edit:flex items-center gap-1.5">
                                    <Edit2 size={8} /> EDITAR
                                  </span>
                                </Badge>
                              </button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent 
                              side="right" 
                              sideOffset={60} 
                              align="center"
                              className="w-64 rounded-[2rem] bg-[#1c1c1e]/98 backdrop-blur-2xl border-white/10 text-white pt-5 px-5 pb-3 shadow-2xl flex flex-col gap-4"
                            >
                              <div className="flex-1 flex flex-col gap-4">
                                <div className="flex items-center justify-between px-1">
                                  <p className="text-[10px] font-black uppercase tracking-widest opacity-40">Personalizar</p>
                                  {isUploading && <Loader2 size={12} className="animate-spin text-[#e91c74]" />}
                                </div>

                                {/* Edição de Nome */}
                                <div className="space-y-2">
                                  <div className="flex justify-between text-[9px] font-bold opacity-60 px-1">
                                    <span className="flex items-center gap-1.5"><User size={10} /> Nome no Cartão</span>
                                  </div>
                                  <Input 
                                    value={cardName} 
                                    onChange={(e) => setCardName(e.target.value)}
                                    className="h-9 bg-white/5 border-white/5 rounded-xl text-xs font-bold focus:ring-[#e91c74]/50"
                                    placeholder="Seu nome no cartão"
                                  />
                                </div>

                                {card.card_image_url ? (
                                  <div className="space-y-4 pt-2 border-t border-white/5">
                                    <div className="space-y-1.5 px-1">
                                      <div className="flex justify-between text-[9px] font-bold opacity-60">
                                        <span><MoveHorizontal size={10} className="inline mr-1" /> Horizontal</span>
                                        <span>{imagePos.x.toFixed(0)}%</span>
                                      </div>
                                      <Slider value={[imagePos.x]} min={0} max={100} step={1} onValueChange={([v]) => setImagePos(prev => ({ ...prev, x: v }))} />
                                    </div>

                                    <div className="space-y-1.5 px-1">
                                      <div className="flex justify-between text-[9px] font-bold opacity-60">
                                        <span><MoveVertical size={10} className="inline mr-1" /> Vertical</span>
                                        <span>{imagePos.y.toFixed(0)}%</span>
                                      </div>
                                      <Slider value={[imagePos.y]} min={0} max={100} step={1} onValueChange={([v]) => setImagePos(prev => ({ ...prev, y: v }))} />
                                    </div>

                                    <div className="space-y-1.5 px-1">
                                      <div className="flex justify-between text-[9px] font-bold opacity-60">
                                        <span><Maximize size={10} className="inline mr-1" /> Zoom</span>
                                        <span>{(imageZoom * 100).toFixed(0)}%</span>
                                      </div>
                                      <Slider value={[imageZoom]} min={1} max={3} step={0.01} onValueChange={([v]) => setImageZoom(v)} />
                                    </div>

                                    <div className="space-y-1.5 px-1">
                                      <div className="flex justify-between text-[9px] font-bold opacity-60">
                                        <span><Eye size={10} className="inline mr-1" /> Opacidade</span>
                                        <span>{(imageOpacity * 100).toFixed(0)}%</span>
                                      </div>
                                      <Slider value={[imageOpacity]} min={0.1} max={1} step={0.01} onValueChange={([v]) => setImageOpacity(v)} />
                                    </div>

                                    <Button 
                                      variant="outline" 
                                      size="sm"
                                      className="w-full rounded-xl border-white/5 bg-white/5 hover:bg-[#e91c74] hover:text-white h-9 text-[10px] font-bold uppercase tracking-wider mt-2"
                                      onClick={() => document.getElementById('card-photo-upload')?.click()}
                                    >
                                      <Camera size={12} className="mr-2" /> Trocar Foto
                                    </Button>
                                  </div>
                                ) : (
                                  <button 
                                    onClick={() => document.getElementById('card-photo-upload')?.click()}
                                    className="flex-1 flex flex-col items-center justify-center border-2 border-dashed border-[#e91c74]/20 hover:border-[#e91c74]/50 hover:bg-[#e91c74]/5 rounded-2xl p-4 transition-all group/upload"
                                  >
                                    <UploadCloud size={20} className="text-[#e91c74] mb-2" />
                                    <p className="text-[9px] text-center font-black uppercase tracking-widest text-[#e91c74]">Adicionar Foto</p>
                                  </button>
                                )}
                                <input id="card-photo-upload" type="file" className="hidden" accept="image/*" onChange={handleUploadImage} />
                              </div>

                              {card.card_image_url && (
                                <button onClick={removeImage} className="w-full text-[9px] text-white/30 hover:text-rose-500 transition-colors font-bold uppercase tracking-widest py-2 border-t border-white/5">
                                  Remover Foto
                                </button>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>

                      {/* Dados do Usuário no Cartão */}
                      <div className="mt-10 sm:mt-12 relative z-10 pointer-events-none">
                        <p className="text-[8px] opacity-30 uppercase tracking-[0.4em] font-black mb-1">Membro do Club</p>
                        <h2 className="text-xl sm:text-2xl font-bold tracking-tight uppercase truncate text-white/90 drop-shadow-sm">{cardName}</h2>
                        
                        <div className="flex gap-6 sm:gap-8 mt-4 sm:mt-5">
                          <div>
                            <p className="text-[8px] opacity-30 uppercase tracking-[0.2em] font-black mb-1">Nível</p>
                            <p className="font-bold text-[10px] text-white/80">{card.nivel_beneficio}</p>
                          </div>
                          <div>
                            <p className="text-[8px] opacity-30 uppercase tracking-[0.2em] font-black mb-1">Validade</p>
                            <p className="font-bold text-[10px] text-white/80">{new Date(card.data_validade).toLocaleDateString('pt-BR')}</p>
                          </div>
                        </div>
                      </div>

                      {/* QR Code */}
                      <div className="absolute bottom-6 right-6 w-14 h-14 sm:w-16 sm:h-16 bg-white p-1 rounded-xl shadow-2xl flex items-center justify-center overflow-hidden border border-white/20 pointer-events-none">
                        <img 
                          src={`https://api.qrserver.com/v1/create-qr-code/?size=100x100&data=${card.id}&margin=0`} 
                          alt="QR Code" 
                          className="w-full h-full"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Ações Inferiores (Sempre abaixo do cartão) */}
                  <div className="grid grid-cols-1 gap-3">
                    <Button 
                      onClick={handleDownloadPDF}
                      disabled={isExporting}
                      className="w-full h-12 rounded-2xl bg-black hover:bg-[#e91c74] text-white font-bold gap-3 shadow-xl transition-all active:scale-95 text-xs uppercase tracking-widest"
                    >
                      {isExporting ? <Loader2 className="animate-spin w-4 h-4" /> : <FileText size={18} />} Baixar Ticket PDF
                    </Button>
                    
                    <div className="flex gap-3">
                      <Button variant="outline" className="flex-1 h-11 rounded-2xl font-bold gap-2 border-border bg-card text-[10px] uppercase tracking-wider">
                        <Share2 size={16} /> Compartilhar
                      </Button>
                      <Button variant="outline" className="flex-1 h-11 rounded-2xl font-bold gap-2 border-border bg-card text-[10px] uppercase tracking-wider">
                        <ShieldCheck size={16} /> Validar
                      </Button>
                    </div>
                  </div>

                  {/* Benefícios */}
                  <div className="space-y-4 w-full">
                    <div className="flex items-center justify-between px-1">
                      <h3 className="text-xs font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-[#e91c74]" /> Meus Benefícios Ativos
                      </h3>
                      <Badge variant="outline" className="rounded-full text-[9px] opacity-60 border-muted-foreground/20">{card.card_benefits?.length || 0} Itens</Badge>
                    </div>
                    <div className="space-y-3">
                      {card.card_benefits?.length > 0 ? (
                        card.card_benefits.map((cb: any) => (
                          <Card key={cb.benefits.id} className="border-white/[0.05] bg-card/50 backdrop-blur-sm rounded-2xl overflow-hidden shadow-sm hover:border-[#e91c74]/30 transition-all group">
                            <CardContent className="p-3.5 flex items-center gap-4">
                              <div className="w-9 h-9 rounded-xl bg-white/[0.03] border border-white/[0.05] flex items-center justify-center text-muted-foreground group-hover:text-[#e91c74] transition-colors overflow-hidden">
                                {cb.benefits.image_url ? (
                                  <img src={cb.benefits.image_url} alt={cb.benefits.nome} className="w-full h-full object-cover opacity-60 group-hover:opacity-100 transition-opacity" />
                                ) : (
                                  <Star size={16} />
                                )}
                              </div>
                              <div className="flex-1 min-w-0">
                                <h4 className="font-bold text-xs text-foreground/90 group-hover:text-foreground transition-colors truncate uppercase">{cb.benefits.nome}</h4>
                                <p className="text-[10px] text-muted-foreground line-clamp-1 opacity-70">{cb.benefits.descricao}</p>
                              </div>
                            </CardContent>
                          </Card>
                        ))
                      ) : (
                        <div className="text-center py-12 opacity-40 bg-accent/[0.02] rounded-[2rem] border border-dashed border-border/50">
                          <p className="text-xs font-medium">Nenhum benefício extra associado.</p>
                        </div>
                      )}
                    </div>
                  </div>
                </>
              ) : (
                <div className="py-24 text-center w-full">
                  <CreditCard className="w-16 h-16 mx-auto mb-4 text-muted-foreground/30" />
                  <h3 className="text-xl font-bold mb-2">Cartão não encontrado</h3>
                  <p className="text-muted-foreground text-sm max-w-xs mx-auto">
                    Você ainda não possui um cartão de benefícios ativo. Entre em contato com a administração.
                  </p>
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
    </Suspense>
  )
}
