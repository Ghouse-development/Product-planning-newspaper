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
}

module.exports = nextConfig
