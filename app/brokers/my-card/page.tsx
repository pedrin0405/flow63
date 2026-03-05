"use client"

import { useState, useEffect, Suspense } from "react"
import { CreditCard, Menu, Download, Share2, ShieldCheck, Calendar, Star, Info, Plus } from "lucide-react"
import { Sidebar } from "@/components/central63/sidebar"
import { useToast } from "@/hooks/use-toast"
import { supabase } from "@/lib/supabase"
import Loading from "@/app/loading"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { getCardWithBenefits } from "@/app/actions/benefit-cards"

export default function MyBenefitCardPage() {
  const { toast } = useToast()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [activeTab, setActiveTab] = useState("my-card")
  const [card, setCard] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [user, setUser] = useState<any>(null)

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true)
      try {
        const { data: { user: authUser } } = await supabase.auth.getUser()
        if (authUser) {
          const { data: profile } = await supabase.from('profiles').select('*').eq('id', authUser.id).single()
          setUser(profile)
          
          const result = await getCardWithBenefits(authUser.id)
          if (result.success) {
            setCard(result.data)
          } else {
            console.error(result.error)
          }
        }
      } catch (error) {
        console.error(error)
      } finally {
        setIsLoading(false)
      }
    }
    loadData()
  }, [])

  const handleDownloadPass = async () => {
    toast({ title: "Processando", description: "Gerando seu cartão para Apple Wallet..." })
    window.location.href = `/api/apple-wallet/pass?id=${card?.id}`
  }

  if (isLoading) return <Loading />

  return (
    <Suspense fallback={<Loading />}>
      <div className="flex h-screen bg-background overflow-hidden font-sans text-foreground">
        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} activeTab={activeTab} onTabChange={setActiveTab} />
        
        <main className="flex-1 flex flex-col h-full overflow-hidden relative">
          <header className="w-full bg-card border-b border-border px-6 py-4 flex items-center justify-between shadow-sm z-20">
            <div className="flex items-center gap-4">
              <button className="lg:hidden p-2 text-muted-foreground hover:bg-accent rounded-lg" onClick={() => setSidebarOpen(true)}>
                <Menu />
              </button>
              <CreditCard className="text-primary hidden sm:block" />
              <h2 className="text-2xl font-bold text-foreground tracking-tight">Meu Cartão Digital</h2>
            </div>
          </header>

          <div className="flex-1 overflow-y-auto bg-background p-4 lg:p-8">
            <div className="max-w-md mx-auto space-y-8">
              {card ? (
                <>
                  {/* Visual do Cartão */}
                  <div className="relative group perspective-1000">
                    <div className="relative w-full aspect-[1.586/1] rounded-[2.5rem] bg-[#1c1c1e] p-8 shadow-2xl overflow-hidden border border-white/5 text-white transform transition-all duration-500 hover:rotate-y-6">
                      
                      {/* Efeito de Mesh Gradient no Background */}
                      <div className="absolute top-0 right-0 w-full h-full bg-gradient-to-br from-[#e91c74]/15 via-pink-500/[0.4] to-transparent opacity-80" />
                      
                      {/* Glows de Cor */}
                      <div className="absolute -top-32 -right-32 w-96 h-96 bg-[#e91c74]/20 rounded-full blur-[100px] animate-pulse duration-[4s]" />
                      <div className="absolute top-1/4 -left-12 w-48 h-48 bg-[#e91c74]/10 rounded-full blur-[60px]" />
                      
                      {/* Glows Brancos para contraste */}
                      <div className="absolute top-0 left-1/4 w-64 h-32 bg-white/[0.05] rounded-full blur-[50px] -rotate-45" />
                      <div className="absolute bottom-0 right-1/4 w-40 h-40 bg-white/[0.03] rounded-full blur-[40px]" />
                      
                      <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-blue-500/5 rounded-full blur-[80px]" />
                      
                      {/* Foto personalizada (Marca d'água super discreta) */}
                      {card.card_image_url && (
                        <img 
                          src={card.card_image_url} 
                          alt="Texture" 
                          className="absolute inset-0 w-full h-full object-cover opacity-[0.2] grayscale mix-blend-overlay blur-[0.1px]" 
                        />
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
                        <Badge className="bg-white/5 backdrop-blur-md text-white/70 border-white/10 rounded-full text-[9px] px-3 py-1 uppercase font-bold tracking-wider">
                          {card.status === 'ativo' ? 'Válido' : 'Inválido'}
                        </Badge>
                      </div>

                      {/* Info do Corretor */}
                      <div className="mt-14 relative z-10">
                        <p className="text-[9px] opacity-30 uppercase tracking-[0.4em] font-black mb-1">Membro do Club</p>
                        <h2 className="text-2xl font-bold tracking-tight uppercase truncate text-white/90 drop-shadow-sm">{user?.full_name}</h2>
                        
                        <div className="flex gap-8 mt-6">
                          <div>
                            <p className="text-[9px] opacity-30 uppercase tracking-[0.2em] font-black mb-1">Privilégio</p>
                            <p className="font-bold text-xs text-white/80">Nível {card.nivel_beneficio}</p>
                          </div>
                          <div>
                            <p className="text-[9px] opacity-30 uppercase tracking-[0.2em] font-black mb-1">Validade</p>
                            <p className="font-bold text-xs text-white/80">{new Date(card.data_validade).toLocaleDateString('pt-BR')}</p>
                          </div>
                        </div>
                      </div>

                      {/* QR Code - Ajustado para Legibilidade */}
                      <div className="absolute bottom-8 right-8 w-16 h-16 bg-white p-1.5 rounded-xl shadow-2xl flex items-center justify-center overflow-hidden border border-white/20">
                        <img 
                          src={`https://api.qrserver.com/v1/create-qr-code/?size=100x100&data=${card.id}&margin=0`} 
                          alt="QR Code" 
                          className="w-full h-full"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Ações */}
                  <div className="grid grid-cols-1 gap-4">
                    <Button 
                      onClick={handleDownloadPass}
                      className="w-full h-14 rounded-2xl bg-foreground hover:bg-foreground/90 text-background font-bold gap-3 shadow-xl transition-all active:scale-95"
                    >
                      <Download size={20} /> Adicionar ao Apple Wallet
                    </Button>
                    <div className="flex gap-4">
                      <Button variant="outline" className="flex-1 h-12 rounded-2xl font-bold gap-2 border-border bg-card">
                        <Share2 size={18} /> Compartilhar
                      </Button>
                      <Button variant="outline" className="flex-1 h-12 rounded-2xl font-bold gap-2 border-border bg-card">
                        <ShieldCheck size={18} /> Validar
                      </Button>
                    </div>
                  </div>

                  {/* Benefícios Disponíveis */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between px-1">
                      <h3 className="text-sm font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-[#e91c74]" /> Seus Benefícios
                      </h3>
                      <Badge variant="outline" className="rounded-full text-[10px] opacity-60 border-muted-foreground/20">{card.card_benefits?.length || 0} Ativos</Badge>
                    </div>
                    <div className="space-y-3">
                      {card.card_benefits?.length > 0 ? (
                        card.card_benefits.map((cb: any) => (
                          <Card key={cb.benefits.id} className="border-white/[0.05] bg-card/50 backdrop-blur-sm rounded-2xl overflow-hidden shadow-sm hover:border-[#e91c74]/30 transition-all group">
                            <CardContent className="p-4 flex items-center gap-4">
                              <div className="w-10 h-10 rounded-xl bg-white/[0.03] border border-white/[0.05] flex items-center justify-center text-muted-foreground group-hover:text-[#e91c74] transition-colors overflow-hidden">
                                {cb.benefits.image_url ? (
                                  <img src={cb.benefits.image_url} alt={cb.benefits.nome} className="w-full h-full object-cover opacity-60 group-hover:opacity-100 transition-opacity" />
                                ) : (
                                  <Star size={18} />
                                )}
                              </div>
                              <div className="flex-1">
                                <h4 className="font-bold text-sm text-foreground/90 group-hover:text-foreground transition-colors">{cb.benefits.nome}</h4>
                                <p className="text-[11px] text-muted-foreground line-clamp-1">{cb.benefits.descricao}</p>
                              </div>
                            </CardContent>
                          </Card>
                        ))
                      ) : (
                        <div className="text-center py-10 opacity-40 bg-accent/[0.02] rounded-[2rem] border border-dashed border-border/50">
                          <p className="text-xs font-medium">Nenhum benefício extra associado.</p>
                        </div>
                      )}
                    </div>
                  </div>
                </>
              ) : (
                <div className="py-24 text-center">
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
