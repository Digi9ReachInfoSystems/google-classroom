"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Play, Pause, Volume2 } from "lucide-react"

export function VideoPlayer() {
  const [isPlaying, setIsPlaying] = useState(false)

  return (
    <div className="relative bg-gradient-to-br from-purple-900 via-blue-900 to-purple-800 rounded-xl sm:rounded-2xl shadow-md overflow-hidden aspect-video">
      <div className="absolute inset-0">
        {/* Top left UI elements */}
        <div className="absolute top-2 sm:top-4 left-2 sm:left-4 space-y-1 sm:space-y-2">
          <div className="flex gap-1 sm:gap-2">
            <div className="w-8 sm:w-12 h-6 sm:h-8 border border-cyan-400 rounded opacity-60"></div>
            <div className="w-6 sm:w-8 h-6 sm:h-8 border border-cyan-400 rounded opacity-60"></div>
          </div>
          <div className="w-12 sm:w-16 h-8 sm:h-12 border border-cyan-400 rounded opacity-60"></div>
        </div>

        {/* Top center chart elements */}
        <div className="absolute top-4 sm:top-6 left-1/3 space-y-1">
          <div className="flex gap-1">
            <div className="w-1.5 sm:w-2 h-6 sm:h-8 bg-cyan-400 rounded opacity-70"></div>
            <div className="w-1.5 sm:w-2 h-8 sm:h-12 bg-pink-400 rounded opacity-70"></div>
            <div className="w-1.5 sm:w-2 h-4 sm:h-6 bg-green-400 rounded opacity-70"></div>
            <div className="w-1.5 sm:w-2 h-6 sm:h-10 bg-blue-400 rounded opacity-70"></div>
          </div>
        </div>

        {/* Top right data visualization */}
        <div className="absolute top-2 sm:top-4 right-4 sm:right-8 space-y-1">
          <div className="flex gap-1">
            <div className="w-12 sm:w-16 h-1 bg-cyan-400 rounded opacity-80"></div>
            <div className="w-6 sm:w-8 h-1 bg-pink-400 rounded opacity-80"></div>
          </div>
          <div className="flex gap-1">
            <div className="w-8 sm:w-12 h-1 bg-green-400 rounded opacity-80"></div>
            <div className="w-16 sm:w-20 h-1 bg-blue-400 rounded opacity-80"></div>
          </div>
          <div className="flex gap-1">
            <div className="w-10 sm:w-14 h-1 bg-purple-400 rounded opacity-80"></div>
            <div className="w-8 sm:w-10 h-1 bg-cyan-400 rounded opacity-80"></div>
          </div>
        </div>

        {/* Right side circular elements */}
        <div className="absolute top-16 right-4 space-y-2">
          <div className="w-4 h-4 bg-white rounded-full opacity-60"></div>
          <div className="w-3 h-3 bg-cyan-400 rounded-full opacity-80"></div>
          <div className="w-4 h-4 bg-pink-400 rounded-full opacity-60"></div>
          <div className="w-3 h-3 bg-green-400 rounded-full opacity-70"></div>
          <div className="w-4 h-4 border-2 border-white rounded-full opacity-50"></div>
          <div className="w-3 h-3 border-2 border-cyan-400 rounded-full opacity-60"></div>
        </div>

        {/* Center-right chart area */}
        <div className="absolute top-1/3 right-16 space-y-1">
          <div className="w-24 h-1 bg-cyan-400 rounded opacity-70"></div>
          <div className="w-20 h-1 bg-pink-400 rounded opacity-70"></div>
          <div className="w-28 h-1 bg-green-400 rounded opacity-70"></div>
          <div className="w-16 h-1 bg-blue-400 rounded opacity-70"></div>
        </div>

        {/* Bottom right striped pattern */}
        <div className="absolute bottom-20 right-8 space-y-1">
          <div className="w-12 h-1 bg-white rounded opacity-60"></div>
          <div className="w-16 h-1 bg-cyan-400 rounded opacity-60"></div>
          <div className="w-10 h-1 bg-pink-400 rounded opacity-60"></div>
        </div>

        {/* Left side code-like elements */}
        <div className="absolute bottom-32 left-8 space-y-1">
          <div className="w-20 h-1 bg-blue-400 rounded opacity-70"></div>
          <div className="w-16 h-1 bg-purple-400 rounded opacity-70"></div>
          <div className="w-24 h-1 bg-cyan-400 rounded opacity-70"></div>
          <div className="w-12 h-1 bg-pink-400 rounded opacity-70"></div>
        </div>

        {/* Floating circles scattered */}
        <div className="absolute top-20 left-1/2 w-2 h-2 bg-pink-400 rounded-full opacity-60"></div>
        <div className="absolute top-32 left-1/3 w-3 h-3 bg-cyan-400 rounded-full opacity-50"></div>
        <div className="absolute bottom-40 right-1/3 w-2 h-2 bg-green-400 rounded-full opacity-70"></div>
      </div>

      <div className="absolute bottom-0 left-6 sm:left-12 w-36 sm:w-48 h-48 sm:h-64">
        <div className="relative w-full h-full">
          {/* Character body - red/orange hoodie */}
          <div className="absolute bottom-6 sm:bottom-8 left-6 sm:left-8 w-18 sm:w-24 h-24 sm:h-32 bg-gradient-to-b from-red-400 to-red-500 rounded-t-3xl"></div>

          {/* Character head - teal/green hair */}
          <div className="absolute bottom-24 sm:bottom-32 left-9 sm:left-12 w-12 sm:w-16 h-12 sm:h-16 bg-gradient-to-b from-teal-300 to-teal-400 rounded-full"></div>

          {/* Left arm - pointing gesture */}
          <div className="absolute bottom-16 sm:bottom-20 left-3 sm:left-4 w-6 sm:w-8 h-12 sm:h-16 bg-red-400 rounded-full transform -rotate-12"></div>

          {/* Right arm - extended outward */}
          <div className="absolute bottom-12 sm:bottom-16 right-3 sm:right-4 w-6 sm:w-8 h-12 sm:h-16 bg-red-400 rounded-full transform rotate-45"></div>

          {/* White platform/base */}
          <div className="absolute bottom-0 left-0 w-24 sm:w-32 h-6 sm:h-8 bg-white rounded-full opacity-90 shadow-lg"></div>
        </div>
      </div>

      {/* Centered play overlay shows only when paused */}
      {!isPlaying && (
        <button
          aria-label="Play"
          onClick={() => setIsPlaying(true)}
          className="absolute inset-0 m-auto h-14 w-14 sm:h-16 sm:w-16 xl:h-20 xl:w-20 flex items-center justify-center rounded-full bg-white/20 hover:bg-white/30 transition shadow-md backdrop-blur-sm border border-white/40 ring-1 ring-white/30 text-white"
          style={{ pointerEvents: "auto" }}
        >
          <Play className="h-7 w-7 sm:h-8 sm:w-8 xl:h-10 xl:w-10" />
        </button>
      )}

      <div className="absolute bottom-2 sm:bottom-3 left-2 sm:left-3 right-2 sm:right-3 flex items-center gap-1.5 sm:gap-2 lg:gap-3 xl:gap-4">
        <Button
          variant="ghost"
          size="icon"
          className="text-white hover:bg-white/20 rounded-full h-8 w-8 sm:h-10 sm:w-10"
          onClick={() => setIsPlaying(!isPlaying)}
        >
          {isPlaying ? <Pause className="h-4 w-4 sm:h-5 sm:w-5 lg:h-6 lg:w-6 xl:h-7 xl:w-7" /> : <Play className="h-4 w-4 sm:h-5 sm:w-5 lg:h-6 lg:w-6 xl:h-7 xl:w-7" />}
        </Button>

        <div className="flex-1 bg-white/20 rounded-full h-1 relative">
          <div className="bg-white rounded-full h-1 w-1/3"></div>
        </div>

        <span className="text-white text-xs sm:text-sm font-mono font-medium">05:10</span>

        <Button variant="ghost" size="icon" className="text-white hover:bg-white/20 rounded-full h-8 w-8 sm:h-10 sm:w-10">
          <Volume2 className="h-4 w-4 sm:h-5 sm:w-5 lg:h-6 lg:w-6 xl:h-7 xl:w-7" />
        </Button>
      </div>
    </div>
  )
}
