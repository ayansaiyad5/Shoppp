"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { CATEGORIES, DISTRICTS } from "@/lib/constants"
import { MOCK_SHOPS } from "@/lib/data"
import type { Shop } from "@/lib/types"
import { ImageCarousel } from "@/components/image-carousel"
import { Heart } from "lucide-react"
import { toast } from "sonner"
import SidebarNavigation from "@/components/sidebar-navigation"
import { getApprovedShopsForSearch } from "@/lib/firebase"

export default function LikedShopsPage() {
  const router = useRouter()
  const [likedShops, setLikedShops] = useState<Shop[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [likedShopIds, setLikedShopIds] = useState<string[]>([])

  useEffect(() => {
    const fetchLikedShops = async () => {
      setIsLoading(true)

      try {
        // Get liked shop IDs from localStorage
        const likedShopsJson = localStorage.getItem("likedShops")
        const likedIds = likedShopsJson ? JSON.parse(likedShopsJson) : []
        setLikedShopIds(likedIds)

        if (likedIds.length === 0) {
          setLikedShops([])
          setIsLoading(false)
          return
        }

        // Try to get shops from Firestore first
        const result = await getApprovedShopsForSearch()
        
        if (result.success && result.shops) {
          // Filter only the liked shops
          const likedShops = result.shops.filter((shop) => likedIds.includes(shop.id))
          setLikedShops(likedShops)
        } else {
          // Fallback to localStorage if Firestore fetch fails
          const approvedShopsJson = localStorage.getItem("approvedShops")
          const approvedShops = approvedShopsJson ? JSON.parse(approvedShopsJson) : []
          
          // Find liked shops from MOCK_SHOPS and approvedShops
          const allShops = [...MOCK_SHOPS, ...approvedShops]
          const likedShops = allShops.filter((shop) => likedIds.includes(shop.id))
          
          // Remove duplicates
          const uniqueLikedShops = Array.from(
            new Map(likedShops.map((shop) => [shop.id, shop])).values()
          )
          
          setLikedShops(uniqueLikedShops)
        }
      } catch (error) {
        console.error("Error fetching liked shops:", error)
        toast.error("Failed to load liked shops")
      } finally {
        setIsLoading(false)
      }
    }

    fetchLikedShops()
  }, [])

  // Handle unliking a shop
  const handleUnlikeShop = (shopId: string) => {
    // Remove from liked shop IDs
    const updatedLikedIds = likedShopIds.filter((id) => id !== shopId)
    setLikedShopIds(updatedLikedIds)
    
    // Update localStorage
    localStorage.setItem("likedShops", JSON.stringify(updatedLikedIds))
    
    // Remove from displayed shops
    setLikedShops((prev) => prev.filter((shop) => shop.id !== shopId))
    
    // Update the likes count in the shop data
    const updatedShops = likedShops.map((shop) => {
      if (shop.id === shopId) {
        return { ...shop, likes: Math.max(0, (shop.likes || 1) - 1) }
      }
      return shop
    })
    
    // Update shop likes count in approvedShops localStorage
    const approvedShopsJson = localStorage.getItem("approvedShops")
    if (approvedShopsJson) {
      const approvedShops = JSON.parse(approvedShopsJson)
      const shopToUpdate = approvedShops.find((s: Shop) => s.id === shopId)
      
      if (shopToUpdate) {
        shopToUpdate.likes = Math.max(0, (shopToUpdate.likes || 1) - 1)
        localStorage.setItem("approvedShops", JSON.stringify(approvedShops))
      }
    }
    
    toast.success("Shop removed from favorites")
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex items-center space-x-2">
          <div className="w-3 h-3 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: "0ms" }}></div>
          <div className="w-3 h-3 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: "150ms" }}></div>
          <div className="w-3 h-3 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: "300ms" }}></div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <SidebarNavigation />
      
      <div className="container mx-auto px-4 py-8 pt-16 max-w-6xl">
        <header className="mb-6">
          <div className="flex items-center gap-2 mb-2">
            <button 
              onClick={() => router.push("/home")}
              className="p-2 rounded-full hover:bg-gray-100"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-arrow-left">
                <path d="m12 19-7-7 7-7"/>
                <path d="M19 12H5"/>
              </svg>
            </button>
            <h1 className="text-2xl font-bold text-gray-800">Liked Shops</h1>
          </div>
          <p className="text-gray-600">Shops you've favorited</p>
        </header>

        {likedShops.length === 0 ? (
          <div className="bg-white p-8 rounded-lg shadow text-center">
            <div className="mb-4">
              <Heart className="w-12 h-12 mx-auto text-gray-300" />
            </div>
            <p className="text-gray-500 mb-4">You haven't liked any shops yet.</p>
            <button
              onClick={() => router.push("/home")}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              Browse Shops
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {likedShops.map((shop) => (
              <div key={shop.id} className="bg-white rounded-lg shadow overflow-hidden flex flex-col">
                <div className="h-[160px] relative">
                  <a href={`/shop/${shop.id}`}>
                    <ImageCarousel images={shop.images} alt={shop.name} />
                  </a>
                  <button
                    onClick={() => handleUnlikeShop(shop.id)}
                    className="absolute top-2 right-2 bg-white bg-opacity-80 rounded-full p-1.5 transition-colors text-red-600 hover:bg-red-100"
                    aria-label="Unlike shop"
                  >
                    <Heart className="h-4 w-4 fill-red-600" />
                  </button>
                </div>
                <div className="p-3 flex-1 flex flex-col justify-between">
                  <div>
                    <div className="flex justify-between items-start">
                      <h3 className="text-sm font-bold text-gray-800 line-clamp-1">{shop.name}</h3>
                      {shop.likes && shop.likes > 0 && (
                        <span className="text-xs font-medium text-gray-600 flex items-center gap-1 ml-1">
                          <Heart className="h-3 w-3 text-red-500 fill-red-500" />
                          {shop.likes}
                        </span>
                      )}
                    </div>
                    <p className="text-gray-600 text-xs mt-1 line-clamp-2">{shop.address}</p>
                    <div className="mt-2 flex flex-wrap gap-1">
                      <span className="px-1.5 py-0.5 bg-blue-100 text-blue-800 text-[10px] rounded-full">
                        {CATEGORIES.find((c) => c.id === shop.category)?.name}
                      </span>
                      <span className="px-1.5 py-0.5 bg-green-100 text-green-800 text-[10px] rounded-full">
                        {DISTRICTS.find((d) => d.id === shop.district)?.name}
                      </span>
                    </div>
                  </div>
                  <div className="mt-3 flex items-center gap-2">
                    <a
                      href={`tel:${shop.contact}`}
                      className="flex-1 flex items-center justify-center bg-blue-600 hover:bg-blue-700 text-white py-2 px-3 rounded-md transition-colors text-xs font-medium"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-3 w-3 mr-1"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                      >
                        <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
                      </svg>
                      Call
                    </a>
                    <a
                      href={`/shop/${shop.id}`}
                      className="flex items-center justify-center bg-gray-100 hover:bg-gray-200 text-gray-800 py-2 px-3 rounded-md transition-colors text-xs font-medium"
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
                      Details
                    </a>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
} 