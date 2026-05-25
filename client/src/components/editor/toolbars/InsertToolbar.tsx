"use client"

import React from "react"
import ToolbarIconButton from "@/components/editor/ToolbarIconButton"
import { Image as ImageIcon, Link, MessageSquare, Table, Minus, Rows, Trash, Columns } from "lucide-react"

export default function InsertToolbar({ actions, state, disabled }: { actions?: any; state?: any; disabled?: boolean }) {
    return (
        <div className="flex h-10 items-center gap-1 overflow-x-auto whitespace-nowrap border-b bg-white px-4">
            <ToolbarIconButton label="Hình ảnh" icon={<ImageIcon className="h-4 w-4" />} onClick={actions?.onInsertImage} disabled={disabled} />
            <ToolbarIconButton label="Liên kết" icon={<Link className="h-4 w-4" />} onClick={actions?.onInsertLink} disabled={disabled} />
            <ToolbarIconButton label="Bình luận" icon={<MessageSquare className="h-4 w-4" />} onClick={actions?.onAddComment} disabled={disabled} />
            <ToolbarIconButton label="Bảng" icon={<Table className="h-4 w-4" />} onClick={actions?.onInsertTable} disabled={disabled} />   
            {state?.isTableActive && (
                <div className="flex items-center gap-1 bg-blue-50/50 p-1 rounded border border-blue-100 mx-1">
                    <ToolbarIconButton label="Thêm hàng" icon={<Rows className="h-4 w-4 text-blue-600" />} onClick={actions?.onAddRowAfter} disabled={disabled} />
                    <ToolbarIconButton label="Xóa hàng" icon={<Trash className="h-4 w-4 text-orange-500" />} onClick={actions?.onDeleteRow} disabled={disabled} />
                    <div className="mx-1 h-4 w-px shrink-0 bg-blue-200" />
                    <ToolbarIconButton label="Thêm cột" icon={<Columns className="h-4 w-4 text-blue-600" />} onClick={actions?.onAddColumnAfter} disabled={disabled} />
                    <ToolbarIconButton label="Xóa cột" icon={<Trash className="h-4 w-4 text-orange-500" />} onClick={actions?.onDeleteColumn} disabled={disabled} />
                    <div className="mx-1 h-4 w-px shrink-0 bg-blue-200" />
                    <ToolbarIconButton label="Xóa bảng" icon={<Trash className="h-4 w-4 text-red-600" />} onClick={actions?.onDeleteTable} disabled={disabled} />
                </div>
            )}   
            
            <div className="mx-1 h-6 w-px shrink-0 bg-gray-300" />
            <ToolbarIconButton label="Đường ngang" icon={<Minus className="h-4 w-4" />} onClick={actions?.onInsertHorizontalLine} disabled={disabled} />
        </div>
    )
}
