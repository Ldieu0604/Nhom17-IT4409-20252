import { currentUser } from "@clerk/nextjs/server"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { HeroSection } from "@/components/hero-section"
import { FeaturesSection } from "@/components/features-section"
import { TemplatesSection } from "@/components/templates-section"
import { RecentDocuments } from "@/components/recent-documents"
import { WorkspacesSection } from "@/components/workspaces-section"
import { CalendarSection } from "@/components/calendar-section"
import { ChatPanel } from "@/components/chat-panel"
import { demoDashboardData } from "@/lib/demo-data"
import { clerkEnabled } from "@/lib/clerk-config"

function getInitials(name?: string | null, email?: string | null) {
  const base = name || email || "Guest"
  return base
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((item) => item[0]?.toUpperCase() ?? "")
    .join("")
}

export default async function Home() {
  const clerkUser = clerkEnabled ? await currentUser() : null

  const headerUser = clerkUser
    ? {
        name:
          [clerkUser.firstName, clerkUser.lastName].filter(Boolean).join(" ") ||
          clerkUser.username ||
          clerkUser.emailAddresses[0]?.emailAddress ||
          "User",
        email: clerkUser.emailAddresses[0]?.emailAddress ?? "",
        imageUrl: clerkUser.imageUrl,
        initials: getInitials(
          [clerkUser.firstName, clerkUser.lastName].filter(Boolean).join(" "),
          clerkUser.emailAddresses[0]?.emailAddress
        ),
      }
    : null

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Header user={headerUser} />

      <main className="flex-1">
        <div className="container mx-auto px-4">
          <HeroSection />
          <FeaturesSection />
          <TemplatesSection />
          <RecentDocuments documents={demoDashboardData.recentDocuments} />
          <WorkspacesSection workspaces={demoDashboardData.workspaces} />
          <CalendarSection
            events={demoDashboardData.events}
            upcomingTasks={demoDashboardData.upcomingTasks}
          />
        </div>
      </main>

      <Footer />
      <ChatPanel activities={demoDashboardData.activities} />
    </div>
  )
}
