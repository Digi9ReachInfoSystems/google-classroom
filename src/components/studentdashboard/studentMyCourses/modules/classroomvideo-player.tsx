"use client"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Play, Pause, Volume2, VolumeX, Maximize } from "lucide-react"

interface VideoPlayerProps {
  onVideoComplete?: () => void
}

export function VideoPlayer({ onVideoComplete }: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [volume, setVolume] = useState(1)
  const [isMuted, setIsMuted] = useState(false)
  const [isCompleted, setIsCompleted] = useState(false)

  useEffect(() => {
    const video = videoRef.current
    if (!video) return

    const updateTime = () => setCurrentTime(video.currentTime)
    const updateDuration = () => setDuration(video.duration)
    const handleEnded = () => {
      setIsCompleted(true)
      setIsPlaying(false)
      if (onVideoComplete) {
        onVideoComplete()
      }
    }

    video.addEventListener("timeupdate", updateTime)
    video.addEventListener("loadedmetadata", updateDuration)
    video.addEventListener("ended", handleEnded)

    return () => {
      video.removeEventListener("timeupdate", updateTime)
      video.removeEventListener("loadedmetadata", updateDuration)
      video.removeEventListener("ended", handleEnded)
    }
  }, [onVideoComplete])

  const togglePlay = () => {
    const video = videoRef.current
    if (!video) return

    if (isPlaying) {
      video.pause()
    } else {
      video.play()
    }
    setIsPlaying(!isPlaying)
  }

  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const video = videoRef.current
    if (!video) return

    const rect = e.currentTarget.getBoundingClientRect()
    const pos = (e.clientX - rect.left) / rect.width
    video.currentTime = pos * video.duration
  }

  const toggleMute = () => {
    const video = videoRef.current
    if (!video) return

    video.muted = !isMuted
    setIsMuted(!isMuted)
  }

  const toggleFullscreen = () => {
    const video = videoRef.current
    if (!video) return

    if (document.fullscreenElement) {
      document.exitFullscreen()
    } else {
      video.requestFullscreen()
    }
  }

  const formatTime = (time: number) => {
    if (isNaN(time)) return "00:00"
    const minutes = Math.floor(time / 60)
    const seconds = Math.floor(time % 60)
    return `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`
  }

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0

  return (
    <div className="relative bg-black rounded-xl sm:rounded-2xl 2xl:rounded-3xl shadow-md overflow-hidden aspect-video group">
      <video
        ref={videoRef}
        className="w-full h-full object-contain"
        src="/student/mycourse.mp4"
        onClick={togglePlay}
      >
        Your browser does not support the video tag.
      </video>

      {/* Centered play overlay shows only when paused */}
      {!isPlaying && (
        <button
          aria-label="Play"
          onClick={togglePlay}
          className="absolute inset-0 m-auto h-14 w-14 sm:h-16 sm:w-16 xl:h-20 xl:w-20 flex items-center justify-center rounded-full bg-white/20 hover:bg-white/30 transition shadow-md backdrop-blur-sm border border-white/40 ring-1 ring-white/30 text-white z-10"
        >
          <Play className="h-7 w-7 sm:h-8 sm:w-8 xl:h-10 xl:w-10 ml-1" />
        </button>
      )}

      {/* Video Controls */}
      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-2 sm:p-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
        {/* Progress Bar */}
        <div
          className="w-full bg-white/20 rounded-full h-1 mb-2 cursor-pointer relative"
          onClick={handleProgressClick}
        >
          <div
            className="bg-white rounded-full h-1 transition-all duration-100"
            style={{ width: `${progress}%` }}
          >
            <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full"></div>
          </div>
        </div>

        {/* Control Buttons */}
        <div className="flex items-center gap-1.5 sm:gap-2 lg:gap-3 xl:gap-4">
        <Button
          variant="ghost"
          size="icon"
          className="text-white hover:bg-white/20 rounded-full h-8 w-8 sm:h-10 sm:w-10"
            onClick={togglePlay}
          >
            {isPlaying ? (
              <Pause className="h-4 w-4 sm:h-5 sm:w-5 lg:h-6 lg:w-6" />
            ) : (
              <Play className="h-4 w-4 sm:h-5 sm:w-5 lg:h-6 lg:w-6" />
            )}
        </Button>

          <span className="text-white text-xs sm:text-sm font-mono font-medium">
            {formatTime(currentTime)} / {formatTime(duration)}
          </span>

          <div className="flex-1"></div>

          <Button
            variant="ghost"
            size="icon"
            className="text-white hover:bg-white/20 rounded-full h-8 w-8 sm:h-10 sm:w-10"
            onClick={toggleMute}
          >
            {isMuted ? (
              <VolumeX className="h-4 w-4 sm:h-5 sm:w-5 lg:h-6 lg:w-6" />
            ) : (
              <Volume2 className="h-4 w-4 sm:h-5 sm:w-5 lg:h-6 lg:w-6" />
            )}
          </Button>

          <Button
            variant="ghost"
            size="icon"
            className="text-white hover:bg-white/20 rounded-full h-8 w-8 sm:h-10 sm:w-10"
            onClick={toggleFullscreen}
          >
            <Maximize className="h-4 w-4 sm:h-5 sm:w-5 lg:h-6 lg:w-6" />
        </Button>
        </div>
      </div>
    </div>
  )
}
