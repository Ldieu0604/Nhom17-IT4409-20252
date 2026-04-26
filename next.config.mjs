function getAllowedDevOrigins() {
  const defaults = ["localhost", "127.0.0.1"]
  const appUrl = process.env.NEXT_PUBLIC_APP_URL
  const extraOrigins = (process.env.ALLOWED_DEV_ORIGINS ?? "")
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean)

  const origins = new Set(defaults)

  if (appUrl) {
    try {
      const parsed = new URL(appUrl)
      origins.add(parsed.hostname)
    } catch {
      // Ignore malformed URL and keep defaults only.
    }
  }

  for (const origin of extraOrigins) {
    origins.add(origin)
  }

  return Array.from(origins)
}

/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  allowedDevOrigins: getAllowedDevOrigins(),
}

export default nextConfig
