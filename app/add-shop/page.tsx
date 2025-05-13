"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { CATEGORIES, STATES, ALL_DISTRICTS } from "@/lib/constants"
import type { Shop, District } from "@/lib/types"
import SidebarNavigation from "@/components/sidebar-navigation"
import { useLanguage } from "@/contexts/language-context"

// Maximum image size in bytes (1MB)
const MAX_IMAGE_SIZE = 1024 * 1024

export default function AddShopPage() {
  const router = useRouter()
  const { t } = useLanguage()
  const [shopName, setShopName] = useState("")
  const [address, setAddress] = useState("")
  const [contact, setContact] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("")
  const [selectedState, setSelectedState] = useState("")
  const [selectedDistrict, setSelectedDistrict] = useState("")
  const [filteredDistricts, setFilteredDistricts] = useState<District[]>([])
  const [imagesPreviews, setImagesPreviews] = useState<string[]>([])
  const [imagesValid, setImagesValid] = useState<boolean[]>([])
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Fields for shop details
  const [ownerName, setOwnerName] = useState("")
  const [businessHours, setBusinessHours] = useState("")
  const [alternateContact, setAlternateContact] = useState("")
  const [email, setEmail] = useState("")
  const [establishmentYear, setEstablishmentYear] = useState("")

  // Check if user is logged in
  useEffect(() => {
    if (typeof window !== "undefined") {
      const userJson = localStorage.getItem("currentUser")
      if (userJson) {
        const user = JSON.parse(userJson)
        setCurrentUser(user)
        // Pre-fill owner name if available
        if (user.name) {
          setOwnerName(user.name)
        }
      } else {
        toast.error("Please login to add a shop")
        router.push("/login")
      }
    }
  }, [router])

  // Filter districts based on selected state
  useEffect(() => {
    if (selectedState) {
      const districts = ALL_DISTRICTS.filter(district => district.stateId === selectedState)
      setFilteredDistricts(districts)
      // Reset selected district when state changes
      setSelectedDistrict("")
    } else {
      setFilteredDistricts([])
    }
  }, [selectedState])

  // Check if all images are valid (under 1MB)
  const areAllImagesValid = () => {
    return imagesValid.every((isValid) => isValid)
  }

  // Handle image changes for multiple images
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files) return

    // Check if adding this file would exceed the maximum
    if (imagesPreviews.length + files.length > 3) {
      toast.error("Maximum 3 images allowed")
      return
    }

    // Process each file
    Array.from(files).forEach((file) => {
      // Check file size
      const isValidSize = file.size <= MAX_IMAGE_SIZE

      if (!isValidSize) {
        toast.error(`Image "${file.name}" exceeds 1MB limit. Please resize or choose another image.`)
      }

      // Create a preview URL for the selected image
      const reader = new FileReader()
      reader.onloadend = () => {
        if (typeof reader.result === "string") {
          setImagesPreviews((prev) => [...prev, reader.result as string])
          setImagesValid((prev) => [...prev, isValidSize])
        }
      }
      reader.readAsDataURL(file)
    })
  }

  // Remove an image from the previews
  const handleRemoveImage = (index: number) => {
    setImagesPreviews((prev) => prev.filter((_, i) => i !== index))
    setImagesValid((prev) => prev.filter((_, i) => i !== index))
  }

  // Handle adding a new shop
  const handleAddShop = async (e: React.FormEvent) => {
    e.preventDefault()

    if (isSubmitting) return
    setIsSubmitting(true)

    try {
      if (!currentUser) {
        toast.error("Please login to add a shop")
        return
      }

      if (!shopName || !address || !selectedCategory || !selectedState || !selectedDistrict || !ownerName || !businessHours) {
        toast.error("Please fill all required fields")
        return
      }

      // Validate phone number
      if (!contact || contact.length !== 10 || !/^\d{10}$/.test(contact)) {
        toast.error("Please enter a valid 10-digit phone number")
        return
      }

      // Validate minimum number of images
      if (imagesPreviews.length < 2) {
        toast.error("Please upload at least 2 images")
        return
      }

      // Validate image sizes
      if (!areAllImagesValid()) {
        toast.error("One or more images exceed the 1MB size limit. Please remove or replace them.")
        return
      }

      // Create new shop request
      const newShop: Shop = {
        id: Date.now().toString(),
        name: shopName,
        images: imagesPreviews,
        contact,
        category: selectedCategory,
        district: selectedDistrict,
        state: selectedState,
        address,
        isApproved: false,
        isRejected: false,
        ownerId: currentUser.id, // Use the current user's ID
        createdAt: new Date().toISOString(),
        // Add new fields
        ownerName,
        businessHours,
        alternateContact,
        email,
        establishmentYear,
      }

      // Add to pendingShops in localStorage
      if (typeof window !== "undefined") {
        try {
          const storedShops = localStorage.getItem("pendingShops")
          const pendingShops = storedShops ? JSON.parse(storedShops) : []
          const updatedShops = [...pendingShops, newShop]
          localStorage.setItem("pendingShops", JSON.stringify(updatedShops))

          // Reset form
          setShopName("")
          setAddress("")
          setContact("")
          setSelectedCategory("")
          setSelectedState("")
          setSelectedDistrict("")
          setImagesPreviews([])
          setImagesValid([])
          // Reset new fields
          setBusinessHours("")
          setAlternateContact("")
          setEmail("")
          setEstablishmentYear("")

          toast.success("Shop added successfully! Waiting for admin approval.")
          router.push("/my-shops")
        } catch (storageError) {
          console.error("LocalStorage error:", storageError)
          toast.error("Failed to save shop data. The images might be too large.")
          return
        }
      }
    } catch (error) {
      console.error("Error adding shop:", error)
      toast.error("Failed to add shop. Please try again.")
    } finally {
      setIsSubmitting(false)
    }
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

  return (
    <div className="min-h-screen bg-gray-50">
      <SidebarNavigation />

      <div className="container mx-auto px-4 py-8 pt-16 max-w-3xl">
        <h1 className="text-2xl font-bold text-gray-800 mb-6">{t("addNewShop")}</h1>

        <div className="bg-white rounded-lg shadow p-6">
          <form onSubmit={handleAddShop} className="space-y-6">
            <div>
              <label htmlFor="shopName" className="block text-sm font-medium text-gray-700 mb-1">
                {t("shopName")}*
              </label>
              <input
                id="shopName"
                type="text"
                value={shopName}
                onChange={(e) => setShopName(e.target.value)}
                className="w-full py-2 px-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter shop name"
                required
              />
            </div>

            {/* Shop Images Upload */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t("images")}* (Min: 2, Max: 3, Max size: 1MB each)
              </label>
              <div className="mt-1 flex flex-col items-center">
                {/* Display image previews */}
                {imagesPreviews.length > 0 && (
                  <div className="grid grid-cols-3 gap-2 w-full mb-4">
                    {imagesPreviews.map((preview, index) => (
                      <div key={index} className="relative group">
                        <img
                          src={preview}
                          alt={`Preview ${index + 1}`}
                          className={`h-24 w-full object-cover rounded-md ${
                            !imagesValid[index] ? "border-2 border-red-500" : ""
                          }`}
                        />
                        <button
                          type="button"
                          onClick={() => handleRemoveImage(index)}
                          className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          ×
                        </button>
                        {!imagesValid[index] && (
                          <div className="absolute bottom-0 left-0 right-0 bg-red-500 text-white text-xs px-1 py-0.5 text-center">
                            Too large
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {/* Upload button */}
                {imagesPreviews.length < 3 && (
                  <div className="flex justify-center w-full">
                    <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100">
                      <div className="flex flex-col items-center justify-center pt-5 pb-6">
                        <svg
                          className="w-8 h-8 mb-4 text-gray-500"
                          aria-hidden="true"
                          xmlns="http://www.w3.org/2000/svg"
                          fill="none"
                          viewBox="0 0 20 16"
                        >
                          <path
                            stroke="currentColor"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="M13 13h3a3 3 0 0 0 0-6h-.025A5.56 5.56 0 0 0 16 6.5 5.5 5.5 0 0 0 5.207 5.021C5.137 5.017 5.071 5 5 5a4 4 0 0 0 0 8h2.167M10 15V6m0 0L8 8m2-2 2 2"
                          ></path>
                        </svg>
                        <p className="mb-2 text-sm text-gray-500">
                          <span className="font-semibold">Click to upload</span> or drag and drop
                        </p>
                        <p className="text-xs text-gray-500">PNG, JPG or JPEG (MAX. 1MB)</p>
                      </div>
                      <input
                        id="dropzone-file"
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleImageChange}
                        multiple
                      />
                    </label>
                  </div>
                )}
              </div>
            </div>

            {/* Shop Category */}
            <div>
              <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-1">
                {t("categories")}*
              </label>
              <select
                id="category"
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full py-2 px-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              >
                <option value="">Select a category</option>
                {CATEGORIES.map((category) => (
                  <option key={category.id} value={category.id}>
                    {getCategoryIcon(category.icon)} {category.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Shop State */}
            <div>
              <label htmlFor="state" className="block text-sm font-medium text-gray-700 mb-1">
                {t("selectState")}*
              </label>
              <select
                id="state"
                value={selectedState}
                onChange={(e) => setSelectedState(e.target.value)}
                className="w-full py-2 px-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              >
                <option value="">{t("selectState")}</option>
                {STATES.map((state) => (
                  <option key={state.id} value={state.id}>
                    {state.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Shop City/District */}
            <div>
              <label htmlFor="district" className="block text-sm font-medium text-gray-700 mb-1">
                {t("selectCity")}*
              </label>
              <select
                id="district"
                value={selectedDistrict}
                onChange={(e) => setSelectedDistrict(e.target.value)}
                className="w-full py-2 px-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
                disabled={!selectedState}
              >
                <option value="">
                  {selectedState ? t("selectCity") : t("pleaseSelectState")}
                </option>
                {filteredDistricts.map((district) => (
                  <option key={district.id} value={district.id}>
                    {district.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Shop Address */}
            <div>
              <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-1">
                {t("address")}*
              </label>
              <textarea
                id="address"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                rows={3}
                className="w-full py-2 px-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter full address with landmarks"
                required
              ></textarea>
            </div>

            {/* Shop Contact */}
            <div>
              <label htmlFor="contact" className="block text-sm font-medium text-gray-700 mb-1">
                Contact Number* (10 digits)
              </label>
              <input
                id="contact"
                type="tel"
                pattern="[0-9]{10}"
                value={contact}
                onChange={(e) => setContact(e.target.value)}
                className="w-full py-2 px-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter 10-digit contact number"
                required
              />
            </div>

            {/* Shop Owner Name */}
            <div>
              <label htmlFor="ownerName" className="block text-sm font-medium text-gray-700 mb-1">
                Owner Name*
              </label>
              <input
                id="ownerName"
                type="text"
                value={ownerName}
                onChange={(e) => setOwnerName(e.target.value)}
                className="w-full py-2 px-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter owner name"
                required
              />
            </div>

            {/* Business Hours */}
            <div>
              <label htmlFor="businessHours" className="block text-sm font-medium text-gray-700 mb-1">
                Business Hours*
              </label>
              <input
                id="businessHours"
                type="text"
                value={businessHours}
                onChange={(e) => setBusinessHours(e.target.value)}
                className="w-full py-2 px-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="e.g. Mon-Sat: 9AM-7PM, Sun: Closed"
                required
              />
            </div>

            {/* Additional Fields - These are optional */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="alternateContact" className="block text-sm font-medium text-gray-700 mb-1">
                  Alternate Contact (optional)
              </label>
              <input
                id="alternateContact"
                type="tel"
                  pattern="[0-9]{10}"
                value={alternateContact}
                  onChange={(e) => setAlternateContact(e.target.value)}
                className="w-full py-2 px-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter alternate contact"
              />
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                  Email (optional)
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full py-2 px-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter email address"
              />
            </div>

            <div>
              <label htmlFor="establishmentYear" className="block text-sm font-medium text-gray-700 mb-1">
                  Establishment Year (optional)
              </label>
              <input
                id="establishmentYear"
                type="text"
                value={establishmentYear}
                  onChange={(e) => setEstablishmentYear(e.target.value)}
                className="w-full py-2 px-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter establishment year"
              />
              </div>
            </div>

            <div className="pt-4">
            <button
              type="submit"
                disabled={isSubmitting}
                className={`w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                  isSubmitting ? "opacity-70 cursor-not-allowed" : ""
                }`}
            >
                {isSubmitting ? t("submitting") : t("submit")}
            </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

