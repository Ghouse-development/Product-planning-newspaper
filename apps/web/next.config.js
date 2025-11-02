/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: [
    '@ghouse/core',
    '@ghouse/supakit',
    '@ghouse/ai',
    '@ghouse/ingest',
    '@ghouse/extract',
    '@ghouse/report',
  ],
  output: 'standalone',
  webpack: (config, { isServer }) => {
    if (isServer) {
      // Exclude problematic packages from webpack processing on server
      config.externals = [...(config.externals || []), 'undici', 'cheerio']
    }
    return config
  },
}

module.exports = nextConfig
