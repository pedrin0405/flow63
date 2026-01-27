"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

export default function AuthCallbackPage() {
  const router = useRouter()
  const [isVerifying, setIsVerifying] = useState(true)
  const [showErrorModal, setShowErrorModal] = useState(false)
  const [errorMessage, setErrorMessage] = useState("")

  useEffect(() => {
    const handleCallback = async () => {
      try {
        // O Supabase lida automaticamente com a troca do código pela sessão no cliente
        const { data: { user }, error: authError } = await supabase.auth.getUser()

        if (authError || !user) {
          setErrorMessage("Não foi possível autenticar sua conta. Tente novamente.")
          setShowErrorModal(true)
          setIsVerifying(false)
          return
        }

        if (user.email) {
          // Verifica se o e-mail do usuário existe na tabela 'profiles'
          const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('email')
            .eq('email', user.email)
            .maybeSingle()

          if (profileError || !profile) {
            // E-mail não autorizado: encerra a sessão e mostra o modal
            await supabase.auth.signOut()
            setErrorMessage("Seu e-mail não está cadastrado na nossa base de usuários autorizados. Entre em contato com o administrador.")
            setShowErrorModal(true)
            setIsVerifying(false)
            return
          }

          // Sucesso: Redireciona para o dashboard
          router.push("/")
        }
      } catch (err) {
        setErrorMessage("Ocorreu um erro inesperado na validação do seu perfil.")
        setShowErrorModal(true)
        setIsVerifying(false)
      }
    }

    handleCallback()
  }, [router])

  const handleCloseModal = () => {
    setShowErrorModal(false)
    router.push("/login")
  }

  return (
    <div className="flex h-screen w-full items-center justify-center bg-background">
      {isVerifying && (
        <div className="flex flex-col items-center gap-4">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
          <p className="text-sm text-muted-foreground">Validando e-mail e perfil...</p>
        </div>
      )}

      <AlertDialog open={showErrorModal} onOpenChange={setShowErrorModal}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Acesso Negado</AlertDialogTitle>
            <AlertDialogDescription>
              {errorMessage}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction onClick={handleCloseModal}>
              Voltar para o Login
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}