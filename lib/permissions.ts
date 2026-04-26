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

export async function assertWorkspaceRole(
  userId: string,
  workspaceId: string,
  allowedRoles: Array<"OWNER" | "ADMIN" | "MEMBER" | "VIEWER">
) {
  const membership = await assertWorkspaceAccess(userId, workspaceId)

  if (!allowedRoles.includes(membership.role)) {
    throw new Error("Bạn không có quyền thực hiện thao tác này.")
  }

  return membership
}
