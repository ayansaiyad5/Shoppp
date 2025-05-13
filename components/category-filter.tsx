"use client"
import { useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { CATEGORIES } from "@/lib/constants"

export function CategoryFilter() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const currentCategoryId = searchParams.get("category")
  const [showAllCategories, setShowAllCategories] = useState(false)

  const handleCategoryClick = (categoryId: string | null) => {
    const params = new URLSearchParams(searchParams.toString())

    if (categoryId === null) {
      params.delete("category")
    } else if (currentCategoryId === categoryId) {
      params.delete("category")
    } else {
      params.set("category", categoryId)
    }

    // Make sure we stay on the home page by using /home instead of /
    router.push(`/home?${params.toString()}`)
  }

  return (
    <div>
      {/* All Categories Option */}
      <button
        onClick={() => handleCategoryClick(null)}
        className={`w-full mb-4 flex items-center justify-center p-3 rounded-lg transition-colors ${
          !currentCategoryId ? "bg-blue-600 text-white" : "bg-blue-600 text-white"
        }`}
      >
        <span className="text-xl mr-2">🏪</span>
        <span className="text-lg">All Categories</span>
      </button>

      {/* Category Grid - Show first 6 categories */}
      <div className="grid grid-cols-3 gap-2 mb-3">
        {CATEGORIES.slice(0, 6).map((category) => (
          <button
            key={category.id}
            onClick={() => handleCategoryClick(category.id)}
            className={`flex flex-col items-center justify-center p-4 rounded-lg transition-colors ${
              currentCategoryId === category.id
                ? "bg-blue-600 text-white"
                : "bg-gray-100 text-gray-800 hover:bg-gray-200"
            }`}
          >
            <span className="text-2xl mb-2">{getCategoryIcon(category.icon)}</span>
            <span className="text-sm">{category.name}</span>
          </button>
        ))}
      </div>

      {/* Show All Categories button */}
      {!showAllCategories && (
        <button
          onClick={() => setShowAllCategories(true)}
          className="w-full py-2 px-4 bg-gray-100 hover:bg-gray-200 rounded-lg text-blue-600 font-medium mb-3"
        >
          See All Categories
        </button>
      )}

      {/* Show remaining categories when "See All" is clicked */}
      {showAllCategories && (
        <div className="grid grid-cols-3 gap-2">
          {CATEGORIES.slice(6).map((category) => (
            <button
              key={category.id}
              onClick={() => handleCategoryClick(category.id)}
              className={`flex flex-col items-center justify-center p-4 rounded-lg transition-colors ${
                currentCategoryId === category.id
                  ? "bg-blue-600 text-white"
                  : "bg-gray-100 text-gray-800 hover:bg-gray-200"
              }`}
            >
              <span className="text-2xl mb-2">{getCategoryIcon(category.icon)}</span>
              <span className="text-sm">{category.name}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

function getCategoryIcon(iconName: string) {
  // This is a simplified version - in a real app, you'd use a proper icon library
  const iconMap: Record<string, string> = {
    "medical-bag": "💊",
    food: "🍔",
    "tshirt-crew": "👕",
    television: "📺",
    cart: "🛒",
    "chair-rolling": "🪑",
    car: "🚗",
    school: "🏫",
    "face-woman": "💄",
    tools: "🔧",
    basketball: "🏀",
    book: "📚",
    "diamond-stone": "💎",
    pharmacy: "💊",
    "food-fork-drink": "🍽️",
    handshake: "🤝",
    "home-variant": "🏠",
    pencil: "✏️",
    "dots-horizontal": "⋯",
  }

  return iconMap[iconName] || "🏪"
}

