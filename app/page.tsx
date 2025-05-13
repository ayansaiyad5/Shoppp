"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { SplashScreen } from "@/components/splash-screen"

export default function RootPage() {
  const router = useRouter()
  const [showSplash, setShowSplash] = useState(true)
  const [redirecting, setRedirecting] = useState(false)

  useEffect(() => {
    // Only show splash screen on initial load
    const hasVisited = sessionStorage.getItem("hasVisitedBefore")

    if (hasVisited) {
      // If user has visited before in this session, redirect immediately
      setShowSplash(false)
      router.push("/home")
    } else {
      // First visit in this session, show splash screen
      const timer = setTimeout(() => {
        setShowSplash(false)
        setRedirecting(true)
        sessionStorage.setItem("hasVisitedBefore", "true")
        router.push("/home")
      }, 5000)

      return () => clearTimeout(timer)
    }
  }, [router])

  // Only render the splash screen or loading indicator, not both
  return showSplash ? (
    <SplashScreen onFinish={() => {}} duration={5000} />
  ) : redirecting ? (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600"></div>
    </div>
  ) : null
}

