"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { toast } from "sonner"
import { FcGoogle } from "react-icons/fc"
import { Store } from "lucide-react"
import { signInWithGoogle, firebaseUserToAppUser } from "@/lib/firebase"

export default function ShopkeeperLoginPage() {
  const router = useRouter()
  const [isLogin, setIsLogin] = useState(true)
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [phone, setPhone] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  // Add this useEffect at the beginning of the component:
  useEffect(() => {
    // Check if already logged in as shopkeeper
    const currentUser = localStorage.getItem("currentUser")

    if (currentUser) {
      try {
        const user = JSON.parse(currentUser)
        if (user && user.role === "shopkeeper") {
          // Already logged in, redirect to dashboard
          router.push("/shopkeeper/dashboard")
        }
      } catch (e) {
        // If there's an error parsing, clear the localStorage
        localStorage.removeItem("currentUser")
      }
    }
  }, [router])

  // Check if already logged in
  // useEffect(() => {
  //   try {
  //     const currentUser = localStorage.getItem("currentUser")
  //     if (currentUser) {
  //       const user = JSON.parse(currentUser)
  //       if (user.role === "shopkeeper") {
  //         router.push("/shopkeeper/dashboard")
  //       } else if (user.role === "admin") {
  //         router.push("/admin/dashboard")
  //       }
  //     }
  //   } catch (error) {
  //     // If there's an error parsing the JSON, clear the localStorage
  //     localStorage.removeItem("currentUser")
  //   }
  // }, [router])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      if (isLogin) {
        // Handle login
        if (phone && password) {
          // Validate phone number
          if (phone.length !== 10 || !/^\d{10}$/.test(phone)) {
            toast.error("Please enter a valid 10-digit phone number")
            setIsLoading(false)
            return
          }

          // Regular shopkeeper login
          const registeredUsers = JSON.parse(localStorage.getItem("registeredUsers") || "[]")
          const user = registeredUsers.find(
            (u: any) => u.phone === phone && u.password === password && u.role === "shopkeeper",
          )

          if (user) {
            // Store current user with session persistence
            try {
              // Store current user in localStorage for persistence
              localStorage.setItem("currentUser", JSON.stringify(user))

              // Also store a session timestamp to track session activity
              localStorage.setItem("sessionTimestamp", Date.now().toString())

              toast.success("Login successful!")
              router.push("/shopkeeper/dashboard")
            } catch (error) {
              console.error("Error storing session data:", error)
              toast.error("Failed to create session. Please try again.")
            }
          } else {
            toast.error("Invalid phone number or password")
          }
        } else {
          toast.error("Please fill all fields")
        }
      } else {
        // Handle registration
        if (name && password && phone) {
          // Validate phone number
          if (phone.length !== 10 || !/^\d{10}$/.test(phone)) {
            toast.error("Please enter a valid 10-digit phone number")
            setIsLoading(false)
            return
          }

          // Get registered users from localStorage
          const registeredUsers = JSON.parse(localStorage.getItem("registeredUsers") || "[]")

          // Check if phone number already exists
          if (registeredUsers.some((user: any) => user.phone === phone)) {
            toast.error("This phone number is already registered")
            setIsLoading(false)
            return
          }

          // Create new user
          const newUser = {
            id: Date.now().toString(),
            name,
            email,
            password,
            phone,
            role: "shopkeeper",
          }

          // Add to registeredUsers in localStorage
          localStorage.setItem("registeredUsers", JSON.stringify([...registeredUsers, newUser]))

          // Store current user
          localStorage.setItem("currentUser", JSON.stringify(newUser))

          toast.success("Registration successful!")
          router.push("/shopkeeper/dashboard")
        } else {
          toast.error("Please fill all required fields")
        }
      }
    } catch (error) {
      toast.error("An error occurred. Please try again.")
      console.error(error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleGoogleLogin = async () => {
    setIsLoading(true)

    try {
      // Use Firebase's Google authentication
      const result = await signInWithGoogle();
      
      if (result.success && result.user) {
        // Convert Firebase user to app user format
        const appUser = firebaseUserToAppUser(result.user);
        
        // Store in localStorage for compatibility with existing code
        localStorage.setItem("currentUser", JSON.stringify(appUser));
        localStorage.setItem("sessionTimestamp", Date.now().toString());
        
        toast.success("Google login successful!");
        router.push("/shopkeeper/dashboard");
      } else {
        throw new Error("Google authentication failed");
      }
    } catch (error) {
      console.error("Error with Google login:", error);
      toast.error("Failed to login with Google. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col px-4">
      <div className="container mx-auto py-4">
        <button
          onClick={() => router.push("/home")}
          className="flex items-center text-blue-600 hover:text-blue-800"
          disabled={isLoading}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
            <path
              fillRule="evenodd"
              d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L4.414 9H17a1 1 0 110 2H4.414l5.293 5.293a1 1 0 010 1.414z"
              clipRule="evenodd"
            />
          </svg>
          Back to Home
        </button>
      </div>
      <div className="flex-1 flex items-center justify-center">
        <div className="max-w-md w-full bg-white rounded-lg shadow-md p-8">
          <div className="flex flex-col items-center mb-8">
            <div className="w-20 h-20 bg-gradient-to-r from-yellow-400 via-teal-400 to-blue-500 rounded-full flex items-center justify-center mb-4">
              <div className="w-18 h-18 bg-white rounded-full flex items-center justify-center">
                <Store className="h-10 w-10 text-blue-600" />
              </div>
            </div>
            <h1 className="text-2xl font-bold text-gray-800">{isLogin ? "Shopkeeper Login" : "Register Shop"}</h1>
          </div>

          {/* Google Login Button */}
          <button
            onClick={handleGoogleLogin}
            disabled={isLoading}
            className="w-full flex items-center justify-center gap-2 bg-white border border-gray-300 rounded-md py-2 px-4 text-gray-700 hover:bg-gray-50 mb-6 disabled:opacity-50"
          >
            <FcGoogle size={24} />
            <span>Continue with Google</span>
          </button>

          <div className="relative mb-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-gray-500">Or continue with</span>
            </div>
          </div>

          <div className="flex justify-center mb-6">
            <button
              onClick={() => setIsLogin(true)}
              disabled={isLoading}
              className={`px-4 py-2 ${isLogin ? "border-b-2 border-blue-600 text-blue-600 font-medium" : "text-gray-500"}`}
            >
              Login
            </button>
            <button
              onClick={() => setIsLogin(false)}
              disabled={isLoading}
              className={`px-4 py-2 ${!isLogin ? "border-b-2 border-blue-600 text-blue-600 font-medium" : "text-gray-500"}`}
            >
              Register
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                  Full Name
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
                    id="name"
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    disabled={isLoading}
                    className="pl-10 w-full py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
                    placeholder="Enter your full name"
                  />
                </div>
              </div>
            )}

            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
                Phone Number
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
                  id="phone"
                  type="tel"
                  value={phone}
                  onChange={(e) => {
                    // Only allow digits
                    const value = e.target.value.replace(/\D/g, "")
                    // Limit to 10 digits
                    if (value.length <= 10) {
                      setPhone(value)
                    }
                  }}
                  disabled={isLoading}
                  pattern="[0-9]{10}"
                  maxLength={10}
                  className="pl-10 w-full py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
                  placeholder="Enter your 10-digit phone number"
                  required
                />
              </div>
              {phone && phone.length !== 10 && (
                <p className="mt-1 text-sm text-red-600">Phone number must be exactly 10 digits</p>
              )}
            </div>

            {!isLogin && (
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
                    disabled={isLoading}
                    className="pl-10 w-full py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
                    placeholder="Enter your email (optional)"
                  />
                </div>
              </div>
            )}

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                Password
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
                      d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isLoading}
                  className="pl-10 w-full py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
                  placeholder="Enter your password"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-yellow-400 via-teal-400 to-blue-500 hover:from-yellow-500 hover:via-teal-500 hover:to-blue-600 text-white py-2 px-4 rounded-md transition-colors mt-6 disabled:opacity-50"
            >
              {isLoading ? (
                <span className="flex items-center justify-center">
                  <svg
                    className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  {isLogin ? "Logging in..." : "Registering..."}
                </span>
              ) : isLogin ? (
                "Login"
              ) : (
                "Register"
              )}
            </button>
          </form>

          <div className="mt-6 text-center">
            <div className="mt-4">
              <Link href="/home" className="text-blue-600 hover:text-blue-800 text-sm">
                Back to Home
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

