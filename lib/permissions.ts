import { prisma } from "@/lib/prisma"

export async function assertWorkspaceAccess(userId: string, workspaceId: string) {
  const membership = await prisma.workspaceMember.findUnique({
    where: {
      workspaceId_userId: {
        workspaceId,
        userId,
      },
    },
  })

  if (!membership) {
    throw new Error("Bạn không có quyền truy cập workspace này.")
  }

  return membership
}
