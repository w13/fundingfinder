/** @type {import("next").NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Show detailed error messages in production
  productionBrowserSourceMaps: false,
  // Don't hide error details in production
  onDemandEntries: {
    maxInactiveAge: 25 * 1000,
    pagesBufferLength: 2,
  },
};

module.exports = nextConfig;
