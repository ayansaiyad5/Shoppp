"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import type { Shop } from "@/lib/types"
import { CATEGORIES, DISTRICTS } from "@/lib/constants"
import { MOCK_SHOPS } from "@/lib/data"
import { ImageCarousel } from "@/components/image-carousel"
import { AdminAnalytics } from "@/components/admin-analytics"
// Import the AdminStats component at the top with other imports
import { AdminStats } from "@/components/admin-stats"
import { 
  getShopsByStatus, 
  getContactMessages, 
  updateShopStatus, 
  markMessageAsRead as markMessageAsReadFirebase,
  deleteContactMessage
} from "@/lib/firebase"

// Type for contact messages
interface ContactMessage {
  id: string
  name: string
  email: string
  message: string
  date: string
  read: boolean
}

// Maximum image size in bytes (1MB)
const MAX_IMAGE_SIZE = 1024 * 1024

export default function AdminDashboardPage() {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<"pending" | "approved" | "analytics" | "messages">("pending")
  const [pendingShops, setPendingShops] = useState<Shop[]>([])
  const [approvedShops, setApprovedShops] = useState<Shop[]>([])
  const [editingShop, setEditingShop] = useState<Shop | null>(null)
  const [rejectionReason, setRejectionReason] = useState("")
  const [showRejectionModal, setShowRejectionModal] = useState(false)
  const [shopToReject, setShopToReject] = useState<string | null>(null)
  const [imagesPreviews, setImagesPreviews] = useState<string[]>([])
  const [imagesValid, setImagesValid] = useState<boolean[]>([])
  const [contactMessages, setContactMessages] = useState<ContactMessage[]>([])
  const [isLoading, setIsLoading] = useState(true)

  // Load shops and messages from Firebase Firestore
  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true);
        
        if (typeof window !== "undefined") {
          // Fetch pending shops from Firestore
          const pendingResult = await getShopsByStatus("pending");
          if (pendingResult.success && pendingResult.shops) {
            setPendingShops(pendingResult.shops);
            
            // Update localStorage for backward compatibility
            localStorage.setItem("pendingShops", JSON.stringify(pendingResult.shops));
          }

          // Fetch approved shops from Firestore
          const approvedResult = await getShopsByStatus("approved");
          if (approvedResult.success && approvedResult.shops) {
            setApprovedShops(approvedResult.shops);
            
            // Update localStorage for backward compatibility
            localStorage.setItem("approvedShops", JSON.stringify(approvedResult.shops));
          } else {
            // Initialize with mock data only if no approved shops exist
            setApprovedShops(MOCK_SHOPS);
            localStorage.setItem("approvedShops", JSON.stringify(MOCK_SHOPS));
          }

          // Fetch contact messages from Firestore
          const messagesResult = await getContactMessages();
          if (messagesResult.success && messagesResult.messages) {
            setContactMessages(messagesResult.messages);
          }
        }
      } catch (error) {
        console.error("Error loading data:", error);
        toast.error("Error loading data. Please try again.");
      } finally {
        setIsLoading(false);
      }
    };

    // Add a separate effect to check login status only on initial load
    const checkLogin = () => {
      if (typeof window !== "undefined") {
        // Check if admin is logged in
        const isAdminLoggedIn = localStorage.getItem("adminLoggedIn")
        const currentUser = localStorage.getItem("currentUser")

        let isAuthorized = false

        if (isAdminLoggedIn === "true") {
          isAuthorized = true
        } else if (currentUser) {
          try {
            const user = JSON.parse(currentUser)
            if (user && user.role === "admin") {
              isAuthorized = true
            }
          } catch (e) {
            console.error("Error parsing user data:", e)
          }
        }

        if (!isAuthorized) {
          toast.error("Unauthorized access. Please login as admin.")
          router.push("/admin/login")
          return false
        }

        return true
      }
      return false
    }

    // Check login and only load data if authorized
    const isAuthorized = checkLogin()
    if (isAuthorized) {
      loadData()
    }
  }, [router])

  // Set images when editing a shop
  useEffect(() => {
    if (editingShop) {
      setImagesPreviews(editingShop.images || [])
      setImagesValid(editingShop.images.map(() => true))
    } else {
      setImagesPreviews([])
      setImagesValid([])
    }
  }, [editingShop])

  // Check if all images are valid (under 1MB)
  const areAllImagesValid = () => {
    return imagesValid.every((isValid) => isValid)
  }

  // Handle image changes for multiple images
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || !editingShop) return

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

  const handleApprove = async (shopId: string) => {
    try {
      // Find the shop to approve
      const shopToApprove = pendingShops.find((shop) => shop.id === shopId);
      if (!shopToApprove) return;

      // Check if shop has at least 2 images
      if (!shopToApprove.images || shopToApprove.images.length < 2) {
        toast.error("Shop must have at least 2 images to be approved");
        return;
      }

      // Update shop status in Firestore
      const result = await updateShopStatus(shopId, true, false);
      if (!result.success) {
        toast.error("Failed to update shop status");
        return;
      }

      // Update the shop status in state
      const updatedShop = { ...shopToApprove, isApproved: true, isRejected: false };

      // Remove from pending and add to approved
      const updatedPendingShops = pendingShops.filter((shop) => shop.id !== shopId);
      const updatedApprovedShops = [...approvedShops, updatedShop];

      // Update state
      setPendingShops(updatedPendingShops);
      setApprovedShops(updatedApprovedShops);

      // Update localStorage for both pendingShops and approvedShops (for backward compatibility)
      if (typeof window !== "undefined") {
        try {
          // Get all pending shops
          const allPendingShops = JSON.parse(localStorage.getItem("pendingShops") || "[]");

          // Update the specific shop to be approved
          const updatedAllPendingShops = allPendingShops.map((shop: Shop) =>
            shop.id === shopId ? { ...shop, isApproved: true, isRejected: false } : shop
          );

          // Store the updated pending shops (with the approved flag)
          localStorage.setItem("pendingShops", JSON.stringify(updatedAllPendingShops));

          // Update approved shops in localStorage
          localStorage.setItem("approvedShops", JSON.stringify(updatedApprovedShops));
        } catch (storageError) {
          console.error("LocalStorage error:", storageError);
          toast.error("Failed to update storage. The data might be too large.");
        }
      }

      toast.success("Shop approved successfully");
    } catch (error) {
      console.error("Error approving shop:", error);
      toast.error("Failed to approve shop. Please try again.");
    }
  };

  const openRejectModal = (shopId: string) => {
    setShopToReject(shopId)
    setRejectionReason("")
    setShowRejectionModal(true)
  }

  const handleReject = async () => {
    if (!shopToReject) return;

    try {
      // Find the shop to reject
      const shopToRejectObj = pendingShops.find((shop) => shop.id === shopToReject);
      if (!shopToRejectObj) return;

      // Update shop status in Firestore with rejection reason
      const result = await updateShopStatus(
        shopToReject,
        false,
        true,
        rejectionReason || "Not approved by admin"
      );
      
      if (!result.success) {
        toast.error("Failed to update shop status");
        return;
      }

      // Update the shop status with rejection reason
      const updatedShop = {
        ...shopToRejectObj,
        isApproved: false,
        isRejected: true,
        rejectionReason: rejectionReason || "Not approved by admin",
      };

      // Update pending shops list in state
      const updatedPendingShops = pendingShops.filter((shop) => shop.id !== shopToReject);
      setPendingShops(updatedPendingShops);

      // Update localStorage
      if (typeof window !== "undefined") {
        try {
          const allPendingShops = JSON.parse(localStorage.getItem("pendingShops") || "[]");
          const updatedAllPendingShops = allPendingShops.map((shop: Shop) =>
            shop.id === shopToReject
              ? { ...shop, isApproved: false, isRejected: true, rejectionReason }
              : shop
          );
          localStorage.setItem("pendingShops", JSON.stringify(updatedAllPendingShops));
        } catch (storageError) {
          console.error("LocalStorage error:", storageError);
          toast.error("Failed to update storage.");
        }
      }

      // Close modal and clear state
      setShowRejectionModal(false);
      setShopToReject(null);
      setRejectionReason("");
      toast.success("Shop rejected successfully");
    } catch (error) {
      console.error("Error rejecting shop:", error);
      toast.error("Failed to reject shop. Please try again.");
    }
  };

  const handleDeleteApproved = (shopId: string) => {
    const updatedShops = approvedShops.filter((shop) => shop.id !== shopId)
    setApprovedShops(updatedShops)

    if (typeof window !== "undefined") {
      localStorage.setItem("approvedShops", JSON.stringify(updatedShops))
    }

    toast.success("Shop deleted successfully")
  }

  const handleEditShop = (shop: Shop) => {
    setEditingShop(shop)
  }

  const handleSaveEdit = (updatedShop: Shop) => {
    // Validate phone number
    if (!updatedShop.contact || updatedShop.contact.length !== 10 || !/^\d{10}$/.test(updatedShop.contact)) {
      toast.error("Please enter a valid 10-digit phone number")
      return
    }

    // Validate images
    if (!imagesPreviews || imagesPreviews.length < 2) {
      toast.error("Shop must have at least 2 images")
      return
    }

    // Check if all images are valid
    if (!areAllImagesValid()) {
      toast.error("One or more images exceed the 1MB size limit. Please remove or replace them.")
      return
    }

    // Update the shop with new images
    const shopWithUpdatedImages = {
      ...updatedShop,
      images: imagesPreviews,
    }

    const updatedShops = approvedShops.map((shop) => (shop.id === updatedShop.id ? shopWithUpdatedImages : shop))

    setApprovedShops(updatedShops)

    if (typeof window !== "undefined") {
      localStorage.setItem("approvedShops", JSON.stringify(updatedShops))
    }

    setEditingShop(null)
    toast.success("Shop updated successfully")
  }

  const handleCancelEdit = () => {
    setEditingShop(null)
    setImagesPreviews([])
    setImagesValid([])
  }

  const handleLogout = () => {
    localStorage.removeItem("adminLoggedIn")
    localStorage.removeItem("currentUser")
    router.push("/home")
  }

  // Mark message as read
  const markMessageAsRead = async (messageId: string) => {
    try {
      // Update in Firestore
      const result = await markMessageAsReadFirebase(messageId);
      if (!result.success) {
        toast.error("Failed to mark message as read");
        return;
      }

      // Update in state
      const updatedMessages = contactMessages.map((msg) =>
        msg.id === messageId ? { ...msg, read: true } : msg
      );
      setContactMessages(updatedMessages);

      // Update localStorage for backward compatibility
      if (typeof window !== "undefined") {
        localStorage.setItem("contactMessages", JSON.stringify(updatedMessages));
      }
    } catch (error) {
      console.error("Error marking message as read:", error);
      toast.error("Failed to mark message as read");
    }
  };

  // Delete message
  const deleteMessage = async (messageId: string) => {
    try {
      // Delete from Firestore
      const result = await deleteContactMessage(messageId);
      if (!result.success) {
        toast.error("Failed to delete message");
        return;
      }

      // Update in state
      const updatedMessages = contactMessages.filter((msg) => msg.id !== messageId);
      setContactMessages(updatedMessages);

      // Update localStorage for backward compatibility
      if (typeof window !== "undefined") {
        localStorage.setItem("contactMessages", JSON.stringify(updatedMessages));
      }

      toast.success("Message deleted successfully");
    } catch (error) {
      console.error("Error deleting message:", error);
      toast.error("Failed to delete message");
    }
  };

  // Add a refresh function
  const refreshShopData = async () => {
    try {
      toast.info("Refreshing data...");
      
      // Fetch pending shops from Firestore
      const pendingResult = await getShopsByStatus("pending");
      if (pendingResult.success && pendingResult.shops) {
        setPendingShops(pendingResult.shops);
        localStorage.setItem("pendingShops", JSON.stringify(pendingResult.shops));
      }

      // Fetch approved shops from Firestore
      const approvedResult = await getShopsByStatus("approved");
      if (approvedResult.success && approvedResult.shops) {
        setApprovedShops(approvedResult.shops);
        localStorage.setItem("approvedShops", JSON.stringify(approvedResult.shops));
      }
      
      // Fetch contact messages
      const messagesResult = await getContactMessages();
      if (messagesResult.success && messagesResult.messages) {
        setContactMessages(messagesResult.messages);
        localStorage.setItem("contactMessages", JSON.stringify(messagesResult.messages));
      }
      
      toast.success("Data refreshed successfully");
    } catch (error) {
      console.error("Error refreshing data:", error);
      toast.error("Failed to refresh data");
    }
  };

  // Format date for display
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
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
              Back
            </a>
            <h1 className="text-2xl font-bold text-gray-800">Admin Dashboard</h1>
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
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-2xl font-semibold text-gray-800">Admin Dashboard</h1>
          
          {/* Add refresh button */}
          <button
            onClick={refreshShopData}
            className="flex items-center px-4 py-2 bg-blue-100 text-blue-600 rounded-lg hover:bg-blue-200 transition-colors"
            disabled={isLoading}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            {isLoading ? "Refreshing..." : "Refresh Data"}
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b mb-6 overflow-x-auto">
          <button
            onClick={() => setActiveTab("pending")}
            className={`py-2 px-4 font-medium whitespace-nowrap ${
              activeTab === "pending" ? "text-blue-600 border-b-2 border-blue-600" : "text-gray-500 hover:text-gray-700"
            }`}
          >
            Pending Approvals ({pendingShops.length})
          </button>
          <button
            onClick={() => setActiveTab("approved")}
            className={`py-2 px-4 font-medium whitespace-nowrap ${
              activeTab === "approved"
                ? "text-blue-600 border-b-2 border-blue-600"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            All Shops ({approvedShops.length})
          </button>
          <button
            onClick={() => setActiveTab("messages")}
            className={`py-2 px-4 font-medium whitespace-nowrap ${
              activeTab === "messages"
                ? "text-blue-600 border-b-2 border-blue-600"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            Messages (
            {contactMessages.filter((msg) => !msg.read).length > 0
              ? `${contactMessages.filter((msg) => !msg.read).length} new`
              : contactMessages.length}
            )
          </button>
          <button
            onClick={() => setActiveTab("analytics")}
            className={`py-2 px-4 font-medium whitespace-nowrap ${
              activeTab === "analytics"
                ? "text-blue-600 border-b-2 border-blue-600"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            Analytics
          </button>
        </div>
        {/* Dashboard Stats */}
        <AdminStats />

        {/* Pending Approvals Tab */}
        {activeTab === "pending" && (
          <>
            <h2 className="text-xl font-semibold text-gray-700 mb-6">Pending Approvals</h2>

            {pendingShops.length === 0 ? (
              <div className="bg-white p-8 rounded-lg shadow text-center">
                <p className="text-gray-500">No pending shops to approve.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {pendingShops.map((shop) => (
                  <div key={shop.id} className="bg-white rounded-lg shadow overflow-hidden flex flex-col h-full">
                    <div className="h-[160px] relative overflow-hidden">
                      <ImageCarousel images={shop.images} alt={shop.name} />
                    </div>
                    <div className="p-4 flex-grow">
                      <h3 className="text-lg font-bold text-gray-800 mb-2 line-clamp-1">{shop.name}</h3>
                      <div className="space-y-1.5 text-sm">
                        <p className="text-gray-600">
                          <span className="font-medium">Category:</span>{" "}
                          {CATEGORIES.find((c) => c.id === shop.category)?.name}
                        </p>
                        <p className="text-gray-600">
                          <span className="font-medium">District:</span>{" "}
                          {DISTRICTS.find((d) => d.id === shop.district)?.name}
                        </p>
                        <p className="text-gray-600">
                          <span className="font-medium">Contact:</span> {shop.contact}
                        </p>
                        <p className="text-gray-600 line-clamp-2">
                          <span className="font-medium">Address:</span> {shop.address}
                        </p>
                        <p className="text-gray-600">
                          <span className="font-medium">Images:</span> {shop.images?.length || 0} photos
                        </p>
                      </div>

                      <div className="mt-4 flex flex-wrap gap-2">
                        <button
                          onClick={() => handleApprove(shop.id)}
                          className="flex items-center px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white rounded-md transition-colors text-sm"
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-4 w-4 mr-1"
                            viewBox="0 0 20 20"
                            fill="currentColor"
                          >
                            <path
                              fillRule="evenodd"
                              d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                              clipRule="evenodd"
                            />
                          </svg>
                          Approve
                        </button>

                        <button
                          onClick={() => openRejectModal(shop.id)}
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
                              d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                              clipRule="evenodd"
                            />
                          </svg>
                          Reject
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {/* All Shops Tab */}
        {activeTab === "approved" && (
          <>
            <h2 className="text-xl font-semibold text-gray-700 mb-6">All Shops</h2>

            {approvedShops.length === 0 ? (
              <div className="bg-white p-8 rounded-lg shadow text-center">
                <p className="text-gray-500">No shops available.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {approvedShops.map((shop) => (
                  <div key={shop.id} className="bg-white rounded-lg shadow overflow-hidden flex flex-col h-full">
                    {editingShop && editingShop.id === shop.id ? (
                      <div className="p-4">
                        <h3 className="text-lg font-bold text-gray-800 mb-4">Edit Shop</h3>
                        <div className="space-y-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Shop Name</label>
                            <input
                              type="text"
                              value={editingShop.name}
                              onChange={(e) => setEditingShop({ ...editingShop, name: e.target.value })}
                              className="w-full py-2 px-3 border border-gray-300 rounded-md"
                            />
                          </div>

                          {/* Shop Images Edit */}
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Shop Images (Min: 2, Max: 3, Max size: 1MB each)
                            </label>
                            <div className="mt-1">
                              {/* Display image previews */}
                              {imagesPreviews.length > 0 && (
                                <div className="grid grid-cols-3 gap-2 w-full mb-4">
                                  {imagesPreviews.map((preview, index) => (
                                    <div key={index} className="relative h-24">
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
                                          className="h-3 w-3"
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
                                    <label className="flex flex-col items-center justify-center h-24 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100">
                                      <div className="flex flex-col items-center justify-center p-2 text-center">
                                        <svg
                                          xmlns="http://www.w3.org/2000/svg"
                                          className="w-6 h-6 mb-1 text-gray-400"
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
                                        <p className="text-xs text-gray-500">Add</p>
                                      </div>
                                      <input
                                        type="file"
                                        className="hidden"
                                        accept="image/*"
                                        onChange={handleImageChange}
                                      />
                                    </label>
                                  )}
                                </div>
                              )}

                              {imagesPreviews.length === 0 && (
                                <div className="flex justify-center items-center w-full">
                                  <label className="flex flex-col items-center justify-center w-full h-24 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100">
                                    <div className="flex flex-col items-center justify-center pt-3 pb-3">
                                      <svg
                                        xmlns="http://www.w3.org/2000/svg"
                                        className="w-8 h-8 mb-2 text-gray-400"
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
                                      <p className="text-xs text-gray-500">
                                        <span className="font-semibold">Click to upload</span>
                                      </p>
                                      <p className="text-xs text-gray-500">PNG, JPG or JPEG (MAX. 1MB each)</p>
                                    </div>
                                    <input
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
                              <p className="mt-1 text-xs text-red-600">Please upload at least 2 images</p>
                            )}
                            {!areAllImagesValid() && (
                              <p className="mt-1 text-xs text-red-600">One or more images exceed the 1MB size limit</p>
                            )}
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                            <textarea
                              value={editingShop.address}
                              onChange={(e) => setEditingShop({ ...editingShop, address: e.target.value })}
                              className="w-full py-2 px-3 border border-gray-300 rounded-md"
                              rows={2}
                            />
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Contact (10 digits)</label>
                            <input
                              type="tel"
                              value={editingShop.contact}
                              onChange={(e) => {
                                // Only allow digits
                                const value = e.target.value.replace(/\D/g, "")
                                // Limit to 10 digits
                                if (value.length <= 10) {
                                  setEditingShop({ ...editingShop, contact: value })
                                }
                              }}
                              pattern="[0-9]{10}"
                              maxLength={10}
                              className="w-full py-2 px-3 border border-gray-300 rounded-md"
                              placeholder="Enter 10 digit number"
                            />
                            {editingShop.contact && editingShop.contact.length !== 10 && (
                              <p className="mt-1 text-xs text-red-600">Phone number must be exactly 10 digits</p>
                            )}
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                            <select
                              value={editingShop.category}
                              onChange={(e) => setEditingShop({ ...editingShop, category: e.target.value })}
                              className="w-full py-2 px-3 border border-gray-300 rounded-md"
                            >
                              {CATEGORIES.map((category) => (
                                <option key={category.id} value={category.id}>
                                  {category.name}
                                </option>
                              ))}
                            </select>
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">District</label>
                            <select
                              value={editingShop.district}
                              onChange={(e) => setEditingShop({ ...editingShop, district: e.target.value })}
                              className="w-full py-2 px-3 border border-gray-300 rounded-md"
                            >
                              {DISTRICTS.map((district) => (
                                <option key={district.id} value={district.id}>
                                  {district.name}
                                </option>
                              ))}
                            </select>
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Owner Name</label>
                            <input
                              type="text"
                              value={editingShop.ownerName || ""}
                              onChange={(e) => setEditingShop({ ...editingShop, ownerName: e.target.value })}
                              className="w-full py-2 px-3 border border-gray-300 rounded-md"
                              placeholder="Enter owner name"
                            />
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Business Hours</label>
                            <textarea
                              value={editingShop.businessHours || ""}
                              onChange={(e) => setEditingShop({ ...editingShop, businessHours: e.target.value })}
                              className="w-full py-2 px-3 border border-gray-300 rounded-md"
                              placeholder="e.g., Mon-Sat: 9:00 AM - 6:00 PM, Sun: Closed"
                              rows={2}
                            />
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Alternate Contact (Optional)
                            </label>
                            <input
                              type="tel"
                              value={editingShop.alternateContact || ""}
                              onChange={(e) => {
                                // Only allow digits
                                const value = e.target.value.replace(/\D/g, "")
                                // Limit to 10 digits
                                if (value.length <= 10) {
                                  setEditingShop({ ...editingShop, alternateContact: value })
                                }
                              }}
                              pattern="[0-9]{10}"
                              maxLength={10}
                              className="w-full py-2 px-3 border border-gray-300 rounded-md"
                              placeholder="Enter alternate 10-digit number (optional)"
                            />
                            {editingShop.alternateContact &&
                              editingShop.alternateContact.length !== 10 &&
                              editingShop.alternateContact.length > 0 && (
                                <p className="mt-1 text-xs text-red-600">Phone number must be exactly 10 digits</p>
                              )}
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Email (Optional)</label>
                            <input
                              type="email"
                              value={editingShop.email || ""}
                              onChange={(e) => setEditingShop({ ...editingShop, email: e.target.value })}
                              className="w-full py-2 px-3 border border-gray-300 rounded-md"
                              placeholder="Enter email address (optional)"
                            />
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Year of Establishment (Optional)
                            </label>
                            <input
                              type="text"
                              value={editingShop.establishmentYear || ""}
                              onChange={(e) => {
                                // Only allow digits
                                const value = e.target.value.replace(/\D/g, "")
                                // Limit to 4 digits
                                if (value.length <= 4) {
                                  setEditingShop({ ...editingShop, establishmentYear: value })
                                }
                              }}
                              pattern="[0-9]{4}"
                              maxLength={4}
                              className="w-full py-2 px-3 border border-gray-300 rounded-md"
                              placeholder="Enter year (e.g., 2010)"
                            />
                          </div>

                          <div className="flex gap-2 pt-2">
                            <button
                              onClick={() => handleSaveEdit(editingShop)}
                              disabled={imagesPreviews.length < 2 || !areAllImagesValid()}
                              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-1.5 rounded-md disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                            >
                              Save
                            </button>
                            <button
                              onClick={handleCancelEdit}
                              className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 py-1.5 rounded-md text-sm"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className="h-[160px] relative overflow-hidden">
                          <ImageCarousel images={shop.images} alt={shop.name} />
                        </div>
                        <div className="p-4 flex-grow">
                          <h3 className="text-lg font-bold text-gray-800 mb-2 line-clamp-1">{shop.name}</h3>
                          <div className="space-y-1.5 text-sm">
                            <p className="text-gray-600">
                              <span className="font-medium">Category:</span>{" "}
                              {CATEGORIES.find((c) => c.id === shop.category)?.name}
                            </p>
                            <p className="text-gray-600">
                              <span className="font-medium">District:</span>{" "}
                              {DISTRICTS.find((d) => d.id === shop.district)?.name}
                            </p>
                            <p className="text-gray-600">
                              <span className="font-medium">Contact:</span> {shop.contact}
                            </p>
                            <p className="text-gray-600 line-clamp-2">
                              <span className="font-medium">Address:</span> {shop.address}
                            </p>
                            {/* Additional shop details when available */}
                            {(shop.ownerName ||
                              shop.businessHours ||
                              shop.email ||
                              shop.alternateContact ||
                              shop.establishmentYear) && (
                              <div className="mt-2 pt-2 border-t border-gray-100">
                                {shop.ownerName && (
                                  <p className="text-gray-600 text-xs">
                                    <span className="font-medium">Owner:</span> {shop.ownerName}
                                  </p>
                                )}
                                {shop.businessHours && (
                                  <p className="text-gray-600 text-xs">
                                    <span className="font-medium">Hours:</span> {shop.businessHours}
                                  </p>
                                )}
                                {shop.email && (
                                  <p className="text-gray-600 text-xs">
                                    <span className="font-medium">Email:</span> {shop.email}
                                  </p>
                                )}
                                {shop.alternateContact && (
                                  <p className="text-gray-600 text-xs">
                                    <span className="font-medium">Alt. Contact:</span> {shop.alternateContact}
                                  </p>
                                )}
                                {shop.establishmentYear && (
                                  <p className="text-gray-600 text-xs">
                                    <span className="font-medium">Est.:</span> {shop.establishmentYear}
                                  </p>
                                )}
                              </div>
                            )}
                          </div>

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
                              Edit
                            </button>

                            <button
                              onClick={() => handleDeleteApproved(shop.id)}
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
                              Delete
                            </button>
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {/* Messages Tab */}
        {activeTab === "messages" && (
          <>
            <h2 className="text-xl font-semibold text-gray-700 mb-6">Contact Messages</h2>

            {contactMessages.length === 0 ? (
              <div className="bg-white p-8 rounded-lg shadow text-center">
                <p className="text-gray-500">No messages received yet.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {contactMessages.map((message) => (
                  <div
                    key={message.id}
                    className={`bg-white rounded-lg shadow overflow-hidden border-l-4 ${
                      message.read ? "border-gray-300" : "border-blue-500"
                    }`}
                  >
                    <div className="p-6">
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <h3 className="text-lg font-bold text-gray-800">{message.name}</h3>
                          <p className="text-sm text-gray-500">{message.email}</p>
                        </div>
                        <div className="flex items-center">
                          <span className="text-xs text-gray-500 mr-4">{formatDate(message.date)}</span>
                          {!message.read && (
                            <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">New</span>
                          )}
                        </div>
                      </div>

                      <div className="bg-gray-50 p-4 rounded-md mb-4">
                        <p className="text-gray-700 whitespace-pre-wrap">{message.message}</p>
                      </div>

                      <div className="flex justify-end gap-2">
                        {!message.read && (
                          <button
                            onClick={() => markMessageAsRead(message.id)}
                            className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-sm"
                          >
                            Mark as Read
                          </button>
                        )}
                        <button
                          onClick={() => deleteMessage(message.id)}
                          className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white rounded-md text-sm"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {/* Analytics Tab */}
        {activeTab === "analytics" && (
          <>
            <h2 className="text-xl font-semibold text-gray-700 mb-6">Analytics Dashboard</h2>
            <AdminAnalytics />
          </>
        )}
      </main>

      {/* Rejection Modal */}
      {showRejectionModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-xl font-bold mb-4">Reject Shop</h3>
            <p className="mb-4 text-gray-600">Please provide a reason for rejection:</p>
            <textarea
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md mb-4"
              rows={3}
              placeholder="Reason for rejection"
            />
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowRejectionModal(false)}
                className="px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded-md"
              >
                Cancel
              </button>
              <button onClick={handleReject} className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-md">
                Reject
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
