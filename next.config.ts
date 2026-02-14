import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'pptijxnpyrswvqwcmjdb.supabase.co',
        port: '',
        pathname: '/storage/v1/object/public/**',
      },
    ],
  },
  async rewrites() {
    return [
      {
        source: '/table/:path*',
        destination: '/tablet/:path*',
      },
    ]
  },
}

export default nextConfig
