import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    const backendUrl =
      process.env.BACKEND_URL || "https://ab12361-decipher-backend.hf.space";

    return [
      {
        source: "/api/:path*",
        destination:
          process.env.NODE_ENV === "development"
            ? "http://localhost:8000/api/:path*"
            : `${backendUrl}/api/:path*`,
      },
    ];
  },
};

export default nextConfig;
