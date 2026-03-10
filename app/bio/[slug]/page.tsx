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

export default async function BioPublicPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  
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

  return (
    <main >

      {/* Redes Sociais */}
      <div className="flex gap-5 mb-10">
        {data.redes_sociais?.map((social: any, index: number) => {
          const Icon = socialIcons[social.platform.toLowerCase()] || Globe;
          return (
            <a 
              key={index} 
              href={social.url} 
              target="_blank" 
              rel="noopener noreferrer"
              className="hover:scale-125 transition-transform p-2 bg-white/10 rounded-full backdrop-blur-sm shadow-lg"
            >
              <Icon className="w-6 h-6" />
            </a>
          );
        })}
      </div>

      {/* Conteúdo Dinâmico (Links, Leads, etc) */}
      <BioClientContent data={data} slug={params.slug} />

      {/* Rodapé / Branding */}
      <footer className="mt-auto pt-20 pb-6 opacity-40 text-[10px] flex flex-col items-center gap-2">
        <div className="flex items-center gap-1 uppercase tracking-widest">
          <span>Desenvolvido por</span>
          <span className="font-black">Flow63</span>
        </div>
        <div className="flex items-center gap-3">
          <span>Privacidade</span>
          <span>•</span>
          <span>Termos</span>
        </div>
      </footer>
    </main>
  );
}
