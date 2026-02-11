"use client"

import { useState, useEffect, useCallback } from "react"
import { useParams } from "next/navigation"
import { CheckCircle2, AlertCircle, FileText, Calendar as CalendarIcon, MapPin, Clock, ShieldCheck } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Separator } from "@/components/ui/separator"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { supabase } from "@/lib/supabase"
import { useToast } from "@/hooks/use-toast"

export default function PublicFormPage() {
  const params = useParams()
  const formId = params.id as string
  const { toast } = useToast()

  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isValidId, setIsValidId] = useState(false)
  const [isCompleted, setIsCompleted] = useState(false)
  
  // Estado do Formulário
  const [formData, setFormData] = useState({
    nome: "",
    endereco: "",
    tipo: "",
    prazo: "",
    termo_1: false,
    termo_2: false,
    data_assinatura: new Date().toISOString().split('T')[0] // Data atual (YYYY-MM-DD)
  })

  // 1. Verificar se o ID existe e buscar dados iniciais
  const verifyFormId = useCallback(async () => {
    try {
      setIsLoading(true)
      
      // Busca na tabela de registro (reg_forms)
      const { data, error } = await supabase
        .from('reg_forms')
        .select('cliente_nome, status')
        .eq('id', formId)
        .single()

      if (error || !data) {
        setIsValidId(false)
        return
      }

      setIsValidId(true)
      
      // Se já estiver completado, bloqueia
      if (data.status === 'completed') {
        setIsCompleted(true)
      } else {
        // Pré-preenche o nome se disponível
        setFormData(prev => ({ ...prev, nome: data.cliente_nome || "" }))
      }

    } catch (error) {
      console.error("Erro ao verificar formulário:", error)
      setIsValidId(false)
    } finally {
      setIsLoading(false)
    }
  }, [formId])

  useEffect(() => {
    if (formId) {
      verifyFormId()
    }
  }, [formId, verifyFormId])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleCheckboxChange = (checked: boolean, name: string) => {
    setFormData(prev => ({ ...prev, [name]: checked }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.termo_1 || !formData.termo_2) {
      toast({
        title: "Atenção",
        description: "Você precisa aceitar todos os termos para continuar.",
        variant: "destructive"
      })
      return
    }

    setIsSubmitting(true)

    try {
      // Insere na tabela 'forms'
      const { error } = await supabase
        .from('forms')
        .insert([{
          id: formId, // Vincula ao mesmo ID
          nome: formData.nome,
          endereco: formData.endereco,
          tipo: formData.tipo,
          prazo: formData.prazo,
          termo_1: formData.termo_1,
          termo_2: formData.termo_2,
          data_assinatura: formData.data_assinatura
        }])

      if (error) throw error

      setIsCompleted(true)
      toast({
        title: "Sucesso!",
        description: "Formulário enviado com sucesso.",
      })

    } catch (error: any) {
      console.error("Erro ao enviar:", error)
      toast({
        title: "Erro ao enviar",
        description: "Ocorreu um erro ao salvar seus dados. Tente novamente.",
        variant: "destructive"
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  // --- Renderização de Estados de Carregamento/Erro ---

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-pulse flex flex-col items-center gap-4">
          <div className="h-12 w-12 rounded-full bg-primary/20"></div>
          <div className="h-4 w-48 bg-gray-200 rounded"></div>
        </div>
      </div>
    )
  }

  if (!isValidId) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <Card className="max-w-md w-full border-destructive/20 shadow-lg">
          <CardHeader className="text-center">
            <div className="mx-auto bg-destructive/10 p-4 rounded-full mb-4 w-fit">
              <AlertCircle size={48} className="text-destructive" />
            </div>
            <CardTitle className="text-xl font-black text-destructive">Formulário Não Encontrado</CardTitle>
            <CardDescription>
              O link que você acessou é inválido ou expirou. Por favor, entre em contato com o corretor responsável.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    )
  }

  if (isCompleted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-emerald-50/50 p-4">
        <Card className="max-w-md w-full border-emerald-200 shadow-xl bg-white">
          <CardHeader className="text-center pb-8 pt-10">
            <div className="mx-auto bg-emerald-100 p-4 rounded-full mb-6 w-fit animate-in zoom-in duration-500">
              <CheckCircle2 size={64} className="text-emerald-600" />
            </div>
            <CardTitle className="text-2xl font-black text-emerald-800 uppercase tracking-tight">
              Formulário Recebido!
            </CardTitle>
            <CardDescription className="text-emerald-600/80 font-medium mt-2">
              Seus dados foram registrados com sucesso em nosso sistema.
            </CardDescription>
          </CardHeader>
          <CardFooter className="justify-center pb-8">
            <Button variant="outline" className="border-emerald-200 text-emerald-700 hover:bg-emerald-50 font-bold" disabled>
              Atendimento Finalizado
            </Button>
          </CardFooter>
        </Card>
      </div>
    )
  }

  // --- Renderização do Formulário Principal ---

  return (
    <div className="min-h-screen bg-[#F8FAFC] py-8 px-4 flex justify-center">
      <Card className="max-w-2xl w-full border-none shadow-xl rounded-[2rem] overflow-hidden flex flex-col">
        {/* Cabeçalho Visual */}
        <div className="bg-primary/5 p-8 border-b border-primary/10">
          <div className="flex items-center gap-3 mb-2">
            <div className="bg-white p-2.5 rounded-xl shadow-sm">
              <FileText className="text-primary" size={24} />
            </div>
            <span className="font-bold text-xs uppercase tracking-widest text-primary/70 bg-primary/10 px-3 py-1 rounded-lg">
              Ficha de Cadastro
            </span>
          </div>
          <h1 className="text-2xl md:text-3xl font-black tracking-tight text-foreground">
            Formulário de Atendimento
          </h1>
          <p className="text-muted-foreground mt-2 font-medium">
            Preencha os dados abaixo para formalizar seu atendimento com a Central63.
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          <CardContent className="p-8 space-y-8">
            
            {/* Seção 1: Dados Pessoais */}
            <div className="space-y-6">
              <div className="flex items-center gap-2 pb-2 border-b">
                <ShieldCheck className="text-muted-foreground" size={18} />
                <h3 className="font-bold text-sm uppercase text-muted-foreground tracking-wide">
                  Dados do Cliente
                </h3>
              </div>

              <div className="grid gap-6">
                <div className="space-y-2">
                  <Label htmlFor="nome" className="font-bold text-gray-700">Nome Completo</Label>
                  <Input 
                    id="nome" 
                    name="nome"
                    placeholder="Seu nome completo" 
                    className="h-12 rounded-xl bg-gray-50 border-gray-200 focus:bg-white transition-all"
                    value={formData.nome}
                    onChange={handleInputChange}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="endereco" className="font-bold text-gray-700">Endereço</Label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
                    <Input 
                      id="endereco" 
                      name="endereco"
                      placeholder="Rua, Número, Bairro, Cidade - UF" 
                      className="pl-10 h-12 rounded-xl bg-gray-50 border-gray-200 focus:bg-white transition-all"
                      value={formData.endereco}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Seção 2: Detalhes do Negócio */}
            <div className="space-y-6">
              <div className="flex items-center gap-2 pb-2 border-b">
                <Clock className="text-muted-foreground" size={18} />
                <h3 className="font-bold text-sm uppercase text-muted-foreground tracking-wide">
                  Detalhes
                </h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="tipo" className="font-bold text-gray-700">Tipo de Imóvel/Serviço</Label>
                  <Input 
                    id="tipo" 
                    name="tipo"
                    placeholder="Ex: Apartamento, Consultoria..." 
                    className="h-12 rounded-xl bg-gray-50 border-gray-200 focus:bg-white transition-all"
                    value={formData.tipo}
                    onChange={handleInputChange}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="prazo" className="font-bold text-gray-700">Prazo Previsto</Label>
                  <Input 
                    id="prazo" 
                    name="prazo"
                    placeholder="Ex: 30 dias, Imediato..." 
                    className="h-12 rounded-xl bg-gray-50 border-gray-200 focus:bg-white transition-all"
                    value={formData.prazo}
                    onChange={handleInputChange}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="data_assinatura" className="font-bold text-gray-700">Data do Registro</Label>
                <div className="relative">
                  <CalendarIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
                  <Input 
                    id="data_assinatura" 
                    name="data_assinatura"
                    type="date"
                    className="pl-10 h-12 rounded-xl bg-gray-50 border-gray-200 focus:bg-white transition-all"
                    value={formData.data_assinatura}
                    onChange={handleInputChange}
                    required
                  />
                </div>
              </div>
            </div>

            {/* Seção 3: Termos */}
            <div className="bg-accent/30 rounded-2xl p-6 space-y-4 border border-accent/50">
              <h4 className="font-bold text-sm uppercase text-primary/80 mb-2">Termos e Condições</h4>
              
              <div className="flex items-start space-x-3 bg-white p-4 rounded-xl border border-border/50 shadow-sm">
                <Checkbox 
                  id="termo_1" 
                  checked={formData.termo_1}
                  onCheckedChange={(checked) => handleCheckboxChange(checked as boolean, "termo_1")}
                  className="mt-1"
                />
                <Label htmlFor="termo_1" className="text-sm font-medium leading-relaxed cursor-pointer">
                  Declaro que as informações fornecidas acima são verdadeiras e assumo total responsabilidade pela sua exatidão.
                </Label>
              </div>

              <div className="flex items-start space-x-3 bg-white p-4 rounded-xl border border-border/50 shadow-sm">
                <Checkbox 
                  id="termo_2" 
                  checked={formData.termo_2}
                  onCheckedChange={(checked) => handleCheckboxChange(checked as boolean, "termo_2")}
                  className="mt-1"
                />
                <Label htmlFor="termo_2" className="text-sm font-medium leading-relaxed cursor-pointer">
                  Concordo com a política de privacidade e autorizo o uso destes dados para fins de prestação de serviço imobiliário.
                </Label>
              </div>
            </div>

          </CardContent>
          
          <CardFooter className="p-8 pt-0 bg-gray-50/50 flex flex-col gap-4">
            <Separator className="mb-4" />
            <Button 
              type="submit" 
              className="w-full h-14 text-lg font-bold rounded-2xl bg-primary hover:bg-primary/90 shadow-xl shadow-primary/20 transition-all active:scale-[0.98]"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <span className="flex items-center gap-2">
                  <div className="h-4 w-4 border-2 border-white/50 border-t-white rounded-full animate-spin"/>
                  Enviando...
                </span>
              ) : (
                "Confirmar e Enviar Formulário"
              )}
            </Button>
            <p className="text-center text-xs text-muted-foreground font-medium">
              Este é um documento digital seguro. ID: <span className="font-mono bg-gray-200 px-1 rounded">{formId}</span>
            </p>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}