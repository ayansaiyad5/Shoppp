"use client"
import { useEffect, useState } from "react"
import type React from "react"

import { useSearchParams } from "next/navigation"
import { MOCK_SHOPS } from "@/lib/data"
import { CATEGORIES, STATES, ALL_DISTRICTS } from "@/lib/constants"
import type { Shop } from "@/lib/types"
import { ImageCarousel } from "./image-carousel"
import { Heart, Phone, MessageCircle, Star } from "lucide-react"
import { toast } from "sonner"
import { useLanguage } from "@/contexts/language-context"
import { getApprovedShopsForSearch } from "@/lib/firebase"

export function ShopList() {
  const searchParams = useSearchParams()
  const categoryId = searchParams.get("category")
  const stateId = searchParams.get("state")
  const districtId = searchParams.get("district")
  const searchQuery = searchParams.get("search")
  const [shops, setShops] = useState<Shop[]>([])
  const [filteredShops, setFilteredShops] = useState<Shop[]>([])
  const [visibleShops, setVisibleShops] = useState<Shop[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [likedShops, setLikedShops] = useState<string[]>([])
  const { t } = useLanguage()

  // Limit to only 8 shops per page
  const SHOPS_PER_PAGE = 8

  // Load shops from Firestore and combine with mock shops
  useEffect(() => {
    const fetchShops = async () => {
      setIsLoading(true)
      try {
        // Start with mock shops for backward compatibility
        const allShops = [...MOCK_SHOPS]
        
        // Fetch approved shops from Firestore
        const result = await getApprovedShopsForSearch(
          searchQuery || undefined, 
          categoryId || undefined, 
          districtId || undefined,
          stateId || undefined
        )
        
        if (result.success && result.shops) {
          // Combine shops, avoiding duplicates by ID
          const shopIds = new Set(allShops.map((shop) => shop.id))
          result.shops.forEach((shop: Shop) => {
            if (!shopIds.has(shop.id)) {
              allShops.push(shop)
              shopIds.add(shop.id)
            }
          })
        }

        setShops(allShops)
        
        // Get liked shops from localStorage
        if (typeof window !== "undefined") {
          const likedShopsJson = localStorage.getItem("likedShops")
          if (likedShopsJson) {
            setLikedShops(JSON.parse(likedShopsJson))
          }
        }
      } catch (error) {
        console.error("Error fetching shops:", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchShops()
  }, [searchQuery, categoryId, districtId, stateId])

  // Filter shops based on search params
  useEffect(() => {
    const filtered = shops.filter((shop) => {
      // Only show approved shops
      if (!shop.isApproved) return false

      // Apply state filter if not already applied in the database query
      if (stateId && shop.state && shop.state !== stateId) return false

      // If we already applied filters from the database query, no need to filter again
      // This avoids double filtering
      return true
    })

    setFilteredShops(filtered)

    // Only show the first 8 shops
    setVisibleShops(filtered.slice(0, SHOPS_PER_PAGE))
  }, [shops, stateId])

  // Handle liking a shop
  const handleLikeShop = (e: React.MouseEvent, shop: Shop) => {
    e.preventDefault() // Prevent navigation to shop details
    e.stopPropagation() // Stop event propagation

    // Check if shop is already liked
    const isAlreadyLiked = likedShops.includes(shop.id)

    // Toggle like status
    const newLikedStatus = !isAlreadyLiked

    // Update likes count
    const newLikesCount = newLikedStatus ? (shop.likes || 0) + 1 : Math.max(0, (shop.likes || 0) - 1)

    // Update localStorage for liked shops
    if (typeof window !== "undefined") {
      let updatedLikedShops = [...likedShops]

      if (newLikedStatus) {
        // Add to liked shops if not already there
        if (!updatedLikedShops.includes(shop.id)) {
          updatedLikedShops.push(shop.id)
        }
      } else {
        // Remove from liked shops
        updatedLikedShops = updatedLikedShops.filter((id) => id !== shop.id)
      }

      // Update state and localStorage
      setLikedShops(updatedLikedShops)
      localStorage.setItem("likedShops", JSON.stringify(updatedLikedShops))

      // Update shop likes count in shops state
      const updatedShops = shops.map((s) => (s.id === shop.id ? { ...s, likes: newLikesCount } : s))
      setShops(updatedShops)

      // Update shop likes count in approvedShops
      const approvedShopsJson = localStorage.getItem("approvedShops")
      if (approvedShopsJson) {
        const approvedShops = JSON.parse(approvedShopsJson)
        const updatedApprovedShops = approvedShops.map((s: Shop) =>
          s.id === shop.id ? { ...s, likes: newLikesCount } : s,
        )
        localStorage.setItem("approvedShops", JSON.stringify(updatedApprovedShops))
      }

      // Also update in MOCK_SHOPS if it's there
      const mockShopIndex = MOCK_SHOPS.findIndex((s) => s.id === shop.id)
      if (mockShopIndex > -1) {
        MOCK_SHOPS[mockShopIndex].likes = newLikesCount
      }

      toast.success(newLikedStatus ? "Shop liked!" : "Shop unliked")
    }
  }

  // Function to open WhatsApp with the shop's phone number
  const handleWhatsAppContact = (e: React.MouseEvent, phoneNumber: string) => {
    e.preventDefault() // Prevent navigation to shop details
    e.stopPropagation() // Stop event propagation

    // Format phone number for WhatsApp (remove any non-digit characters)
    const formattedNumber = phoneNumber.replace(/\D/g, "")

    // Add India country code if not present (assuming all numbers are Indian)
    const whatsappNumber = formattedNumber.startsWith("91") ? formattedNumber : `91${formattedNumber}`

    // Open WhatsApp link
    window.open(`https://wa.me/${whatsappNumber}`, "_blank")
  }

  return (
    <div>
      {isLoading ? (
        <div className="flex items-center justify-center p-8">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600"></div>
        </div>
      ) : visibleShops.length === 0 ? (
        <div className="bg-white p-8 rounded-lg shadow text-center">
          <p className="text-gray-500">{t("noShopsFound")}</p>
        </div>
      ) : (
        <>
          {/* Grid layout for shops */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {visibleShops.map((shop) => (
              <div key={shop.id} className="bg-white rounded-lg shadow overflow-hidden flex flex-col w-full">
                <div className="h-[160px] relative">
                  <a href={`/shop/${shop.id}`}>
                    <ImageCarousel images={shop.images} alt={shop.name} />
                  </a>
                  {/* Like button */}
                  <button
                    onClick={(e) => handleLikeShop(e, shop)}
                    className={`absolute top-2 right-2 bg-white bg-opacity-80 rounded-full p-1.5 transition-colors ${
                      likedShops.includes(shop.id) ? "text-red-600 hover:bg-red-100" : "text-gray-600 hover:bg-gray-100"
                    }`}
                    aria-label={likedShops.includes(shop.id) ? "Unlike shop" : "Like shop"}
                  >
                    <Heart className={`h-4 w-4 ${likedShops.includes(shop.id) ? "fill-red-600" : ""}`} />
                  </button>
                </div>
                <div className="p-3 flex-1 flex flex-col justify-between">
                  <div>
                    <div className="flex justify-between items-start">
                      <h3 className="text-sm font-bold text-gray-800 line-clamp-1">{shop.name}</h3>
                      <div className="flex items-center gap-1">
                        {shop.likes && shop.likes > 0 && (
                          <span className="text-xs font-medium text-gray-600 flex items-center gap-1 ml-1">
                            <Heart className="h-3 w-3 text-red-500 fill-red-500" />
                            {shop.likes}
                          </span>
                        )}
                        {shop.reviewCount && shop.reviewCount > 0 && (
                          <span className="text-xs font-medium text-gray-600 flex items-center gap-1 ml-1">
                            <Star className="h-3 w-3 text-yellow-500 fill-yellow-500" />
                            {shop.reviewCount}
                          </span>
                        )}
                      </div>
                    </div>
                    <p className="text-gray-600 text-xs mt-1 line-clamp-2">{shop.address}</p>
                    <div className="mt-2 flex flex-wrap gap-1">
                      <span className="px-1.5 py-0.5 bg-blue-100 text-blue-800 text-[10px] rounded-full">
                        {CATEGORIES.find((c) => c.id === shop.category)?.name}
                      </span>
                      {shop.state && (
                        <span className="px-1.5 py-0.5 bg-purple-100 text-purple-800 text-[10px] rounded-full">
                          {STATES.find((s) => s.id === shop.state)?.name}
                        </span>
                      )}
                      <span className="px-1.5 py-0.5 bg-green-100 text-green-800 text-[10px] rounded-full">
                        {ALL_DISTRICTS.find((d) => d.id === shop.district)?.name}
                      </span>
                    </div>
                  </div>
                  <div className="mt-3 grid grid-cols-3 gap-1">
                    <a
                      href={`tel:${shop.contact}`}
                      className="flex items-center justify-center bg-blue-600 hover:bg-blue-700 text-white py-2 px-1 rounded-md transition-colors text-xs font-medium"
                    >
                      <Phone className="h-3 w-3 mr-1" />
                      <span>{t("call")}</span>
                    </a>
                    <button
                      onClick={(e) => handleWhatsAppContact(e, shop.contact)}
                      className="flex items-center justify-center bg-green-600 hover:bg-green-700 text-white py-2 px-1 rounded-md transition-colors text-xs font-medium"
                    >
                      <MessageCircle className="h-3 w-3 mr-1" />
                      <span>{t("whatsapp")}</span>
                    </button>
                    <a
                      href={`/shop/${shop.id}`}
                      className="flex items-center justify-center bg-gray-100 hover:bg-gray-200 text-gray-800 py-2 px-1 rounded-md transition-colors text-xs font-medium"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-3 w-3 mr-1"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                      >
                        <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                        <path
                          fillRule="evenodd"
                          d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                      <span>{t("details")}</span>
                    </a>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}