"use client"

import React, { useState, useEffect, useRef } from "react"
import ToolbarSelect from "@/components/editor/ToolbarSelect"
import ToolbarIconButton from "@/components/editor/ToolbarIconButton"
import { Bold, Italic, Underline, Type, AlignLeft, AlignCenter, AlignRight, AlignJustify, List, ListOrdered, ListChecks, Indent, Outdent, Highlighter, Table as TableIcon, Trash, Rows, Columns, ListCollapse   } from "lucide-react"

export default function FormatToolbar({ actions, state, disabled }: { actions?: any; state?: any; disabled?: boolean }) {

    const [localFontSize, setLocalFontSize] = useState(state?.fontSize?.replace('px', '') || "16")
    const fontSizeInputRef = useRef<HTMLInputElement>(null)
    const fontDisplay = state?.font || "Arial"
    const textColor = state?.textColor || "#000000"
    const highlightColor = state?.highlightColor || "#FFFF00"

    useEffect(() => {
        if (fontSizeInputRef.current === document.activeElement) return 
        const newSize = state?.fontSize?.replace('px', '') || "16"
        setLocalFontSize(newSize)
    }, [state?.fontSize])

    const handleTextColorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const color = e.currentTarget.value
        actions?.onTextColor?.(color)
    }

    const handleHighlightColorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const color = e.currentTarget.value
        actions?.onHighlightColor?.(color)
    }

    const styleToLabel: Record<string, string> = {
        "paragraph": "Paragraph",
        "h1": "Heading 1",
        "h2": "Heading 2",
        "h3": "Heading 3"
    };
    const currentStyleLabel = styleToLabel[state?.style] || "Normal text";

    return (
        <div className="flex h-10 items-center gap-1 overflow-x-auto whitespace-nowrap border-b bg-white px-4">
            
            <ToolbarSelect 
                ariaLabel="Style" 
                options={["Paragraph", "Heading 1", "Heading 2", "Heading 3"]} 
                value={currentStyleLabel} 
                onChange={(v) => actions?.onStyleChange && actions.onStyleChange(v)} 
            />
            
            <select 
                className="h-8 border border-gray-300 rounded px-2 text-sm bg-transparent hover:bg-gray-50 outline-none cursor-pointer"
                value={fontDisplay}
                onChange={(e) => actions?.onFontChange?.(e.target.value)}
            >
                {[
                  "Arial", "Times New Roman", "Roboto", "Inter", "Georgia", "Verdana", 
                  "Courier New", "Comic Sans MS", "Impact", "Tahoma", "Trebuchet MS", 
                  "Nunito", "Open Sans", "Playfair Display"
                ].map(f => (
                    <option key={f} value={f} style={{ fontFamily: f }}>{f}</option>
                ))}
            </select> 

            <div className="flex items-center border border-gray-300 rounded hover:bg-gray-50 px-1 h-8 bg-white relative group">
                <input
                    ref={fontSizeInputRef}
                    type="number"
                    value={localFontSize}
                    onChange={(e) => {
                        const value = e.target.value
                        setLocalFontSize(value)
                        // Apply real-time nếu là số hợp lệ
                        if (value && !isNaN(Number(value)) && Number(value) > 0) {
                            actions?.onFontSizeChange?.(value)
                        }
                    }}
                    onBlur={(e) => {
                        const value = e.target.value || "16"
                        setLocalFontSize(value)
                        if (!value || isNaN(Number(value)) || Number(value) <= 0) {
                            actions?.onFontSizeChange?.("16")
                        }
                    }}
                    onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                            ;(e.target as HTMLInputElement).blur()
                        }
                    }}
                    disabled={disabled}
                    min="1"
                    max="100"
                    className="w-14 text-center text-sm bg-transparent outline-none font-medium cursor-pointer"
                />
            </div>
                            
            <div className="mx-1 h-6 w-px shrink-0 bg-gray-300" />
            
            <ToolbarIconButton label="Bold" icon={<Bold className="h-4 w-4" />} onClick={actions?.onBold} active={state?.activeMarks?.bold} disabled={disabled} />
            <ToolbarIconButton label="Italic" icon={<Italic className="h-4 w-4" />} onClick={actions?.onItalic} active={state?.activeMarks?.italic} disabled={disabled} />
            <ToolbarIconButton label="Underline" icon={<Underline className="h-4 w-4" />} onClick={actions?.onUnderline} active={state?.activeMarks?.underline} disabled={disabled} />
            
            <div title="Text color" className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded text-sm hover:bg-muted/50 relative cursor-pointer">
                <div className="relative flex flex-col items-center">
                    <Type className="h-4 w-4" />
                    <div 
                        className="absolute -bottom-[2px] h-[3px] w-full rounded-full" 
                        style={{ backgroundColor: textColor }} 
                    />
                </div>
                <input 
                    type="color" 
                    value={textColor}
                    onChange={handleTextColorChange}
                    disabled={disabled}
                    className="absolute inset-0 opacity-0 cursor-pointer" 
                />
            </div>
            
            <div title="Highlight color" className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded text-sm hover:bg-muted/50 relative cursor-pointer">
                <div className="relative flex flex-col items-center">
                    <Highlighter className="h-4 w-4" />
                    <div 
                        className="absolute -bottom-[2px] h-[3px] w-full rounded-full" 
                        style={{ backgroundColor: highlightColor }} 
                    />
                </div>
                <input 
                    type="color" 
                    value={highlightColor}
                    onChange={handleHighlightColorChange}
                    disabled={disabled}
                    className="absolute inset-0 opacity-0 cursor-pointer" 
                />
            </div>

            <div className="mx-1 h-6 w-px shrink-0 bg-gray-300" />
            
            <ToolbarIconButton label="Căn trái" icon={<AlignLeft className="h-4 w-4" />} onClick={actions?.onAlignLeft} active={state?.activeAlignment === 'left'} disabled={disabled} />
            <ToolbarIconButton label="Căn giữa" icon={<AlignCenter className="h-4 w-4" />} onClick={actions?.onAlignCenter} active={state?.activeAlignment === 'center'} disabled={disabled} />
            <ToolbarIconButton label="Căn phải" icon={<AlignRight className="h-4 w-4" />} onClick={actions?.onAlignRight} active={state?.activeAlignment === 'right'} disabled={disabled} />
            <ToolbarIconButton label="Căn đều" icon={<AlignJustify className="h-4 w-4" />} onClick={actions?.onJustify} active={state?.activeAlignment === 'justify'} disabled={disabled} />
            <div className="mx-1 h-6 w-px shrink-0 bg-gray-300" />
            
            <ToolbarIconButton label="Danh sách dấu đầu dòng" icon={<List className="h-4 w-4" />} onClick={actions?.onBulletList} active={state?.activeMarks?.bulletList} disabled={disabled} />
            <ToolbarIconButton label="Danh sách đánh số" icon={<ListOrdered className="h-4 w-4" />} onClick={actions?.onNumberedList} active={state?.activeMarks?.orderedList} disabled={disabled} />
            <ToolbarIconButton label="Checklist" icon={<ListChecks className="h-4 w-4" />} onClick={actions?.onChecklist} active={state?.activeMarks?.taskList} disabled={disabled} />
            <ToolbarIconButton label="Danh sách sổ xuống" icon={<ListCollapse className="h-4 w-4" />} onClick={actions?.onToggleList} active={state?.activeMarks?.details} disabled={disabled} />
            <ToolbarIconButton label="Giảm thụt" icon={<Outdent className="h-4 w-4" />} onClick={actions?.onDecreaseIndent} disabled={disabled} />
            <ToolbarIconButton label="Tăng thụt" icon={<Indent className="h-4 w-4" />} onClick={actions?.onIncreaseIndent} disabled={disabled} />
        </div>
    )
}