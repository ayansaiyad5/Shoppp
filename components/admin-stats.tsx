"use client"

import { useState, useEffect } from "react"
import type { Shop } from "@/lib/types"

export function AdminStats() {
  const [stats, setStats] = useState({
    totalShops: 0,
    pendingApprovals: 0,
    approvedShops: 0,
    rejectedShops: 0,
    totalCategories: 0,
    totalDistricts: 0,
    contactMessages: 0,
    unreadMessages: 0,
  })

  useEffect(() => {
    // Load stats from localStorage
    const loadStats = () => {
      try {
        // Get all shops
        let pendingShops: Shop[] = []
        let approvedShops: Shop[] = []
        let rejectedShops: Shop[] = []

        // Get pending shops from localStorage
        const pendingShopsJson = localStorage.getItem("pendingShops")
        if (pendingShopsJson) {
          const allPendingShops = JSON.parse(pendingShopsJson)
          pendingShops = allPendingShops.filter((shop: Shop) => !shop.isApproved && !shop.isRejected)
          rejectedShops = allPendingShops.filter((shop: Shop) => shop.isRejected)
        }

        // Get approved shops from localStorage
        const approvedShopsJson = localStorage.getItem("approvedShops")
        if (approvedShopsJson) {
          approvedShops = JSON.parse(approvedShopsJson)
        }

        // Get contact messages
        let contactMessages: any[] = []
        const contactMessagesJson = localStorage.getItem("contactMessages")
        if (contactMessagesJson) {
          contactMessages = JSON.parse(contactMessagesJson)
        }

        // Calculate unique categories and districts in use
        const usedCategories = new Set()
        const usedDistricts = new Set()

        // Add categories and districts from pending shops
        pendingShops.forEach((shop) => {
          if (shop.category) usedCategories.add(shop.category)
          if (shop.district) usedDistricts.add(shop.district)
        })

        // Add categories and districts from approved shops
        approvedShops.forEach((shop) => {
          if (shop.category) usedCategories.add(shop.category)
          if (shop.district) usedDistricts.add(shop.district)
        })

        // Update stats
        setStats({
          totalShops: pendingShops.length + approvedShops.length + rejectedShops.length,
          pendingApprovals: pendingShops.length,
          approvedShops: approvedShops.length,
          rejectedShops: rejectedShops.length,
          totalCategories: usedCategories.size,
          totalDistricts: usedDistricts.size,
          contactMessages: contactMessages.length,
          unreadMessages: contactMessages.filter((msg) => !msg.read).length,
        })
      } catch (error) {
        console.error("Error loading stats:", error)
      }
    }

    loadStats()

    // Refresh stats every 5 seconds
    const interval = setInterval(loadStats, 5000)
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
      <div className="bg-white p-4 rounded-lg shadow border-l-4 border-blue-500">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-500">Total Shops</p>
            <p className="text-2xl font-bold text-gray-800">{stats.totalShops}</p>
          </div>
          <div className="p-3 bg-blue-100 rounded-full">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6 text-blue-600"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
              />
            </svg>
          </div>
        </div>
      </div>

      <div className="bg-white p-4 rounded-lg shadow border-l-4 border-yellow-500">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-500">Pending Approvals</p>
            <p className="text-2xl font-bold text-gray-800">{stats.pendingApprovals}</p>
          </div>
          <div className="p-3 bg-yellow-100 rounded-full">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6 text-yellow-600"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
        </div>
      </div>

      <div className="bg-white p-4 rounded-lg shadow border-l-4 border-green-500">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-500">Approved Shops</p>
            <p className="text-2xl font-bold text-gray-800">{stats.approvedShops}</p>
          </div>
          <div className="p-3 bg-green-100 rounded-full">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6 text-green-600"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
        </div>
      </div>

      <div className="bg-white p-4 rounded-lg shadow border-l-4 border-red-500">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-500">Rejected Shops</p>
            <p className="text-2xl font-bold text-gray-800">{stats.rejectedShops}</p>
          </div>
          <div className="p-3 bg-red-100 rounded-full">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6 text-red-600"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
        </div>
      </div>

      <div className="bg-white p-4 rounded-lg shadow border-l-4 border-purple-500">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-500">Categories</p>
            <p className="text-2xl font-bold text-gray-800">{stats.totalCategories}</p>
          </div>
          <div className="p-3 bg-purple-100 rounded-full">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6 text-purple-600"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"
              />
            </svg>
          </div>
        </div>
      </div>

      <div className="bg-white p-4 rounded-lg shadow border-l-4 border-indigo-500">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-500">Districts</p>
            <p className="text-2xl font-bold text-gray-800">{stats.totalDistricts}</p>
          </div>
          <div className="p-3 bg-indigo-100 rounded-full">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6 text-indigo-600"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
              />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </div>
        </div>
      </div>

      <div className="bg-white p-4 rounded-lg shadow border-l-4 border-teal-500">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-500">Messages</p>
            <p className="text-2xl font-bold text-gray-800">{stats.contactMessages}</p>
          </div>
          <div className="p-3 bg-teal-100 rounded-full">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6 text-teal-600"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"
              />
            </svg>
          </div>
        </div>
      </div>

      <div className="bg-white p-4 rounded-lg shadow border-l-4 border-pink-500">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-500">Unread Messages</p>
            <p className="text-2xl font-bold text-gray-800">{stats.unreadMessages}</p>
          </div>
          <div className="p-3 bg-pink-100 rounded-full">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6 text-pink-600"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
              />
            </svg>
          </div>
        </div>
      </div>
    </div>
  )
}
