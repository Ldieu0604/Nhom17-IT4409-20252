import { SignIn } from "@clerk/nextjs"
import { auth } from "@clerk/nextjs/server"
import { redirect } from "next/navigation"
import { AuthShell } from "@/components/auth/auth-shell"
import { ClerkMissingState } from "@/components/auth/clerk-missing-state"
import { clerkEnabled } from "@/lib/clerk-config"

export default async function SignInPage() {
  const { userId } = clerkEnabled ? await auth() : { userId: null }

  if (userId) {
    redirect("/dashboard")
  }

  return (
    <AuthShell mode="sign-in">
      {clerkEnabled ? (
        <SignIn
          forceRedirectUrl="/dashboard"
          signUpUrl="/sign-up"
          appearance={{
            variables: {
              colorPrimary: "hsl(var(--primary))",
              colorText: "hsl(var(--foreground))",
              colorBackground: "hsl(var(--card))",
              colorInputBackground: "hsl(var(--background))",
              colorInputText: "hsl(var(--foreground))",
              borderRadius: "0.75rem",
              fontFamily: "Roboto, sans-serif",
            },
            elements: {
              card: "shadow-none border border-border",
              headerTitle: "text-foreground",
              headerSubtitle: "text-muted-foreground",
              socialButtonsBlockButton: "border-border hover:bg-muted",
              formButtonPrimary: "bg-primary hover:bg-primary/90 text-primary-foreground",
              footerActionLink: "text-primary hover:text-primary/80",
            },
          }}
        />
      ) : (
        <ClerkMissingState mode="sign-in" />
      )}
    </AuthShell>
  )
}
