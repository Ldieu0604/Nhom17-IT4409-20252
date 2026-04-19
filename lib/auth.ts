import { auth, currentUser } from "@clerk/nextjs/server"
import { prisma } from "@/lib/prisma"
import { clerkEnabled } from "@/lib/clerk-config"

function getInitials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("")
}

export async function getOrCreateAppUser() {
  if (!clerkEnabled) {
    return null
  }

  const { userId } = await auth()

  if (!userId) {
    return null
  }

  const clerkUser = await currentUser()
  const email = clerkUser?.emailAddresses[0]?.emailAddress

  if (!email) {
    return null
  }

  const displayName =
    [clerkUser?.firstName, clerkUser?.lastName].filter(Boolean).join(" ") ||
    clerkUser?.username ||
    email

  if (!process.env.DATABASE_URL) {
    return {
      id: userId,
      clerkId: userId,
      email,
      name: displayName,
      username: clerkUser?.username ?? null,
      avatarUrl: clerkUser?.imageUrl ?? null,
    }
  }

  const existingByClerkId = await prisma.user.findUnique({
    where: { clerkId: userId },
  })

  if (existingByClerkId) {
    return prisma.user.update({
      where: { id: existingByClerkId.id },
      data: {
        email,
        name: displayName,
        username: clerkUser?.username ?? undefined,
        avatarUrl: clerkUser?.imageUrl,
      },
    })
  }

  const existingByEmail = await prisma.user.findUnique({
    where: { email },
  })

  if (existingByEmail) {
    return prisma.user.update({
      where: { id: existingByEmail.id },
      data: {
        clerkId: userId,
        name: displayName,
        username: clerkUser?.username ?? undefined,
        avatarUrl: clerkUser?.imageUrl,
      },
    })
  }

  try {
    return await prisma.user.create({
      data: {
        clerkId: userId,
        email,
        name: displayName,
        username: clerkUser?.username ?? undefined,
        avatarUrl: clerkUser?.imageUrl,
      },
    })
  } catch (error) {
    const recovered = await prisma.user.findFirst({
      where: {
        OR: [{ clerkId: userId }, { email }],
      },
    })

    if (recovered) {
      return prisma.user.update({
        where: { id: recovered.id },
        data: {
          clerkId: userId,
          email,
          name: displayName,
          username: clerkUser?.username ?? undefined,
          avatarUrl: clerkUser?.imageUrl,
        },
      })
    }

    throw error
  }
}

export async function getHeaderUser() {
  if (!clerkEnabled) {
    return null
  }

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
