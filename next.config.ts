import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  env: {
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL || "https://erolydqnccsrtonehnlb.supabase.co",
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVyb2x5ZHFuY2NzcnRvbmVobmxiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODIxOTYzMTgsImV4cCI6MjA5Nzc3MjMxOH0.iFibFRFrs4H8ZVpAbdD3PBUozkVYDEDVbhwETo6mGBE",
  },
};

export default nextConfig;
