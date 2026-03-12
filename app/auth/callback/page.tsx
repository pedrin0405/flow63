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
            .select('*')
            .eq('email', user.email)
            .maybeSingle()

          if (profileError) throw profileError

          // Caso 1: Usuário não existe na base (Acesso Externo via Google)
          if (!profile) {
            // Cria o perfil como 'pendente'
            const { error: insertError } = await supabase
              .from('profiles')
              .insert([{
                id: user.id,
                email: user.email,
                full_name: user.user_metadata?.full_name || user.user_metadata?.name || null,
                avatar_url: user.user_metadata?.avatar_url || user.user_metadata?.picture || null,
                role: 'Corretor', // Papel padrão inicial
                status: 'pendente', // Bloqueado até aprovação
                updated_at: new Date().toISOString()
              }])

            if (insertError) throw insertError

            // Notifica os gestores via tabela de sistema
            await supabase.from('system_notifications').insert([{
              type: 'pending_auth',
              title: 'Novo Acesso Pendente',
              message: `O usuário ${user.email} solicitou acesso via Google.`,
              user_id: user.id
            }])

            return router.push('/auth/pending')
          }

          // Caso 2: Usuário já existe, mas está com status pendente
          if (profile.status === 'pendente') {
            return router.push('/auth/pending')
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