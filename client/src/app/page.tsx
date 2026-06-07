import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { HeroSection } from "@/components/hero-section";
import { TemplatesSection } from "@/components/templates-section";
import { RecentDocuments } from "@/components/recent-documents";
import { WorkspacesSection } from "@/components/workspaces-section";
import { CalendarSection } from "@/components/calendar-section";
import { ChatPanel } from "@/components/chat-panel";

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Header />

      <main className="flex-1">
        <div className="mx-auto w-full max-w-7xl px-3 sm:px-4 lg:px-6">
          <HeroSection />
          <TemplatesSection />
          <RecentDocuments />
          <WorkspacesSection />
          <CalendarSection />
        </div>
      </main>

      <Footer />
      <ChatPanel />
    </div>
  );
}
