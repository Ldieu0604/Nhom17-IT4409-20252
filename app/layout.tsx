import type { Metadata } from "next"
import { ClerkProvider } from "@clerk/nextjs"
import { Be_Vietnam_Pro, JetBrains_Mono } from "next/font/google"
import { Analytics } from "@vercel/analytics/next"
import { ThemeProvider } from "@/components/theme-provider"
import { Toaster } from "@/components/ui/sonner"
import { clerkEnabled, clerkPublishableKey } from "@/lib/clerk-config"
import "./globals.css"

const beVietnamPro = Be_Vietnam_Pro({
  subsets: ["latin", "vietnamese"],
  weight: ["400", "500", "600", "700", "800"],
})

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin", "vietnamese"],
  weight: ["400", "500", "700"],
})

export const metadata: Metadata = {
  title: "CoWorkHub | Nền tảng cộng tác cho nhóm làm việc",
  description:
    "Nền tảng cộng tác thời gian thực cho tài liệu, công việc, workspace và bảng điều khiển nhóm.",
  generator: "Codex",
  icons: {
    icon: [
      {
        url: "/icon-light-32x32.png",
        media: "(prefers-color-scheme: light)",
      },
      {
        url: "/icon-dark-32x32.png",
        media: "(prefers-color-scheme: dark)",
      },
      {
        url: "/icon.svg",
        type: "image/svg+xml",
      },
    ],
    apple: "/apple-icon.png",
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const content = (
    <html lang="vi" suppressHydrationWarning>
      <body className={`${beVietnamPro.className} ${jetbrainsMono.className} font-sans antialiased`}>
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
          {children}
          <Toaster richColors />
          {process.env.NODE_ENV === "production" && <Analytics />}
        </ThemeProvider>
      </body>
    </html>
  )

  if (!clerkEnabled) {
    return content
  }

  return <ClerkProvider publishableKey={clerkPublishableKey}>{content}</ClerkProvider>
}
