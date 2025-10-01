"use client"

import { Search } from "lucide-react"

type FiltersBarProps = {
  searchQuery: string
  onSearchChange: (q: string) => void
}

export function FiltersBar({ searchQuery, onSearchChange }: FiltersBarProps) {
  return (
    <div className="flex items-center gap-3 w-full sm:w-auto">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-black pointer-events-none" />
        <input
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search..."
          className="h-9 w-full sm:w-[300px] md:w-[340px] rounded-full border border-neutral-300 bg-white pl-9 pr-3 text-sm outline-none focus:ring-2 focus:ring-neutral-300"
        />
      </div>
    </div>
  )
}
