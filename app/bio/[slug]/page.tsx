import { notFound } from "next/navigation";
import { Metadata } from "next";
import { supabase } from "@/lib/supabase";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  Instagram, 
  Linkedin, 
  Github, 
  Twitter, 
  Globe, 
  MessageCircle, 
  Mail
} from "lucide-react";
import BioClientContent from "@/components/central63/bio-client-content";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const { data: bioPage } = await supabase
    .from("bio_pages")
    .select("*")
    .eq("slug", slug)
    .single();

  if (!bioPage) return {};

  return {
    title: bioPage.seo?.title || bioPage.nome,
    description: bioPage.seo?.description || bioPage.bio,
    openGraph: {
      title: bioPage.seo?.title || bioPage.nome,
      description: bioPage.seo?.description || bioPage.bio,
      images: [bioPage.foto_url],
    }
  };
}

const socialIcons: Record<string, any> = {
  instagram: Instagram,
  linkedin: Linkedin,
  github: Github,
  twitter: Twitter,
  website: Globe,
  whatsapp: MessageCircle,
  email: Mail,
};

export default async function BioPublicPage({ 
  params,
  searchParams
}: { 
  params: Promise<{ slug: string }>,
  searchParams: Promise<{ isPreview?: string }>
}) {
  const { slug } = await params;
  const { isPreview } = await searchParams;
  const isPreviewMode = isPreview === "true";
  
  // Buscando os dados da página de bio no Supabase
  const { data: bioPage, error } = await supabase
    .from("bio_pages")
    .select("*")
    .eq("slug", slug)
    .single();

  if (error || !bioPage) {
    notFound();
  }

  const data = bioPage;

  if (isPreviewMode) {
    return <BioClientContent data={data} slug={slug} isPreview={true} />;
  }

  return (
    <main className="min-h-screen flex flex-col">
      {/* Conteúdo Dinâmico (Links, Leads, etc) */}
      <BioClientContent data={data} slug={slug} />
    </main>
  );
}
