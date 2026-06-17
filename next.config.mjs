/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  output: "standalone",
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "cards.scryfall.io" },
      { protocol: "https", hostname: "c1.scryfall.com" },
      { protocol: "https", hostname: "c2.scryfall.com" },
      { protocol: "https", hostname: "svgs.scryfall.io" },
    ],
  },
};

export default nextConfig;
