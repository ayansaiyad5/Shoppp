"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { CATEGORIES, STATES, ALL_DISTRICTS } from "@/lib/constants"
import type { Shop, District } from "@/lib/types"
import { ImageCarousel } from "@/components/image-carousel"
import { addShop, getUserShops } from "@/lib/firebase"
import { useLanguage } from "@/contexts/language-context"

// Maximum image size in bytes (1MB)
const MAX_IMAGE_SIZE = 1024 * 1024

export default function ShopkeeperDashboardPage() {
  const router = useRouter()
  const { language, setLanguage, t } = useLanguage()
  const [isAddingShop, setIsAddingShop] = useState(false)
  const [shopName, setShopName] = useState("")
  const [address, setAddress] = useState("")
  const [contact, setContact] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("")
  const [selectedState, setSelectedState] = useState("")
  const [selectedDistrict, setSelectedDistrict] = useState("")
  const [filteredDistricts, setFilteredDistricts] = useState<District[]>([])
  const [imagesPreviews, setImagesPreviews] = useState<string[]>([])
  const [imagesValid, setImagesValid] = useState<boolean[]>([])
  const [myShops, setMyShops] = useState<Shop[]>([])
  const [approvedShops, setApprovedShops] = useState<Shop[]>([])
  const [rejectedShops, setRejectedShops] = useState<Shop[]>([])
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [activeTab, setActiveTab] = useState<"pending" | "approved" | "rejected">("pending")
  const [isLoading, setIsLoading] = useState(false)
  const [isLanguageMenuOpen, setIsLanguageMenuOpen] = useState(false)
  
  // First, add state variables for the new fields after the existing state variables
  const [ownerName, setOwnerName] = useState("")
  const [businessHours, setBusinessHours] = useState("")
  const [alternateContact, setAlternateContact] = useState("")
  const [email, setEmail] = useState("")
  const [establishmentYear, setEstablishmentYear] = useState("")

  // Load current user
  useEffect(() => {
    if (typeof window !== "undefined") {
      const userJson = localStorage.getItem("currentUser")
      if (userJson) {
        const user = JSON.parse(userJson)
        setCurrentUser(user)
      }
    }
  }, [])

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

  // Add a separate effect to check login status only on initial load
  useEffect(() => {
    const checkLogin = () => {
      if (typeof window !== "undefined") {
        const userJson = localStorage.getItem("currentUser")

        if (!userJson) {
          toast.error("Please login to access the dashboard")
          router.push("/shopkeeper/login")
          return false
        }

        try {
          const user = JSON.parse(userJson)
          if (user && user.role === "shopkeeper") {
            return true
          } else {
            toast.error("Unauthorized access. Please login as shopkeeper.")
            router.push("/shopkeeper/login")
            return false
          }
        } catch (e) {
          console.error("Error parsing user data:", e)
          toast.error("Session error. Please login again.")
          router.push("/shopkeeper/login")
          return false
        }
      }
      return false
    }

    // Only check login status on initial component mount
    checkLogin()
  }, [router])

  // Load my shops from localStorage
  useEffect(() => {
    if (!currentUser) return

    if (typeof window !== "undefined") {
      // Load pending shops
      const storedPendingShops = localStorage.getItem("pendingShops")
      if (storedPendingShops) {
        const allShops = JSON.parse(storedPendingShops)
        // Filter shops by current user and not approved and not rejected
        const userPendingShops = allShops.filter(
          (shop: Shop) => shop.ownerId === currentUser.id && !shop.isApproved && !shop.isRejected,
        )
        setMyShops(userPendingShops)

        // Filter rejected shops
        const userRejectedShops = allShops.filter((shop: Shop) => shop.ownerId === currentUser.id && shop.isRejected)
        setRejectedShops(userRejectedShops)
      }

      // Load approved shops
      const storedApprovedShops = localStorage.getItem("approvedShops")
      if (storedApprovedShops) {
        const allApprovedShops = JSON.parse(storedApprovedShops)
        // Filter shops by current user
        const userApprovedShops = allApprovedShops.filter((shop: Shop) => shop.ownerId === currentUser.id)
        setApprovedShops(userApprovedShops)
      }
    }
  }, [currentUser])

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
        setIsSubmitting(false)
        return
      }

      if (!shopName || !address || !selectedCategory || !selectedState || !selectedDistrict || !ownerName || !businessHours) {
        toast.error("Please fill all required fields")
        setIsSubmitting(false)
        return
      }

      // Validate phone number
      if (!contact || contact.length !== 10 || !/^\d{10}$/.test(contact)) {
        toast.error("Please enter a valid 10-digit phone number")
        setIsSubmitting(false)
        return
      }

      // Validate minimum number of images
      if (imagesPreviews.length < 2) {
        toast.error("Please upload at least 2 images")
        setIsSubmitting(false)
        return
      }

      // Validate image sizes
      if (!areAllImagesValid()) {
        toast.error("One or more images exceed the 1MB size limit. Please remove or replace them.")
        setIsSubmitting(false)
        return
      }

      // Create new shop request
      const shopData: Omit<Shop, 'id'> = {
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

      // Save shop to Firestore
      const result = await addShop(shopData)
      
      if (!result.success) {
        toast.error("Failed to add shop. Please try again.")
        setIsSubmitting(false)
        return
      }

      // Also add to localStorage for backwards compatibility
      if (typeof window !== "undefined") {
        try {
          const storedShops = localStorage.getItem("pendingShops")
          const pendingShops = storedShops ? JSON.parse(storedShops) : []
          const newShop = { ...shopData, id: result.id as string }
          const updatedShops = [...pendingShops, newShop]
          localStorage.setItem("pendingShops", JSON.stringify(updatedShops))

          // Update my shops list
          setMyShops((prevShops) => [...prevShops, newShop as Shop])
        } catch (storageError) {
          console.error("LocalStorage error:", storageError)
          // If localStorage fails, we still have the shop in Firestore, so don't show error
        }
      }

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
      setOwnerName("")
      setBusinessHours("")
      setAlternateContact("")
      setEmail("")
      setEstablishmentYear("")
      setIsAddingShop(false)

      toast.success("Shop added successfully! Waiting for admin approval.")
    } catch (error) {
      console.error("Error adding shop:", error)
      toast.error("An error occurred while adding the shop")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleLogout = () => {
    // Clear all session data
    localStorage.removeItem("currentUser")
    localStorage.removeItem("sessionTimestamp")

    // Show logout confirmation
    toast.success("You have been logged out successfully")

    // Redirect to home page
    router.push("/home")
  }

  // Update loadMyShops function to fetch from Firestore
  const fetchShops = async () => {
    if (!currentUser) return;
    
    setIsLoading(true);
    try {
      // Fetch pending shops
      const pendingResult = await getUserShops(currentUser.id, "pending");
      if (pendingResult.success && pendingResult.shops) {
        setMyShops(pendingResult.shops);
        
        // Update localStorage to match Firestore state
        localStorage.setItem("pendingShops", JSON.stringify(pendingResult.shops));
      }
      
      // Fetch approved shops
      const approvedResult = await getUserShops(currentUser.id, "approved");
      if (approvedResult.success && approvedResult.shops) {
        setApprovedShops(approvedResult.shops);
        
        // Get existing approved shops from localStorage
        const storedApprovedShops = localStorage.getItem("approvedShops");
        let existingApprovedShops = storedApprovedShops ? JSON.parse(storedApprovedShops) : [];
        
        // Filter out user's shops from existing approved shops to avoid duplicates
        existingApprovedShops = existingApprovedShops.filter(
          (shop: Shop) => shop.ownerId !== currentUser.id
        );
        
        // Combine with newly fetched shops
        const combinedApprovedShops = [...existingApprovedShops, ...approvedResult.shops];
        
        // Update localStorage
        localStorage.setItem("approvedShops", JSON.stringify(combinedApprovedShops));
      }
      
      // Fetch rejected shops
      const rejectedResult = await getUserShops(currentUser.id, "rejected");
      if (rejectedResult.success && rejectedResult.shops) {
        setRejectedShops(rejectedResult.shops);
      }
    } catch (error) {
      console.error("Error fetching shops:", error);
      toast.error("Failed to load your shops");
    } finally {
      setIsLoading(false);
    }
  };

  // Update the useEffect that loads shops to use the new fetchShops function
  useEffect(() => {
    if (currentUser) {
      fetchShops();
    }
  }, [currentUser]);

  // Add a refresh function that the user can call manually
  const refreshShopStatus = () => {
    if (currentUser) {
      toast.info("Refreshing shop status...");
      fetchShops();
    }
  };

  // Close language menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement
      if (!target.closest(".language-menu-container")) {
        setIsLanguageMenuOpen(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [])

  // Function to get language display name
  const getLanguageDisplayName = (lang: string) => {
    switch (lang) {
      case "en":
        return "English"
      case "gu":
        return "ગુજરાતી"
      case "hi":
        return "हिंदी"
      default:
        return "English"
    }
  }

  // Function to get language flag emoji
  const getLanguageFlag = (lang: string) => {
    switch (lang) {
      case "en":
        return "🇬🇧"
      case "gu":
        return "🇮🇳"
      case "hi":
        return "🇮🇳"
      default:
        return "🇬🇧"
    }
  }

  const handleEditShop = (shop: Shop) => {
    // Implement shop editing functionality
    toast.info("Edit functionality will be implemented soon")
  }

  const handleDeleteShop = (shopId: string) => {
    // Implement shop deletion functionality
    toast.info("Delete functionality will be implemented soon")
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="container mx-auto px-4 py-6 flex justify-between items-center">
          <div className="flex items-center">
            <a href="/home" className="mr-4 flex items-center text-gray-600 hover:text-gray-800">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
                <path
                  fillRule="evenodd"
                  d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L4.414 9H17a1 1 0 110 2H4.414l5.293 5.293a1 1 0 010 1.414z"
                  clipRule="evenodd"
                />
              </svg>
              {t("back")}
            </a>
            <h1 className="text-2xl font-bold text-gray-800">{t("myShops")}</h1>
          </div>
          <div className="flex items-center gap-4">
            {currentUser && (
              <span className="text-gray-600">
                {t("welcome")}, {currentUser.name}
              </span>
            )}

            {/* Redesigned Language Selector */}
            <div className="relative language-menu-container">
              <button
                onClick={() => setIsLanguageMenuOpen(!isLanguageMenuOpen)}
                className="flex items-center gap-2 px-3 py-2 rounded-full bg-blue-50 hover:bg-blue-100 transition-colors border border-blue-200"
              >
                <span className="text-lg">{getLanguageFlag(language)}</span>
                <span className="font-medium text-blue-700 text-sm hidden sm:inline">
                  {getLanguageDisplayName(language)}
                </span>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className={`h-4 w-4 text-blue-600 transition-transform ${isLanguageMenuOpen ? "rotate-180" : ""}`}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {isLanguageMenuOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg border border-gray-200 overflow-hidden z-20">
                  <div className="py-2">
                    <h3 className="px-4 py-1 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      {t("selectLanguage")}
                    </h3>

                    <button
                      onClick={() => {
                        setLanguage("en")
                        setIsLanguageMenuOpen(false)
                        toast.success("Language changed to English")
                      }}
                      className={`w-full text-left px-4 py-2 hover:bg-blue-50 flex items-center gap-3 ${
                        language === "en" ? "bg-blue-50" : ""
                      }`}
                    >
                      <span className="text-lg">🇬🇧</span>
                      <span className={language === "en" ? "font-medium text-blue-700" : ""}>English</span>
                      {language === "en" && (
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-4 w-4 text-blue-600 ml-auto"
                          viewBox="0 0 20 20"
                          fill="currentColor"
                        >
                          <path
                            fillRule="evenodd"
                            d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                            clipRule="evenodd"
                          />
                        </svg>
                      )}
                    </button>

                    <button
                      onClick={() => {
                        setLanguage("gu")
                        setIsLanguageMenuOpen(false)
                        toast.success("ભાષા ગુજરાતીમાં બદલાઈ")
                      }}
                      className={`w-full text-left px-4 py-2 hover:bg-blue-50 flex items-center gap-3 ${
                        language === "gu" ? "bg-blue-50" : ""
                      }`}
                    >
                      <span className="text-lg">🇮🇳</span>
                      <span className={language === "gu" ? "font-medium text-blue-700" : ""}>ગુજરાતી</span>
                      {language === "gu" && (
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-4 w-4 text-blue-600 ml-auto"
                          viewBox="0 0 20 20"
                          fill="currentColor"
                        >
                          <path
                            fillRule="evenodd"
                            d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                            clipRule="evenodd"
                          />
                        </svg>
                      )}
                    </button>

                    <button
                      onClick={() => {
                        setLanguage("hi")
                        setIsLanguageMenuOpen(false)
                        toast.success("भाषा हिंदी में बदली गई")
                      }}
                      className={`w-full text-left px-4 py-2 hover:bg-blue-50 flex items-center gap-3 ${
                        language === "hi" ? "bg-blue-50" : ""
                      }`}
                    >
                      <span className="text-lg">🇮🇳</span>
                      <span className={language === "hi" ? "font-medium text-blue-700" : ""}>हिंदी</span>
                      {language === "hi" && (
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-4 w-4 text-blue-600 ml-auto"
                          viewBox="0 0 20 20"
                          fill="currentColor"
                        >
                          <path
                            fillRule="evenodd"
                            d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                            clipRule="evenodd"
                          />
                        </svg>
                      )}
                    </button>
                  </div>
                </div>
              )}
            </div>

            <button onClick={handleLogout} className="p-2 rounded-md hover:bg-gray-100 transition-colors">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6 text-gray-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                />
              </svg>
            </button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {!isAddingShop ? (
          <button
            onClick={() => setIsAddingShop(true)}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white py-4 rounded-lg shadow flex items-center justify-center mb-8"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6 mr-2"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            {t("addNewShop")}
          </button>
        ) : (
          <div className="bg-white rounded-lg shadow p-6 mb-8">
            <h2 className="text-xl font-semibold text-gray-800 mb-6">
              {t("addNewShop")}
            </h2>

            <form onSubmit={handleAddShop} className="space-y-6">
              <div>
                <label htmlFor="shopName" className="block text-sm font-medium text-gray-700 mb-1">
                  {t("shopName")}*
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-5 w-5 text-gray-400"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" />
                    </svg>
                  </div>
                  <input
                    id="shopName"
                    type="text"
                    value={shopName}
                    onChange={(e) => setShopName(e.target.value)}
                    className="pl-10 w-full py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter shop name"
                    required
                  />
                </div>
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
                        <div key={index} className="relative h-32">
                          <img
                            src={preview || "/placeholder.svg"}
                            alt={`Preview ${index + 1}`}
                            className={`h-full w-full object-cover rounded-md ${!imagesValid[index] ? "border-2 border-red-500" : ""}`}
                          />
                          {!imagesValid[index] && (
                            <div className="absolute bottom-0 left-0 right-0 bg-red-500 text-white text-xs p-1 text-center">
                              Too large
                            </div>
                          )}
                          <button
                            type="button"
                            onClick={() => handleRemoveImage(index)}
                            className="absolute top-1 right-1 bg-red-600 text-white p-1 rounded-full"
                          >
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              className="h-4 w-4"
                              viewBox="0 0 20 20"
                              fill="currentColor"
                            >
                              <path
                                fillRule="evenodd"
                                d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                                clipRule="evenodd"
                              />
                            </svg>
                          </button>
                        </div>
                      ))}

                      {/* Add more images if less than 3 */}
                      {imagesPreviews.length < 3 && (
                        <label className="flex flex-col items-center justify-center h-32 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100">
                          <div className="flex flex-col items-center justify-center p-2 text-center">
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              className="w-8 h-8 mb-1 text-gray-400"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                              />
                            </svg>
                            <p className="text-xs text-gray-500">Add Image</p>
                          </div>
                          <input type="file" className="hidden" accept="image/*" onChange={handleImageChange} />
                        </label>
                      )}
                    </div>
                  )}

                  {/* Initial upload area when no images */}
                  {imagesPreviews.length === 0 && (
                    <div className="flex justify-center items-center w-full">
                      <label className="flex flex-col items-center justify-center w-full h-48 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100">
                        <div className="flex flex-col items-center justify-center pt-5 pb-6">
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="w-10 h-10 mb-3 text-gray-400"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                            />
                          </svg>
                          <p className="mb-2 text-sm text-gray-500">
                            <span className="font-semibold">Click to upload</span> or drag and drop
                          </p>
                          <p className="text-xs text-gray-500">PNG, JPG or JPEG (MAX. 1MB each)</p>
                          <p className="text-xs text-gray-500 font-semibold mt-1">Upload 2-3 images</p>
                        </div>
                        <input
                          id="dropzone-file"
                          type="file"
                          className="hidden"
                          accept="image/*"
                          onChange={handleImageChange}
                          multiple
                        />
                      </label>
                    </div>
                  )}
                </div>
                {imagesPreviews.length > 0 && imagesPreviews.length < 2 && (
                  <p className="mt-1 text-sm text-red-600">Please upload at least 2 images</p>
                )}
                {!areAllImagesValid() && (
                  <p className="mt-1 text-sm text-red-600">One or more images exceed the 1MB size limit</p>
                )}
              </div>

              <div>
                <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-1">
                  {t("address")}*
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-5 w-5 text-gray-400"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path
                        fillRule="evenodd"
                        d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                  <textarea
                    id="address"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    className="pl-10 w-full py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter shop address"
                    rows={3}
                    required
                  />
                </div>
              </div>

              <div>
                <label htmlFor="contact" className="block text-sm font-medium text-gray-700 mb-1">
                  {t("contact")}* (10 digits)
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-5 w-5 text-gray-400"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
                    </svg>
                  </div>
                  <input
                    id="contact"
                    type="tel"
                    value={contact}
                    onChange={(e) => {
                      // Only allow digits
                      const value = e.target.value.replace(/\D/g, "")
                      // Limit to 10 digits
                      if (value.length <= 10) {
                        setContact(value)
                      }
                    }}
                    pattern="[0-9]{10}"
                    maxLength={10}
                    className="pl-10 w-full py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter 10 digit number"
                    required
                  />
                </div>
                {contact && contact.length !== 10 && (
                  <p className="mt-1 text-sm text-red-600">Phone number must be exactly 10 digits</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">{t("category")}*</label>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                  {CATEGORIES.map((category) => (
                    <button
                      key={category.id}
                      type="button"
                      onClick={() => setSelectedCategory(category.id)}
                      className={`flex flex-col items-center justify-center p-3 rounded-md transition-colors ${
                        selectedCategory === category.id
                          ? "bg-blue-600 text-white"
                          : "bg-gray-100 text-gray-800 hover:bg-gray-200"
                      }`}
                    >
                      <span className="text-2xl mb-2">{getCategoryIcon(category.icon)}</span>
                      <span className="text-xs">{category.name}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label htmlFor="state" className="block text-sm font-medium text-gray-700 mb-2">{t("state")}*</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-5 w-5 text-gray-400"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path d="M9 6a3 3 0 100-6 3 3 0 000 6z" />
                      <path fillRule="evenodd" d="M17.707 9.293a1 1 0 010 1.414l-7 7a1 1 0 01-1.414 0l-7-7A.997.997 0 012 10V5a3 3 0 013-3h5a.996.996 0 01.707.293l7 7z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <select
                    id="state"
                    value={selectedState}
                    onChange={(e) => setSelectedState(e.target.value)}
                    className="pl-10 w-full py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                </div>

              <div>
                <label htmlFor="district" className="block text-sm font-medium text-gray-700 mb-2">{t("district")}*</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-5 w-5 text-gray-400"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <select
                    id="district"
                    value={selectedDistrict}
                    onChange={(e) => setSelectedDistrict(e.target.value)}
                    className="pl-10 w-full py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                    disabled={!selectedState}
                  >
                    <option value="">{selectedState ? t("selectCity") : t("pleaseSelectState")}</option>
                    {filteredDistricts.map((district) => (
                      <option key={district.id} value={district.id}>
                        {district.name}
                      </option>
                    ))}
                  </select>
                  </div>
              </div>

              <div>
                <label htmlFor="ownerName" className="block text-sm font-medium text-gray-700 mb-1">
                  Owner Name*
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-5 w-5 text-gray-400"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path
                        fillRule="evenodd"
                        d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                  <input
                    id="ownerName"
                    type="text"
                    value={ownerName}
                    onChange={(e) => setOwnerName(e.target.value)}
                    className="pl-10 w-full py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter owner name"
                    required
                  />
                </div>
              </div>

              <div>
                <label htmlFor="businessHours" className="block text-sm font-medium text-gray-700 mb-1">
                  Business Hours*
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-5 w-5 text-gray-400"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                  <textarea
                    id="businessHours"
                    value={businessHours}
                    onChange={(e) => setBusinessHours(e.target.value)}
                    className="pl-10 w-full py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="e.g., Mon-Sat: 9:00 AM - 6:00 PM, Sun: Closed"
                    rows={2}
                    required
                  />
                </div>
              </div>

              <div>
                <label htmlFor="alternateContact" className="block text-sm font-medium text-gray-700 mb-1">
                  Alternate Contact Number (Optional)
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-5 w-5 text-gray-400"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
                    </svg>
                  </div>
                  <input
                    id="alternateContact"
                    type="tel"
                    value={alternateContact}
                    onChange={(e) => {
                      // Only allow digits
                      const value = e.target.value.replace(/\D/g, "")
                      // Limit to 10 digits
                      if (value.length <= 10) {
                        setAlternateContact(value)
                      }
                    }}
                    pattern="[0-9]{10}"
                    maxLength={10}
                    className="pl-10 w-full py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter alternate 10-digit number (optional)"
                  />
                </div>
                {alternateContact && alternateContact.length !== 10 && alternateContact.length > 0 && (
                  <p className="mt-1 text-sm text-red-600">Phone number must be exactly 10 digits</p>
                )}
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                  Email (Optional)
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-5 w-5 text-gray-400"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                      <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                    </svg>
                  </div>
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10 w-full py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter email address (optional)"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="establishmentYear" className="block text-sm font-medium text-gray-700 mb-1">
                  Year of Establishment (Optional)
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-5 w-5 text-gray-400"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path
                        fillRule="evenodd"
                        d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                  <input
                    id="establishmentYear"
                    type="text"
                    value={establishmentYear}
                    onChange={(e) => {
                      // Only allow digits
                      const value = e.target.value.replace(/\D/g, "")
                      // Limit to 4 digits
                      if (value.length <= 4) {
                        setEstablishmentYear(value)
                      }
                    }}
                    pattern="[0-9]{4}"
                    maxLength={4}
                    className="pl-10 w-full py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter year (e.g., 2010)"
                  />
                </div>
              </div>

              <div className="flex gap-4 pt-4">
                <button
                  type="button"
                  onClick={() => setIsAddingShop(false)}
                  className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-800 py-2 px-4 rounded-md transition-colors"
                >
                  {t("cancel")}
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || imagesPreviews.length < 2 || !areAllImagesValid()}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-md transition-colors disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? t("submitting") : t("submit")}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Tabs for different shop statuses */}
        <div className="flex border-b mb-6">
          <button
            onClick={() => setActiveTab("pending")}
            className={`py-2 px-4 font-medium ${
              activeTab === "pending" ? "text-blue-600 border-b-2 border-blue-600" : "text-gray-500 hover:text-gray-700"
            }`}
          >
            {t("pendingApprovals")} ({myShops.length})
          </button>
          <button
            onClick={() => setActiveTab("approved")}
            className={`py-2 px-4 font-medium ${
              activeTab === "approved"
                ? "text-blue-600 border-b-2 border-blue-600"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            {t("approvedShops")} ({approvedShops.length})
          </button>
          <button
            onClick={() => setActiveTab("rejected")}
            className={`py-2 px-4 font-medium ${
              activeTab === "rejected"
                ? "text-blue-600 border-b-2 border-blue-600"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            {t("rejectedShops")} ({rejectedShops.length})
          </button>
        </div>

        {/* Loading indicator */}
        {isLoading && (
          <div className="flex justify-center my-8">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600"></div>
          </div>
        )}

        {/* Pending Shops Section */}
        {activeTab === "pending" && (
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-6">{t("pendingApprovals")}</h2>

            {myShops.length === 0 ? (
              <p className="text-gray-500 text-center py-8">
                You don't have any pending shops yet. Add a new shop to get started.
              </p>
            ) : (
              <div className="space-y-4">
                {myShops.map((shop) => (
                  <div key={shop.id} className="border rounded-lg p-4">
                    <div className="flex flex-col md:flex-row gap-4">
                      <div className="md:w-1/4 h-40 relative">
                        <ImageCarousel images={shop.images} alt={shop.name} />
                      </div>
                      <div className="md:w-3/4">
                        <h3 className="text-lg font-semibold">{shop.name}</h3>
                        <p className="text-sm text-gray-600 mt-1">{shop.address}</p>
                        <div className="mt-2 flex flex-wrap gap-2 mb-3">
                          <span className="px-2 py-1 bg-purple-100 text-purple-800 text-xs rounded-full">
                            {CATEGORIES.find((c) => c.id === shop.category)?.name}
                          </span>
                          {shop.state && (
                            <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                              {STATES.find((s) => s.id === shop.state)?.name}
                            </span>
                          )}
                          <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                            {ALL_DISTRICTS.find((district) => district.id === shop.district)?.name}
                          </span>
                          <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded-full">
                            Pending Approval
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 mt-2">
                          <span className="font-medium">Images:</span> {shop.images?.length || 0} photos
                        </p>
                        <div className="mt-4 flex flex-wrap gap-2">
                          <button
                            onClick={() => handleEditShop(shop)}
                            className="flex items-center px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors text-sm"
                          >
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              className="h-4 w-4 mr-1"
                              viewBox="0 0 20 20"
                              fill="currentColor"
                            >
                              <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                            </svg>
                            {t("edit")}
                          </button>

                          <button
                            onClick={() => handleDeleteShop(shop.id)}
                            className="flex items-center px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-md transition-colors text-sm"
                          >
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              className="h-4 w-4 mr-1"
                              viewBox="0 0 20 20"
                              fill="currentColor"
                            >
                              <path
                                fillRule="evenodd"
                                d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z"
                                clipRule="evenodd"
                              />
                            </svg>
                            {t("delete")}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Approved Shops Section */}
        {activeTab === "approved" && (
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-6">{t("approvedShops")}</h2>

            {approvedShops.length === 0 ? (
              <p className="text-gray-500 text-center py-8">You don't have any approved shops yet.</p>
            ) : (
              <div className="space-y-4">
                {approvedShops.map((shop) => (
                  <div key={shop.id} className="border rounded-lg p-4">
                    <div className="flex flex-col md:flex-row gap-4">
                      <div className="md:w-1/4 h-40 relative">
                        <ImageCarousel images={shop.images} alt={shop.name} />
                      </div>
                      <div className="md:w-3/4">
                        <h3 className="text-lg font-semibold">{shop.name}</h3>
                        <p className="text-sm text-gray-600 mt-1">{shop.address}</p>
                        <div className="mt-2 flex flex-wrap gap-2 mb-3">
                          <span className="px-2 py-1 bg-purple-100 text-purple-800 text-xs rounded-full">
                            {CATEGORIES.find((c) => c.id === shop.category)?.name}
                          </span>
                          {shop.state && (
                            <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                              {STATES.find((s) => s.id === shop.state)?.name}
                            </span>
                          )}
                          <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                            {ALL_DISTRICTS.find((district) => district.id === shop.district)?.name}
                          </span>
                          <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">Approved</span>
                        </div>
                        <p className="text-sm text-gray-600 mt-2">
                          <span className="font-medium">Images:</span> {shop.images?.length || 0} photos
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Rejected Shops Section */}
        {activeTab === "rejected" && (
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-6">{t("rejectedShops")}</h2>

            {rejectedShops.length === 0 ? (
              <p className="text-gray-500 text-center py-8">You don't have any rejected shops.</p>
            ) : (
              <div className="space-y-4">
                {rejectedShops.map((shop) => (
                  <div key={shop.id} className="border border-red-200 rounded-lg p-4">
                    <div className="flex flex-col md:flex-row gap-4">
                      <div className="md:w-1/4 h-40 relative">
                        <ImageCarousel images={shop.images} alt={shop.name} />
                      </div>
                      <div className="md:w-3/4">
                        <h3 className="text-lg font-semibold">{shop.name}</h3>
                        <p className="text-sm text-gray-600 mt-1">{shop.address}</p>
                        <div className="mt-2 flex flex-wrap gap-2 mb-3">
                          <span className="px-2 py-1 bg-purple-100 text-purple-800 text-xs rounded-full">
                            {CATEGORIES.find((c) => c.id === shop.category)?.name}
                          </span>
                          {shop.state && (
                            <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                              {STATES.find((s) => s.id === shop.state)?.name}
                            </span>
                          )}
                          <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                            {ALL_DISTRICTS.find((district) => district.id === shop.district)?.name}
                          </span>
                          <span className="px-2 py-1 bg-red-100 text-red-800 text-xs rounded-full">Rejected</span>
                        </div>
                        {shop.rejectionReason && (
                          <div className="mt-3 p-3 bg-red-50 border border-red-100 rounded-md">
                            <p className="text-sm font-medium text-red-800">Reason for rejection:</p>
                            <p className="text-sm text-red-700">{shop.rejectionReason}</p>
                          </div>
                        )}
                        <p className="text-sm text-gray-600 mt-2">
                          <span className="font-medium">Images:</span> {shop.images?.length || 0} photos
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </main>
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

