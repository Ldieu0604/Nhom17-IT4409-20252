"use client"

import React from "react"

export default function ToolbarSelect({
    value,
    onChange,
    options,
    ariaLabel,
}: {
    value?: string
    onChange?: (v: string) => void
    options: string[]
    ariaLabel?: string
}) {
    return (
        <select
            aria-label={ariaLabel}
            value={value}
            onChange={(e) => onChange && onChange(e.target.value)}
            className="h-8 border border-gray-300 rounded px-2 text-sm bg-transparent hover:bg-gray-50 outline-none cursor-pointer"
        >
            {options.map((o) => (
                <option key={o} value={o}>
                    {o}
                </option>
            ))}
        </select>
    )
}
