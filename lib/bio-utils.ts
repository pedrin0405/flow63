import { 
  Instagram, 
  Linkedin, 
  Github, 
  Youtube, 
  Globe, 
  Twitter,
  Facebook,
  Mail,
  Phone,
  Music,
  MessageCircle
} from "lucide-react";
import React from "react";

export const getSocialIcon = (url: string) => {
  const lowerUrl = url.toLowerCase();
  if (lowerUrl.includes("instagram.com")) return React.createElement(Instagram, { className: "w-5 h-5" });
  if (lowerUrl.includes("linkedin.com")) return React.createElement(Linkedin, { className: "w-5 h-5" });
  if (lowerUrl.includes("twitter.com") || lowerUrl.includes("x.com")) return React.createElement(Twitter, { className: "w-5 h-5" });
  if (lowerUrl.includes("facebook.com") || lowerUrl.includes("fb.com")) return React.createElement(Facebook, { className: "w-5 h-5" });
  if (lowerUrl.includes("github.com")) return React.createElement(Github, { className: "w-5 h-5" });
  if (lowerUrl.includes("youtube.com") || lowerUrl.includes("youtu.be")) return React.createElement(Youtube, { className: "w-5 h-5" });
  if (lowerUrl.includes("tiktok.com")) return React.createElement(Music, { className: "w-5 h-5" });
  if (lowerUrl.includes("wa.me") || lowerUrl.includes("whatsapp.com")) return React.createElement(MessageCircle, { className: "w-5 h-5" });
  if (lowerUrl.startsWith("mailto:")) return React.createElement(Mail, { className: "w-5 h-5" });
  if (lowerUrl.startsWith("tel:")) return React.createElement(Phone, { className: "w-5 h-5" });
  return React.createElement(Globe, { className: "w-5 h-5" });
};

export const getYouTubeEmbed = (url: string) => {
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=|shorts\/)([^#&?]*).*/;
  const match = url.match(regExp);
  const videoId = (match && match[2].length === 11) ? match[2] : null;
  return videoId ? `https://www.youtube.com/embed/${videoId}` : url;
};

export const getSpotifyEmbed = (url: string) => {
  try {
    const urlObj = new URL(url);
    if (urlObj.hostname.includes('spotify.com')) {
      return `https://open.spotify.com/embed${urlObj.pathname}?utm_source=generator`;
    }
  } catch (e) { return url; }
  return url;
};

export const socialDomains = [
  "instagram.com", 
  "linkedin.com", 
  "twitter.com", 
  "x.com", 
  "github.com", 
  "youtube.com", 
  "facebook.com", 
  "tiktok.com"
];

export const processLinks = (visibleLinks: any[]) => {
  const socialLinks = visibleLinks?.filter(link => 
    link.type !== "youtube" && 
    link.type !== "spotify" && 
    socialDomains.some(domain => link.url?.toLowerCase().includes(domain))
  ) || [];
  
  const regularLinks = visibleLinks?.filter(link => 
    link.type === "youtube" || 
    link.type === "spotify" || 
    !socialDomains.some(domain => link.url?.toLowerCase().includes(domain))
  ) || [];

  return { socialLinks, regularLinks };
};

export interface BioThemeProps {
  data: any;
  visibleLinks: any[];
  handleLinkClick: (link: any, index: number) => void;
  getAnimationProps: (type: string) => any;
  isPreview?: boolean;
}
