"use client"

import React, { createContext, useContext, useEffect, useState } from "react"
import { User } from "firebase/auth"
import { auth, firebaseUserToAppUser } from "@/lib/firebase"

// Define the type for our auth context
type AuthContextType = {
  currentUser: User | null
  loading: boolean
}

// Create the auth context
const AuthContext = createContext<AuthContextType>({
  currentUser: null,
  loading: true,
})

// Custom hook to use the auth context
export const useAuth = () => useContext(AuthContext)

// Provider component
export function FirebaseAuthProvider({ children }: { children: React.ReactNode }) {
  const [currentUser, setCurrentUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Subscribe to auth state changes
    const unsubscribe = auth.onAuthStateChanged((user) => {
      setCurrentUser(user)
      
      // If user is present, store in localStorage for compatibility with existing code
      if (user) {
        try {
          const appUser = firebaseUserToAppUser(user)
          localStorage.setItem("currentUser", JSON.stringify(appUser))
          localStorage.setItem("sessionTimestamp", Date.now().toString())
        } catch (error) {
          console.error("Error storing user in localStorage:", error)
        }
      }
      
      setLoading(false)
    })

    // Cleanup subscription
    return unsubscribe
  }, [])

  const value = {
    currentUser,
    loading,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
} 