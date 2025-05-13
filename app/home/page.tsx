"use client"

import type React from "react"

import { useState, useCallback, useRef, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { ShopList } from "@/components/shop-list"
import { CategoryFilter } from "@/components/category-filter"
import { DistrictFilter } from "@/components/district-filter"
import SidebarNavigation from "@/components/sidebar-navigation"
import { Plus } from "lucide-react"
import Link from "next/link"
import { useLanguage } from "@/contexts/language-context"

export default function HomePage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [searchTerm, setSearchTerm] = useState("")
  const topRef = useRef<HTMLDivElement>(null)
  const [mounted, setMounted] = useState(false)
  const { t } = useLanguage()

  // Set initial search term from URL params after component mounts
  useEffect(() => {
    setSearchTerm(searchParams.get("search") || "")
    setMounted(true)
  }, [searchParams])

  const handleSearch = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault()

      const params = new URLSearchParams(searchParams.toString())

      if (searchTerm.trim()) {
        params.set("search", searchTerm.trim())
      } else {
        params.delete("search")
      }

      router.push(`/home?${params.toString()}`)
    },
    [searchTerm, searchParams, router],
  )

  // Function to scroll to top
  const scrollToTop = () => {
    topRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  // Don't render until mounted to avoid hydration issues
  if (!mounted) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-10">
      <SidebarNavigation scrollToTop={scrollToTop} />

      <div ref={topRef} className="container mx-auto px-4 py-4 pt-16 max-w-6xl">
        {/* Header */}
        <header className="flex justify-between items-center mb-4">
          <h1 className="text-3xl font-bold text-gray-900">Shop Seva</h1>
        </header>

        {/* District Filter */}
        <div className="mb-4">
          <DistrictFilter />
        </div>

        {/* Search Bar */}
        <form onSubmit={handleSearch} className="relative mb-6">
          <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5 text-gray-400"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z"
                clipRule="evenodd"
              />
            </svg>
          </div>
          <input
            type="text"
            placeholder={t("findShops")}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-xl"
          />
          <button type="submit" className="absolute inset-y-0 right-0 px-4 py-2 bg-blue-600 text-white rounded-r-lg">
            {t("search")}
          </button>
        </form>

        {/* Categories Section */}
        <div className="mb-6">
          <h2 className="text-xl font-medium text-gray-800 mb-3">{t("categories")}</h2>
          <CategoryFilter />
        </div>

        {/* Shop List */}
        <div>
          <h2 className="text-2xl font-medium text-gray-800 mb-4">{t("shops")}</h2>
          <ShopList />
        </div>
      </div>

      {/* Enhanced Colorful Floating Action Button - Now links to Shopkeeper login */}
      <Link href="/shopkeeper/login" className="fixed bottom-6 right-6 z-30 group" aria-label={t("shopkeeperLogin")}>
        <div className="relative">
          {/* Gradient border effect */}
          <div className="absolute -inset-1 rounded-full bg-gradient-to-r from-yellow-400 via-teal-400 to-blue-500 opacity-75 blur-sm group-hover:opacity-100 transition duration-300"></div>

          {/* Button content with shadow and scale effect */}
          <div className="relative flex items-center justify-center gap-2 bg-white text-black font-bold py-3 px-6 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105">
            <div className="absolute inset-0 rounded-full bg-gradient-to-r from-yellow-400/10 via-teal-400/10 to-blue-500/10"></div>
            <Plus size={24} className="text-teal-600 group-hover:rotate-90 transition-transform duration-300" />
            <span className="text-xl bg-gradient-to-r from-yellow-600 via-teal-600 to-blue-600 bg-clip-text text-transparent font-extrabold">
              ADD
            </span>
          </div>
        </div>
      </Link>
    </div>
  )
}
