"use client"

import React, { useCallback, useEffect, useRef, useState } from "react"
import { DEFAULT_PAGE_MARGINS, type PageMargins } from "@/types/page-layout"

type PaginatedEditorShellProps = {
    children?: React.ReactNode
    margins?: PageMargins
    onMarginsChange?: (margins: PageMargins) => void
    pageWidth?: number
    pageHeight?: number
}

const PAGE_WIDTH = 794
const PAGE_HEIGHT = 1123
const MIN_MARGIN = 16
const MAX_MARGIN = 160
const VERTICAL_TICK_COUNT = 28
const PAGE_GAP = 32 // Khoảng cách giữa các trang

function clampMargin(value: number) {
    if (!Number.isFinite(value)) return MIN_MARGIN
    return Math.min(MAX_MARGIN, Math.max(MIN_MARGIN, value))
}

type VerticalPageRulerProps = {
    margins: PageMargins
    onMarginsChange?: (margins: PageMargins) => void
    pageHeight: number
}

// 1. GIỮ NGUYÊN GIAO DIỆN THƯỚC KẺ GỐC CỦA LINH
function VerticalPageRuler({ margins, onMarginsChange, pageHeight }: VerticalPageRulerProps) {
    const rulerRef = useRef<HTMLDivElement | null>(null)
    const [draggingHandle, setDraggingHandle] = useState<"top" | "bottom" | null>(null)

    // Sửa lỗi logic tọa độ để kéo lề chuẩn ở mọi trang
    const updateVerticalMargin = useCallback((handle: "top" | "bottom", clientY: number) => {
        if (!onMarginsChange) return
        const ruler = rulerRef.current
        if (!ruler) return

        const rect = ruler.getBoundingClientRect()
        const relativeY = Math.min(rect.height, Math.max(0, clientY - rect.top))
        const calculatedValue = (relativeY / rect.height) * pageHeight

        const nextMargin = handle === "top"
            ? clampMargin(calculatedValue)
            : clampMargin(pageHeight - calculatedValue)

        onMarginsChange({
            ...margins,
            [handle]: nextMargin,
        })
    }, [margins, onMarginsChange, pageHeight])

    useEffect(() => {
        if (!draggingHandle) return
        const activeHandle = draggingHandle

        function handlePointerMove(event: PointerEvent) {
            updateVerticalMargin(activeHandle, event.clientY)
        }
        function handlePointerUp() {
            setDraggingHandle(null)
        }

        window.addEventListener("pointermove", handlePointerMove)
        window.addEventListener("pointerup", handlePointerUp)

        return () => {
            window.removeEventListener("pointermove", handlePointerMove)
            window.removeEventListener("pointerup", handlePointerUp)
        }
    }, [draggingHandle, updateVerticalMargin])

    return (
        <div
            ref={rulerRef}
            className="relative w-7 shrink-0 border-r bg-gray-50"
            style={{ height: pageHeight }}
        >
            <div className="absolute inset-x-0 top-0 bg-blue-100/70 pointer-events-none" style={{ height: margins.top }} />
            <div className="absolute inset-x-0 bottom-0 bg-blue-100/70 pointer-events-none" style={{ height: margins.bottom }} />
            
            {Array.from({ length: VERTICAL_TICK_COUNT }, (_, tick) => (
                <span
                    key={tick}
                    className="absolute right-0 h-px bg-gray-400 pointer-events-none"
                    style={{
                        top: `${(tick / (VERTICAL_TICK_COUNT - 1)) * 100}%`,
                        width: tick % 4 === 0 ? 18 : tick % 2 === 0 ? 12 : 7,
                    }}
                />
            ))}
            
            <button
                type="button"
                className="absolute left-1 h-2 w-5 -translate-y-1/2 cursor-ns-resize rounded-sm bg-blue-500 shadow outline-none ring-blue-300 focus:ring-2 z-10"
                style={{ top: margins.top }}
                onPointerDown={(event) => {
                    event.preventDefault()
                    event.stopPropagation()
                    setDraggingHandle("top")
                }}
            />
            <button
                type="button"
                className="absolute left-1 h-2 w-5 -translate-y-1/2 cursor-ns-resize rounded-sm bg-blue-500 shadow outline-none ring-blue-300 focus:ring-2 z-10"
                style={{ top: pageHeight - margins.bottom }}
                onPointerDown={(event) => {
                    event.preventDefault()
                    event.stopPropagation()
                    setDraggingHandle("bottom")
                }}
            />
        </div>
    )
}

export function PaginatedEditorShell({
    children,
    margins = DEFAULT_PAGE_MARGINS,
    onMarginsChange,
    pageWidth = PAGE_WIDTH,
    pageHeight = PAGE_HEIGHT,
}: PaginatedEditorShellProps) {
    const containerRef = useRef<HTMLDivElement>(null)
    const [pageCount, setPageCount] = useState(1)

    // Liên tục đo chiều cao để tự động tăng số lượng trang nền
    useEffect(() => {
        const container = containerRef.current
        if (!container) return

        const observer = new ResizeObserver(() => {
            const currentHeight = container.scrollHeight
            // Tính số trang dựa trên tổng chiều cao Tiptap chia cho chiều cao 1 trang (cộng thêm khoảng gap)
            const pages = Math.max(1, Math.ceil(currentHeight / (pageHeight + PAGE_GAP)))
            setPageCount(pages)
        })

        observer.observe(container)
        return () => observer.disconnect()
    }, [pageHeight])

    const virtualPages = Array.from({ length: pageCount }, (_, i) => i)

    return (
        <div className="min-w-max px-8 py-8 bg-gray-100 min-h-screen overflow-y-auto">
            <div className="mx-auto flex w-fit justify-center relative">
                
                {/* 2. CỘT BÊN TRÁI: DANH SÁCH THƯỚC KẺ ĐỘC LẬP CHO TỪNG TRANG */}
                <div className="flex flex-col mr-3" style={{ gap: PAGE_GAP }}>
                    {virtualPages.map((pageIndex) => (
                        <VerticalPageRuler
                            key={`ruler-${pageIndex}`}
                            margins={margins}
                            onMarginsChange={onMarginsChange}
                            pageHeight={pageHeight}
                        />
                    ))}
                </div>

                {/* 3. CỘT BÊN PHẢI: KHUNG VĂN BẢN VÀ CÁC TRANG NỀN */}
                <div className="relative" style={{ width: pageWidth }}>
                    
                    {/* LỚP NỀN DƯỚI CÙNG: Các tờ giấy trắng vật lý */}
                    <div className="absolute inset-0 flex flex-col pointer-events-none" style={{ gap: PAGE_GAP }}>
                        {virtualPages.map((pageIndex) => (
                            <section
                                key={`bg-page-${pageIndex}`}
                                className="bg-white shadow-sm ring-1 ring-gray-200"
                                style={{ width: pageWidth, height: pageHeight }}
                            />
                        ))}
                    </div>

                    {/* LỚP TRÊN CÙNG: Tiptap Editor DUY NHẤT (Nằm đè lên các trang nền) */}
                    <div 
                        ref={containerRef}
                        className="relative z-10 w-full outline-none"
                        style={{
                            minHeight: pageHeight,
                            paddingTop: `${margins.top}px`,
                            paddingBottom: `${margins.bottom}px`,
                            paddingLeft: `${margins.left}px`,
                            paddingRight: `${margins.right}px`,
                        }}
                    >
                        <div className="h-full w-full outline outline-1 outline-dashed outline-sky-200/70">
                            {children}
                        </div>
                    </div>

                </div>
            </div>
        </div>
    )
}