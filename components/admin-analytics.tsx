"use client"

import { useState, useEffect } from "react"
import { CATEGORIES, DISTRICTS } from "@/lib/constants"
import type { Shop } from "@/lib/types"

type AnalyticsData = {
  totalShops: number
  shopsByDistrict: Record<string, number>
  shopsByCategory: Record<string, number>
  monthlyStats: Record<string, number>
  yearlyStats: Record<string, number>
}

export function AdminAnalytics() {
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData>({
    totalShops: 0,
    shopsByDistrict: {},
    shopsByCategory: {},
    monthlyStats: {},
    yearlyStats: {},
  })
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Load shops from localStorage
    const loadAnalyticsData = () => {
      setIsLoading(true)

      try {
        // Get all approved shops
        let allShops: Shop[] = []

        // Get approved shops from approvedShops storage
        const approvedShopsJson = localStorage.getItem("approvedShops")
        if (approvedShopsJson) {
          const approvedShops = JSON.parse(approvedShopsJson)
          allShops = [...allShops, ...approvedShops]
        }

        // Get approved shops from pendingShops storage
        const pendingShopsJson = localStorage.getItem("pendingShops")
        if (pendingShopsJson) {
          const pendingShops = JSON.parse(pendingShopsJson)
          // Only include approved shops from pending
          const approvedPendingShops = pendingShops.filter((shop: Shop) => shop.isApproved)
          allShops = [...allShops, ...approvedPendingShops]
        }

        // Deduplicate shops by ID
        const uniqueShops = Array.from(new Map(allShops.map((shop) => [shop.id, shop])).values())

        // Calculate analytics
        const shopsByDistrict: Record<string, number> = {}
        const shopsByCategory: Record<string, number> = {}
        const monthlyStats: Record<string, number> = {}
        const yearlyStats: Record<string, number> = {}

        uniqueShops.forEach((shop) => {
          // Count by district
          shopsByDistrict[shop.district] = (shopsByDistrict[shop.district] || 0) + 1

          // Count by  = (shopsByDistrict[shop.district] || 0) + 1

          // Count by category
          shopsByCategory[shop.category] = (shopsByCategory[shop.category] || 0) + 1

          // Count by month and year
          const createdDate = new Date(shop.createdAt)
          const monthKey = `${createdDate.getFullYear()}-${createdDate.getMonth() + 1}`
          const yearKey = `${createdDate.getFullYear()}`

          monthlyStats[monthKey] = (monthlyStats[monthKey] || 0) + 1
          yearlyStats[yearKey] = (yearlyStats[yearKey] || 0) + 1
        })

        setAnalyticsData({
          totalShops: uniqueShops.length,
          shopsByDistrict,
          shopsByCategory,
          monthlyStats,
          yearlyStats,
        })
      } catch (error) {
        console.error("Error loading analytics data:", error)
      } finally {
        setIsLoading(false)
      }
    }

    loadAnalyticsData()
  }, [])

  // Helper function to get district name by ID
  const getDistrictName = (id: string) => {
    return DISTRICTS.find((district) => district.id === id)?.name || "Unknown"
  }

  // Helper function to get category name by ID
  const getCategoryName = (id: string) => {
    return CATEGORIES.find((category) => category.id === id)?.name || "Unknown"
  }

  // Helper function to format month key to readable format
  const formatMonthKey = (key: string) => {
    const [year, month] = key.split("-")
    const date = new Date(Number.parseInt(year), Number.parseInt(month) - 1)
    return date.toLocaleDateString("en-US", { month: "short", year: "numeric" })
  }

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="flex items-center space-x-2">
          <div className="w-3 h-3 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: "0ms" }}></div>
          <div className="w-3 h-3 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: "150ms" }}></div>
          <div className="w-3 h-3 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: "300ms" }}></div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-medium text-gray-700">Total Shops</h3>
          <p className="text-3xl font-bold text-blue-600 mt-2">{analyticsData.totalShops}</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-medium text-gray-700">Districts Covered</h3>
          <p className="text-3xl font-bold text-green-600 mt-2">{Object.keys(analyticsData.shopsByDistrict).length}</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-medium text-gray-700">Categories</h3>
          <p className="text-3xl font-bold text-purple-600 mt-2">{Object.keys(analyticsData.shopsByCategory).length}</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-medium text-gray-700">Avg. Shops per District</h3>
          <p className="text-3xl font-bold text-orange-600 mt-2">
            {Object.keys(analyticsData.shopsByDistrict).length > 0
              ? (analyticsData.totalShops / Object.keys(analyticsData.shopsByDistrict).length).toFixed(1)
              : "0"}
          </p>
        </div>
      </div>

      {/* Shops by District */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-lg font-medium text-gray-700 mb-4">Shops by District</h3>
        <div className="overflow-x-auto">
          <div className="min-w-full">
            {Object.entries(analyticsData.shopsByDistrict).length > 0 ? (
              <div className="space-y-2">
                {Object.entries(analyticsData.shopsByDistrict)
                  .sort((a, b) => b[1] - a[1]) // Sort by count (descending)
                  .map(([districtId, count]) => (
                    <div key={districtId} className="flex items-center">
                      <div className="w-1/3 font-medium">{getDistrictName(districtId)}</div>
                      <div className="w-2/3">
                        <div className="relative h-8 bg-gray-200 rounded-full overflow-hidden">
                          <div
                            className="absolute top-0 left-0 h-full bg-blue-600 rounded-full"
                            style={{
                              width: `${(count / analyticsData.totalShops) * 100}%`,
                            }}
                          ></div>
                          <div className="absolute inset-0 flex items-center justify-end pr-3">
                            <span className="text-sm font-medium">{count}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-4">No district data available</p>
            )}
          </div>
        </div>
      </div>

      {/* Shops by Category */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-lg font-medium text-gray-700 mb-4">Shops by Category</h3>
        <div className="overflow-x-auto">
          <div className="min-w-full">
            {Object.entries(analyticsData.shopsByCategory).length > 0 ? (
              <div className="space-y-2">
                {Object.entries(analyticsData.shopsByCategory)
                  .sort((a, b) => b[1] - a[1]) // Sort by count (descending)
                  .map(([categoryId, count]) => (
                    <div key={categoryId} className="flex items-center">
                      <div className="w-1/3 font-medium">{getCategoryName(categoryId)}</div>
                      <div className="w-2/3">
                        <div className="relative h-8 bg-gray-200 rounded-full overflow-hidden">
                          <div
                            className="absolute top-0 left-0 h-full bg-green-600 rounded-full"
                            style={{
                              width: `${(count / analyticsData.totalShops) * 100}%`,
                            }}
                          ></div>
                          <div className="absolute inset-0 flex items-center justify-end pr-3">
                            <span className="text-sm font-medium">{count}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-4">No category data available</p>
            )}
          </div>
        </div>
      </div>

      {/* Monthly Statistics */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-lg font-medium text-gray-700 mb-4">Monthly Statistics</h3>
        <div className="overflow-x-auto">
          <div className="min-w-full">
            {Object.entries(analyticsData.monthlyStats).length > 0 ? (
              <div className="space-y-2">
                {Object.entries(analyticsData.monthlyStats)
                  .sort((a, b) => a[0].localeCompare(b[0])) // Sort by date (ascending)
                  .map(([monthKey, count]) => (
                    <div key={monthKey} className="flex items-center">
                      <div className="w-1/3 font-medium">{formatMonthKey(monthKey)}</div>
                      <div className="w-2/3">
                        <div className="relative h-8 bg-gray-200 rounded-full overflow-hidden">
                          <div
                            className="absolute top-0 left-0 h-full bg-purple-600 rounded-full"
                            style={{
                              width: `${(count / Math.max(...Object.values(analyticsData.monthlyStats))) * 100}%`,
                            }}
                          ></div>
                          <div className="absolute inset-0 flex items-center justify-end pr-3">
                            <span className="text-sm font-medium">{count}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-4">No monthly data available</p>
            )}
          </div>
        </div>
      </div>

      {/* Yearly Statistics */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-lg font-medium text-gray-700 mb-4">Yearly Statistics</h3>
        <div className="overflow-x-auto">
          <div className="min-w-full">
            {Object.entries(analyticsData.yearlyStats).length > 0 ? (
              <div className="space-y-2">
                {Object.entries(analyticsData.yearlyStats)
                  .sort((a, b) => a[0].localeCompare(b[0])) // Sort by year (ascending)
                  .map(([yearKey, count]) => (
                    <div key={yearKey} className="flex items-center">
                      <div className="w-1/3 font-medium">{yearKey}</div>
                      <div className="w-2/3">
                        <div className="relative h-8 bg-gray-200 rounded-full overflow-hidden">
                          <div
                            className="absolute top-0 left-0 h-full bg-yellow-600 rounded-full"
                            style={{
                              width: `${(count / Math.max(...Object.values(analyticsData.yearlyStats))) * 100}%`,
                            }}
                          ></div>
                          <div className="absolute inset-0 flex items-center justify-end pr-3">
                            <span className="text-sm font-medium">{count}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-4">No yearly data available</p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
