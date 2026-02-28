/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true, // Mantém sua configuração atual
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'www.casa63.com.br',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: '*.supabase.co', // Autoriza qualquer projeto do Supabase (Storage)
        port: '',
        pathname: '/**',
      },
    ],
  },
}

export default nextConfig