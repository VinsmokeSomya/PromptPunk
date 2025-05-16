/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  output: 'export',
  basePath: '/PromptPunk',
  assetPrefix: '/PromptPunk',
  images: {
    unoptimized: true,
  },
};

module.exports = nextConfig;
