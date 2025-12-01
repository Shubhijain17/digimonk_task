/** @type {import('next').NextConfig} */
const nextConfig = {
  // Allow external API calls
  async rewrites() {
    return []
  },
  // Expose server on network
  experimental: {
    serverActions: {
      allowedOrigins: ['*']
    }
  }
}

module.exports = nextConfig

