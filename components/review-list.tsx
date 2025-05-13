"use client"

import { useState, useEffect } from "react"
import { getReviewsByShopId } from "@/lib/firebase"
import { type Review } from "@/lib/types"
import { Star } from "lucide-react"
import { useLanguage } from "@/contexts/language-context"

interface ReviewListProps {
  shopId: string
}

export function ReviewList({ shopId }: ReviewListProps) {
  const [reviews, setReviews] = useState<Review[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const { t } = useLanguage()

  useEffect(() => {
    const fetchReviews = async () => {
      setIsLoading(true)
      try {
        const result = await getReviewsByShopId(shopId)
        if (result.success && result.reviews) {
          setReviews(result.reviews)
        }
      } catch (error) {
        console.error("Error fetching reviews:", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchReviews()
  }, [shopId])

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (reviews.length === 0) {
    return (
      <div className="text-center py-8 bg-gray-50 rounded-lg">
        <p className="text-gray-500">{t('noReviewsYet')}</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {reviews.map((review) => (
        <div key={review.id} className="border-b border-gray-200 pb-6 last:border-0">
          <div className="flex justify-between items-start">
            <div>
              <p className="font-medium text-gray-800">{review.userName}</p>
              <div className="flex items-center mt-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star
                    key={star}
                    size={16}
                    className={`${
                      review.rating >= star ? "text-yellow-400 fill-yellow-400" : "text-gray-300"
                    }`}
                  />
                ))}
                <span className="ml-2 text-sm text-gray-500">
                  {new Date(review.createdAt).toLocaleDateString()}
                </span>
              </div>
            </div>
          </div>
          <p className="mt-3 text-gray-600">{review.text}</p>
        </div>
      ))}
    </div>
  )
} 