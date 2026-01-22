/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  allowedDevOrigins: [
    '364c7819-a940-4bfb-89b5-1b2dd09196e4-00-348clih29z99z.riker.replit.dev',
    '*.replit.dev',
    '*.repl.co',
  ],
}

export default nextConfig
