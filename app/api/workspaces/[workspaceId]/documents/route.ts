import { randomUUID } from "node:crypto"
import { mkdir, writeFile } from "node:fs/promises"
import path from "node:path"
import mammoth from "mammoth"
import { NextResponse } from "next/server"
import { DocumentStatus } from "@prisma/client"
import { getOrCreateAppUser } from "@/lib/auth"
import { logActivity } from "@/lib/activity"
import { assertWorkspaceAccess } from "@/lib/permissions"
import { prisma } from "@/lib/prisma"

const allowedExtensions = new Set(["pdf", "docx"])

function createEmptyDoc() {
  return {
    type: "doc",
    content: [],
  }
}

function inferMimeType(extension: string) {
  if (extension === "pdf") {
    return "application/pdf"
  }

  return "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
}

function sanitizeBaseName(value: string) {
  return value
    .normalize("NFKD")
    .replace(/[^\w\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .toLowerCase()
}

async function saveUploadedFile(file: File, extension: string) {
  const arrayBuffer = await file.arrayBuffer()
  const buffer = Buffer.from(arrayBuffer)
  const uploadDir = path.join(process.cwd(), "public", "uploads", "documents")
  const safeName = sanitizeBaseName(file.name.replace(/\.[^.]+$/, "")) || "tai-lieu"
  const fileName = `${Date.now()}-${randomUUID()}-${safeName}.${extension}`

  await mkdir(uploadDir, { recursive: true })
  await writeFile(path.join(uploadDir, fileName), buffer)

  return {
    buffer,
    storedFileName: fileName,
    publicUrl: `/uploads/documents/${fileName}`,
  }
}

async function docxToInitialContent(buffer: Buffer) {
  const result = await mammoth.convertToHtml({ buffer })
  const html = result.value?.trim()

  if (!html) {
    return createEmptyDoc()
  }

  return html
}

function inferDocumentFormat(extension?: string | null) {
  const normalized = extension?.toLowerCase()

  if (normalized === "pdf") {
    return "PDF" as const
  }

  if (normalized === "docx") {
    return "DOCX" as const
  }

  return "EDITOR" as const
}

type RouteContext = {
  params: Promise<{
    workspaceId: string
  }>
}

export async function GET(_: Request, { params }: RouteContext) {
  const user = await getOrCreateAppUser()
  const { workspaceId } = await params

  if (!user) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
  }

  if (!process.env.DATABASE_URL) {
    return NextResponse.json({ items: [] })
  }

  await assertWorkspaceAccess(user.id, workspaceId)

  const items = await prisma.document.findMany({
    where: { workspaceId },
    include: {
      attachments: {
        where: { deletedAt: null },
        orderBy: { createdAt: "desc" },
        take: 1,
      },
      createdBy: true,
      workspace: true,
    },
    orderBy: { updatedAt: "desc" },
  })

  return NextResponse.json({
    items: items.map((document) => ({
      id: document.id,
      title: document.title,
      type: "document",
      format: inferDocumentFormat(document.attachments[0]?.extension),
      workspaceId: document.workspaceId,
      workspaceName: document.workspace.name,
      updatedAtLabel: document.updatedAt.toISOString(),
      isStarred: false,
      collaborators: [
        {
          name: document.createdBy.name ?? document.createdBy.email,
          initials: (document.createdBy.name ?? document.createdBy.email)
            .split(" ")
            .filter(Boolean)
            .slice(0, 2)
            .map((part) => part[0]?.toUpperCase() ?? "")
            .join(""),
        },
      ],
    })),
  })
}

export async function POST(request: Request, { params }: RouteContext) {
  const user = await getOrCreateAppUser()
  const { workspaceId } = await params

  if (!user) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
  }

  const formData = await request.formData()
  const title = `${formData.get("title") ?? ""}`.trim()
  const uploadedFile = formData.get("file")

  if (!title) {
    return NextResponse.json({ message: "Tiêu đề tài liệu là bắt buộc." }, { status: 400 })
  }

  if (!(uploadedFile instanceof File)) {
    return NextResponse.json({ message: "Bạn cần chọn file PDF hoặc DOCX." }, { status: 400 })
  }

  const extension = uploadedFile.name.split(".").pop()?.toLowerCase() ?? ""
  if (!allowedExtensions.has(extension)) {
    return NextResponse.json({ message: "Chỉ hỗ trợ file PDF hoặc DOCX." }, { status: 400 })
  }

  const { buffer, storedFileName, publicUrl } = await saveUploadedFile(uploadedFile, extension)
  const initialContent = extension === "docx" ? await docxToInitialContent(buffer) : null

  if (!process.env.DATABASE_URL) {
    return NextResponse.json(
      {
        item: {
          id: `mock-doc-${Date.now()}`,
          title,
          content: initialContent ?? createEmptyDoc(),
          format: extension === "pdf" ? "PDF" : "DOCX",
          fileUrl: publicUrl,
        },
      },
      { status: 201 }
    )
  }

  await assertWorkspaceAccess(user.id, workspaceId)

  const document = await prisma.document.create({
    data: {
      workspaceId,
      title,
      status: DocumentStatus.ACTIVE,
      createdById: user.id,
      updatedById: user.id,
      ...(initialContent ? { content: initialContent } : {}),
      attachments: {
        create: {
          workspaceId,
          uploaderId: user.id,
          fileName: storedFileName,
          originalName: uploadedFile.name,
          mimeType: uploadedFile.type || inferMimeType(extension),
          extension,
          sizeBytes: BigInt(uploadedFile.size),
          storageProvider: "local",
          storageKey: `uploads/documents/${storedFileName}`,
          publicUrl,
        },
      },
    },
  })

  await logActivity({
    workspaceId,
    actorId: user.id,
    type: "DOCUMENT_CREATED",
    message: `đã tạo tài liệu "${title}"`,
  })

  return NextResponse.json(
    {
      item: {
        id: document.id,
        title: document.title,
        workspaceId: document.workspaceId,
        createdAt: document.createdAt,
        updatedAt: document.updatedAt,
        format: extension === "pdf" ? "PDF" : "DOCX",
        fileUrl: publicUrl,
      },
    },
    { status: 201 }
  )
}
