/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  output: 'standalone',
  webpack: (config, { isServer }) => {
    if (isServer) {
      // Exclude undici from bundling - it's provided by Node.js runtime
      config.externals.push('undici')
    }
    return config
  },
}

module.exports = nextConfig
