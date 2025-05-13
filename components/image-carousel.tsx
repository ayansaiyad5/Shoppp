"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"

interface ImageCarouselProps {
  images: string[]
  alt: string
}

export function ImageCarousel({ images, alt }: ImageCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(false)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)

  // Reset loading state when images change
  useEffect(() => {
    setIsLoading(true)
    setError(false)

    // Clear any existing interval
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }

    // Auto-rotate images if there are multiple
    if (images && images.length > 1) {
      intervalRef.current = setInterval(() => {
        setCurrentIndex((prevIndex) => (prevIndex === images.length - 1 ? 0 : prevIndex + 1))
      }, 5000)
    }

    // Cleanup interval on unmount
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [images])

  // If no images provided, show a placeholder
  if (!images || images.length === 0) {
    return (
      <div className="h-full w-full relative bg-gray-200 rounded-md flex items-center justify-center">
        <div className="text-gray-400 text-xs">No image</div>
      </div>
    )
  }

  const handlePrevious = (e: React.MouseEvent) => {
    e.stopPropagation()
    setCurrentIndex((prevIndex) => (prevIndex === 0 ? images.length - 1 : prevIndex - 1))
  }

  const handleNext = (e: React.MouseEvent) => {
    e.stopPropagation()
    setCurrentIndex((prevIndex) => (prevIndex === images.length - 1 ? 0 : prevIndex + 1))
  }

  const handleImageLoad = () => {
    setIsLoading(false)
  }

  const handleImageError = () => {
    setIsLoading(false)
    setError(true)
  }

  return (
    <div className="h-full w-full relative bg-gray-100 rounded-t-md overflow-hidden">
      {/* Loading indicator */}
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
          <div className="animate-spin rounded-full h-5 w-5 border-2 border-gray-300 border-t-blue-600"></div>
        </div>
      )}

      {/* Error fallback */}
      {error && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-200">
          <div className="text-gray-500 text-xs">Failed to load</div>
        </div>
      )}

      {/* Image */}
      <div className={`h-full w-full ${isLoading ? "opacity-0" : "opacity-100"} transition-opacity duration-300`}>
        <img
          src={images[currentIndex] || "/placeholder.svg"}
          alt={`${alt} - Image ${currentIndex + 1}`}
          className="h-full w-full object-cover object-center"
          loading="lazy"
          decoding="async"
          onLoad={handleImageLoad}
          onError={handleImageError}
        />
      </div>

      {/* Navigation buttons - only show if there are multiple images */}
      {images.length > 1 && (
        <>
          <button
            onClick={handlePrevious}
            className="absolute left-1 top-1/2 -translate-y-1/2 bg-black bg-opacity-50 text-white p-0.5 rounded-full z-10 w-5 h-5 flex items-center justify-center"
            aria-label="Previous image"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
              <path
                fillRule="evenodd"
                d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z"
                clipRule="evenodd"
              />
            </svg>
          </button>
          <button
            onClick={handleNext}
            className="absolute right-1 top-1/2 -translate-y-1/2 bg-black bg-opacity-50 text-white p-0.5 rounded-full z-10 w-5 h-5 flex items-center justify-center"
            aria-label="Next image"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
              <path
                fillRule="evenodd"
                d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
                clipRule="evenodd"
              />
            </svg>
          </button>
        </>
      )}

      {/* Image indicators - only show if there are multiple images */}
      {images.length > 1 && (
        <div className="absolute bottom-1 left-0 right-0 flex justify-center space-x-1 z-10">
          {images.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentIndex(index)}
              className={`h-1.5 w-1.5 rounded-full ${index === currentIndex ? "bg-white" : "bg-white bg-opacity-50"}`}
              aria-label={`Go to image ${index + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  )
}

