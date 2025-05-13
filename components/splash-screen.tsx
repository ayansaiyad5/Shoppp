"use client"

import { useEffect, useState, useRef } from "react"
import { Store } from "lucide-react"

interface SplashScreenProps {
  onFinish: () => void
  duration?: number
}

export function SplashScreen({ onFinish, duration = 5000 }: SplashScreenProps) {
  const [fadeOut, setFadeOut] = useState(false)
  const [progress, setProgress] = useState(0)
  const progressIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const fadeTimerRef = useRef<NodeJS.Timeout | null>(null)
  const hideTimerRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    // Start fade out animation before completely hiding the splash screen
    fadeTimerRef.current = setTimeout(() => {
      setFadeOut(true)
    }, duration - 1000)

    // Hide splash screen after duration
    hideTimerRef.current = setTimeout(() => {
      onFinish()
    }, duration)

    // Update progress bar
    const interval = 100 // Update every 100ms
    progressIntervalRef.current = setInterval(() => {
      setProgress((prev) => {
        const increment = 100 / (duration / interval)
        const newProgress = prev + increment
        return newProgress > 100 ? 100 : newProgress
      })
    }, interval)

    // Cleanup all timers
    return () => {
      if (fadeTimerRef.current) clearTimeout(fadeTimerRef.current)
      if (hideTimerRef.current) clearTimeout(hideTimerRef.current)
      if (progressIntervalRef.current) clearInterval(progressIntervalRef.current)
    }
  }, [duration, onFinish])

  return (
    <div
      className={`fixed inset-0 z-50 flex flex-col items-center justify-center bg-gradient-to-br from-blue-50 to-white transition-opacity duration-500 ${
        fadeOut ? "opacity-0" : "opacity-100"
      }`}
    >
      <div className="flex flex-col items-center px-8 text-center">
        <div className="mb-6 w-32 h-32 relative">
          <div className="absolute inset-0 rounded-full bg-gradient-to-r from-yellow-400 via-teal-400 to-blue-500"></div>
          <div className="absolute inset-1 bg-white rounded-full flex items-center justify-center">
            <Store className="w-16 h-16 text-blue-600" />
          </div>
        </div>
        <h1 className="text-5xl font-bold text-gray-800 mb-2">Shop Seva</h1>
        <div className="h-1 w-32 bg-gradient-to-r from-yellow-400 via-teal-400 to-blue-500 mb-4 rounded-full"></div>
        <p className="text-gray-500 text-lg">Welcome to Gujarat's Shop Directory</p>

        {/* Progress bar */}
        <div className="w-64 h-2 bg-gray-200 rounded-full mt-8 overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-yellow-400 via-teal-400 to-blue-500"
            style={{ width: `${progress}%`, transition: "width 100ms linear" }}
          ></div>
        </div>
      </div>
    </div>
  )
}

