import { auth, currentUser } from "@clerk/nextjs/server"
import { prisma } from "@/lib/prisma"

function getInitials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("")
}

export async function getOrCreateAppUser() {
  const { userId } = await auth()

  if (!userId) {
    return null
  }

  const clerkUser = await currentUser()
  const email = clerkUser?.emailAddresses[0]?.emailAddress

  if (!email) {
    return null
  }

  if (!process.env.DATABASE_URL) {
    return {
      id: userId,
      clerkId: userId,
      email,
      name:
        [clerkUser?.firstName, clerkUser?.lastName].filter(Boolean).join(" ") ||
        clerkUser?.username ||
        email,
      username: clerkUser?.username ?? null,
      avatarUrl: clerkUser?.imageUrl ?? null,
    }
  }

  const existing = await prisma.user.findUnique({
    where: { clerkId: userId },
  })

  if (existing) {
    return existing
  }

  return prisma.user.create({
    data: {
      clerkId: userId,
      email,
      name: [clerkUser?.firstName, clerkUser?.lastName].filter(Boolean).join(" ") || clerkUser?.username || email,
      username: clerkUser?.username ?? undefined,
      avatarUrl: clerkUser?.imageUrl,
    },
  })
}

export async function getHeaderUser() {
  const user = await getOrCreateAppUser()

  if (!user) {
    return null
  }

  return {
    id: user.id,
    clerkId: user.clerkId,
    name: user.name ?? user.email,
    email: user.email,
    imageUrl: user.avatarUrl,
    initials: getInitials(user.name ?? user.email),
  }
}
