"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { auth } from "@/lib/firebase"
import { addReview } from "@/lib/firebase"
import { useLanguage } from "@/contexts/language-context"
import { Clipboard, Star } from "lucide-react"

interface ReviewFormProps {
  shopId: string
  shopName: string
  onReviewAdded: () => void
}

export function ReviewForm({ shopId, shopName, onReviewAdded }: ReviewFormProps) {
  const [rating, setRating] = useState(0)
  const [hoverRating, setHoverRating] = useState(0)
  const [reviewText, setReviewText] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const router = useRouter()
  const { t } = useLanguage()

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault()

    // Check if user is logged in
    if (!auth.currentUser) {
      toast.error("Please login to submit your review")
      setTimeout(() => {
        router.push("/shopkeeper/login")
      }, 1500)
      return
    }

    // Validate form
    if (rating === 0) {
      toast.error("Please select a rating")
      return
    }

    if (!reviewText.trim()) {
      toast.error("Please write your review")
      return
    }

    setIsSubmitting(true)

    try {
      const result = await addReview({
        shopId,
        userId: auth.currentUser.uid,
        userName: auth.currentUser.displayName || "Anonymous",
        rating,
        text: reviewText
      })

      if (result.success) {
        toast.success("Review submitted successfully")
        setRating(0)
        setReviewText("")
        onReviewAdded()
      } else {
        toast.error("Failed to submit review")
      }
    } catch (error) {
      console.error("Error submitting review:", error)
      toast.error("Failed to submit review")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6 mb-6">
      <h2 className="text-xl font-semibold mb-4">{t('reviewsFor')} {shopName}</h2>
      
      <div className="mb-6">
        <h3 className="text-lg font-medium mb-4">{t('writeReview')}</h3>
        
        <form onSubmit={handleSubmitReview}>
          <div className="mb-4">
            <label className="block text-gray-700 font-medium mb-2">
              {t('yourRating')}<span className="text-red-500">*</span>
            </label>
            <div className="flex space-x-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHoverRating(star)}
                  onMouseLeave={() => setHoverRating(0)}
                  className="focus:outline-none"
                >
                  <Star
                    size={24}
                    className={`transition-colors ${
                      (hoverRating ? hoverRating >= star : rating >= star)
                        ? "text-yellow-400 fill-yellow-400"
                        : "text-gray-300"
                    }`}
                  />
                </button>
              ))}
            </div>
          </div>
          
          <div className="mb-4">
            <label htmlFor="reviewText" className="block text-gray-700 font-medium mb-2">
              {t('yourReview')}<span className="text-red-500">*</span>
            </label>
            <textarea
              id="reviewText"
              value={reviewText}
              onChange={(e) => setReviewText(e.target.value)}
              placeholder="Share your experience with this shop..."
              className="w-full border border-gray-300 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent min-h-[100px]"
            ></textarea>
          </div>
          
          <p className="text-sm text-gray-500 mb-4">
            {t('loginToReview')}
          </p>
          
          <button
            type="submit"
            disabled={isSubmitting}
            className="flex items-center justify-center bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-md transition-colors font-medium disabled:bg-blue-300"
          >
            {isSubmitting ? (
              <div className="animate-spin h-5 w-5 border-t-2 border-b-2 border-white rounded-full mr-2"></div>
            ) : (
              <Clipboard className="h-5 w-5 mr-2" />
            )}
            {t('submitReview')}
          </button>
        </form>
      </div>
    </div>
  )
} 