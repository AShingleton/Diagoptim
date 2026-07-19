import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // PWA runtime caching is handled by the custom service worker (public/sw.js)

  // @resvg/resvg-js is a native Node addon (.node binding) used by the shared
  // fishbone image renderer; it cannot be bundled into ESM chunks, so keep it
  // external and load it at runtime on the server.
  serverExternalPackages: ["@resvg/resvg-js"],

  images: {
    formats: ["image/avif", "image/webp"],
  },

  // Ensure service worker and manifest are served correctly
  async rewrites() {
    return [
      {
        source: "/sw.js",
        destination: "/sw.js",
      },
    ];
  },

  headers: async () => [
    {
      source: "/(.*)",
      headers: [
        { key: "X-Content-Type-Options", value: "nosniff" },
        { key: "X-Frame-Options", value: "DENY" },
        { key: "X-XSS-Protection", value: "1; mode=block" },
        { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
        {
          key: "Permissions-Policy",
          value: "camera=(), microphone=(), geolocation=()",
        },
        {
          key: "Strict-Transport-Security",
          value: "max-age=63072000; includeSubDomains; preload",
        },
        {
          key: "Content-Security-Policy",
          value: [
            "default-src 'self'",
            "script-src 'self' 'unsafe-eval' 'unsafe-inline' https://js.stripe.com https://eu.posthog.com",
            "style-src 'self' 'unsafe-inline'",
            "img-src 'self' data: blob: https:",
            "font-src 'self' data:",
            "connect-src 'self' https://*.supabase.co https://api.stripe.com https://eu.posthog.com https://api.anthropic.com https://api.resend.com https://api.insee.fr",
            "frame-src https://js.stripe.com https://hooks.stripe.com",
            "worker-src 'self' blob:",
          ].join("; "),
        },
      ],
    },
    {
      source: "/sw.js",
      headers: [
        { key: "Cache-Control", value: "no-cache, no-store, must-revalidate" },
        { key: "Service-Worker-Allowed", value: "/" },
      ],
    },
  ],
};

export default nextConfig;
