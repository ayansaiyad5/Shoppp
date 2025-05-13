"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { CATEGORIES, DISTRICTS } from "@/lib/constants"
import { MOCK_SHOPS } from "@/lib/data"
import { ImageCarousel } from "@/components/image-carousel"
import type { Shop } from "@/lib/types"
import { Heart, Phone, MessageCircle, Star } from "lucide-react"
import { getShopById } from "@/lib/firebase"
import { ReviewForm } from "@/components/review-form"
import { ReviewList } from "@/components/review-list"
import { useLanguage } from "@/contexts/language-context"
import React from "react"

export default function ShopDetailsPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const [shop, setShop] = useState<Shop | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [addressCopied, setAddressCopied] = useState(false)
  const [isLiked, setIsLiked] = useState(false)
  const [likesCount, setLikesCount] = useState(0)
  const [showReviews, setShowReviews] = useState(false)
  const { t } = useLanguage()
  
  // Properly unwrap params using React.use()
  const unwrappedParams = React.use(params)
  const shopId = unwrappedParams.id

  useEffect(() => {
    const fetchShop = async () => {
      setIsLoading(true)
      
      try {
        // First try to get shop from Firestore
        const result = await getShopById(shopId)
        
        if (result.success && result.shop) {
          setShop(result.shop)
          setLikesCount(result.shop.likes || 0)
          
          // Check if user has liked this shop
          if (typeof window !== "undefined") {
            const likedShops = JSON.parse(localStorage.getItem("likedShops") || "[]")
            setIsLiked(likedShops.includes(result.shop.id))
          }
          
          setIsLoading(false)
          return
        }
        
        // If not found in Firestore, check mock shops
        let foundShop = MOCK_SHOPS.find((s) => s.id === shopId)

        // If not found in mock shops, check localStorage as fallback
        if (!foundShop && typeof window !== "undefined") {
          const approvedShopsJson = localStorage.getItem("approvedShops")
          if (approvedShopsJson) {
            const approvedShops = JSON.parse(approvedShopsJson)
            foundShop = approvedShops.find((s: Shop) => s.id === shopId)
          }
        }

        if (foundShop) {
          setShop(foundShop)
          setLikesCount(foundShop.likes || 0)

          // Check if user has liked this shop
          if (typeof window !== "undefined") {
            const likedShops = JSON.parse(localStorage.getItem("likedShops") || "[]")
            setIsLiked(likedShops.includes(foundShop.id))
          }
        } else {
          toast.error("Shop not found")
          router.push("/")
        }
      } catch (error) {
        console.error("Error fetching shop details:", error)
        toast.error("Failed to load shop details")
        router.push("/")
      } finally {
        setIsLoading(false)
      }
    }

    if (shopId) {
      fetchShop()
    }
  }, [shopId, router])

  const handleCopyAddress = () => {
    if (shop?.address) {
      navigator.clipboard
        .writeText(shop.address)
        .then(() => {
          setAddressCopied(true)
          setTimeout(() => setAddressCopied(false), 2000)
        })
        .catch(() => {
          toast.error("Failed to copy address")
        })
    }
  }

  // Update the handleOpenMap function to properly encode the full address
  const handleOpenMap = () => {
    if (shop?.latitude && shop?.longitude) {
      window.open(`https://www.google.com/maps/search/?api=1&query=${shop.latitude},${shop.longitude}`, "_blank")
    } else if (shop?.address) {
      // If no coordinates, use address with proper encoding
      const encodedAddress = encodeURIComponent(shop.address)
      window.open(`https://www.google.com/maps/search/?api=1&query=${encodedAddress}`, "_blank")
    }
  }

  const handleLikeShop = () => {
    if (!shop) return

    // Toggle like status
    const newLikedStatus = !isLiked
    setIsLiked(newLikedStatus)

    // Update likes count
    const newLikesCount = newLikedStatus ? likesCount + 1 : Math.max(0, likesCount - 1)
    setLikesCount(newLikesCount)

    // Update localStorage for liked shops
    if (typeof window !== "undefined") {
      const likedShops = JSON.parse(localStorage.getItem("likedShops") || "[]")

      if (newLikedStatus) {
        // Add to liked shops if not already there
        if (!likedShops.includes(shop.id)) {
          likedShops.push(shop.id)
        }
      } else {
        // Remove from liked shops
        const index = likedShops.indexOf(shop.id)
        if (index > -1) {
          likedShops.splice(index, 1)
        }
      }

      localStorage.setItem("likedShops", JSON.stringify(likedShops))

      // Update shop likes count in approvedShops
      const approvedShopsJson = localStorage.getItem("approvedShops")
      if (approvedShopsJson) {
        const approvedShops = JSON.parse(approvedShopsJson)
        const updatedShops = approvedShops.map((s: Shop) => (s.id === shop.id ? { ...s, likes: newLikesCount } : s))
        localStorage.setItem("approvedShops", JSON.stringify(updatedShops))
      }

      // Also update in MOCK_SHOPS if it's there
      const mockShopIndex = MOCK_SHOPS.findIndex((s) => s.id === shop.id)
      if (mockShopIndex > -1) {
        MOCK_SHOPS[mockShopIndex].likes = newLikesCount
      }
    }

    toast.success(newLikedStatus ? "Shop liked!" : "Shop unliked")
  }

  // Function to open WhatsApp with the shop's phone number
  const handleWhatsAppContact = () => {
    if (!shop?.contact) return

    // Format phone number for WhatsApp (remove any non-digit characters)
    const formattedNumber = shop.contact.replace(/\D/g, "")

    // Add India country code if not present (assuming all numbers are Indian)
    const whatsappNumber = formattedNumber.startsWith("91") ? formattedNumber : `91${formattedNumber}`

    // Open WhatsApp link
    window.open(`https://wa.me/${whatsappNumber}`, "_blank")
  }

  // Add refreshReviews function to reload reviews after submitting a new one
  const refreshReviews = () => {
    // This will be passed to the ReviewForm to refresh the ReviewList after submission
    setShowReviews(true)
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

  if (!shop) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow text-center">
          <p className="text-gray-500">Shop not found</p>
          <button onClick={() => router.push("/")} className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md">
            Go Back Home
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-10">
      <div className="container mx-auto px-4 py-4 max-w-4xl">
        {/* Header with back button */}
        <div className="mb-4">
          <button onClick={() => router.push("/")} className="flex items-center text-blue-600 hover:text-blue-800">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
              <path
                fillRule="evenodd"
                d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L4.414 9H17a1 1 0 110 2H4.414l5.293 5.293a1 1 0 010 1.414z"
                clipRule="evenodd"
              />
            </svg>
            {t('back')}
          </button>
        </div>

        {/* Shop Images */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden mb-6">
          <div className="h-64 md:h-96 relative">
            <ImageCarousel images={shop.images} alt={shop.name} />
          </div>
        </div>

        {/* Shop Details */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="p-6">
            <div className="flex justify-between items-start">
              <h1 className="text-2xl font-bold text-gray-800 mb-2">{shop.name}</h1>
              <div className="flex items-center">
                <button
                  onClick={handleLikeShop}
                  className={`flex items-center gap-1 px-3 py-1.5 rounded-full transition-colors ${
                    isLiked ? "bg-red-100 text-red-600 hover:bg-red-200" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  }`}
                  aria-label={isLiked ? "Unlike shop" : "Like shop"}
                >
                  <Heart className={`h-4 w-4 ${isLiked ? "fill-red-600 text-red-600" : ""}`} />
                  <span className="text-sm font-medium">{likesCount}</span>
                </button>
              </div>
            </div>

            <div className="flex flex-wrap gap-2 mb-4">
              <span className="px-2 py-1 bg-blue-100 text-blue-800 text-sm rounded-full">
                {CATEGORIES.find((c) => c.id === shop.category)?.name}
              </span>
              <span className="px-2 py-1 bg-green-100 text-green-800 text-sm rounded-full">
                {DISTRICTS.find((d) => d.id === shop.district)?.name}
              </span>
              {shop.establishmentYear && (
                <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-sm rounded-full">
                  Est. {shop.establishmentYear}
                </span>
              )}
            </div>

            <div className="space-y-4 divide-y">
              {/* Owner Information */}
              {shop.ownerName && (
                <div className="pt-4">
                  <h2 className="text-lg font-semibold text-gray-700 mb-2">Owner Information</h2>
                  <p className="text-gray-600">{shop.ownerName}</p>
                </div>
              )}

              {/* Business Hours */}
              {shop.businessHours && (
                <div className="pt-4">
                  <h2 className="text-lg font-semibold text-gray-700 mb-2">Business Hours</h2>
                  <p className="text-gray-600 whitespace-pre-line">{shop.businessHours}</p>
                </div>
              )}

              {/* Address */}
              <div className="pt-4">
                <h2 className="text-lg font-semibold text-gray-700 mb-2">Address</h2>
                <div className="flex items-start">
                  <p className="text-gray-600 flex-1">{shop.address}</p>
                  <div className="flex space-x-2">
                    <button
                      onClick={handleCopyAddress}
                      className="p-2 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
                      title="Copy Address"
                    >
                      {addressCopied ? (
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-5 w-5 text-green-600"
                          viewBox="0 0 20 20"
                          fill="currentColor"
                        >
                          <path
                            fillRule="evenodd"
                            d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                            clipRule="evenodd"
                          />
                        </svg>
                      ) : (
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-5 w-5 text-gray-600"
                          viewBox="0 0 20 20"
                          fill="currentColor"
                        >
                          <path d="M8 2a1 1 0 000 2h2a1 1 0 100-2H8z" />
                          <path d="M3 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v6h-4.586l1.293-1.293a1 1 0 00-1.414-1.414l-3 3a1 1 0 000 1.414l3 3a1 1 0 001.414-1.414L10.414 13H15v3a2 2 0 01-2 2H5a2 2 0 01-2-2V5zM15 11h2a1 1 0 110 2h-2v-2z" />
                        </svg>
                      )}
                    </button>
                    <button
                      onClick={handleOpenMap}
                      className="p-2 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
                      title="Open in Maps"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-5 w-5 text-gray-600"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                      >
                        <path
                          fillRule="evenodd"
                          d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>

              {/* Contact Information */}
              <div className="pt-4">
                <h2 className="text-lg font-semibold text-gray-700 mb-2">Contact Information</h2>
                <div className="space-y-2">
                  <div className="flex items-center">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-5 w-5 text-gray-500 mr-2"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
                    </svg>
                    <a href={`tel:${shop.contact}`} className="text-blue-600 hover:underline">
                      {shop.contact}
                    </a>
                  </div>

                  {shop.alternateContact && (
                    <div className="flex items-center">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-5 w-5 text-gray-500 mr-2"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                      >
                        <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
                      </svg>
                      <a href={`tel:${shop.alternateContact}`} className="text-blue-600 hover:underline">
                        {shop.alternateContact} (Alternate)
                      </a>
                    </div>
                  )}

                  {shop.email && (
                    <div className="flex items-center">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-5 w-5 text-gray-500 mr-2"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                      >
                        <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                        <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                      </svg>
                      <a href={`mailto:${shop.email}`} className="text-blue-600 hover:underline">
                        {shop.email}
                      </a>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Call to Action Buttons */}
          <div className="px-6 pb-6 grid grid-cols-3 gap-4">
            <a
              href={`tel:${shop.contact}`}
              className="flex items-center justify-center bg-blue-600 hover:bg-blue-700 text-white py-3 px-4 rounded-md transition-colors text-center font-medium"
            >
              <Phone className="h-5 w-5 inline-block mr-2" />
              {t('call')}
            </a>
            <button
              onClick={handleWhatsAppContact}
              className="flex items-center justify-center bg-green-600 hover:bg-green-700 text-white py-3 px-4 rounded-md transition-colors text-center font-medium"
            >
              <MessageCircle className="h-5 w-5 inline-block mr-2" />
              {t('whatsapp')}
            </button>
            <button
              onClick={() => setShowReviews(!showReviews)}
              className="flex items-center justify-center bg-yellow-500 hover:bg-yellow-600 text-white py-3 px-4 rounded-md transition-colors text-center font-medium"
            >
              <Star className="h-5 w-5 inline-block mr-2" />
              {t('review')}
            </button>
          </div>
        </div>
      </div>

      {/* Reviews Section */}
      {showReviews && (
        <div className="container mx-auto px-4 py-4 max-w-4xl mt-6">
          <ReviewForm shopId={shopId} shopName={shop?.name || ""} onReviewAdded={refreshReviews} />
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-xl font-semibold mb-4">{t('customerReviews')}</h3>
            <ReviewList shopId={shopId} />
          </div>
        </div>
      )}
    </div>
  )
}
