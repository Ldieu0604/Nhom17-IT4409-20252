"use client"

import { Badge } from "@/components/ui/badge"
import { Sparkles } from "lucide-react"


export function HeroSection() {
  return (
    <section className="relative overflow-hidden pb-4 pt-12 md:pb-5 md:pt-20">
      {/* Background Pattern */}
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute left-1/4 top-1/4 h-64 w-64 rounded-full bg-primary/5 blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 h-64 w-64 rounded-full bg-accent/5 blur-3xl" />
      </div>

      <div className="text-center">
        {/* Badge */}
        <Badge
          variant="secondary"
          className="mb-6 gap-2 px-4 py-2 text-sm font-medium"
        >
          <Sparkles className="h-4 w-4 text-primary" />
          Nền tảng cộng tác theo thời gian thực mới ra mắt!
        </Badge>

        {/* Title */}
        <h1 className="mx-auto max-w-4xl text-balance text-4xl font-bold tracking-tight text-foreground md:text-5xl lg:text-6xl">
          <span className="text-primary">
            Collaborative Workspaces
          </span>
        </h1>

      </div>
    </section>
  )
}
