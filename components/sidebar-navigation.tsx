"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter, usePathname } from "next/navigation"
import { Home, Store, Phone, Info, Menu, X, User, Shield, Globe, Heart } from "lucide-react"
import { useLanguage } from "@/contexts/language-context"

interface SidebarNavigationProps {
  scrollToTop?: () => void
}

export default function SidebarNavigation({ scrollToTop }: SidebarNavigationProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [showLanguageMenu, setShowLanguageMenu] = useState(false)
  const router = useRouter()
  const pathname = usePathname()
  const { language, setLanguage, t } = useLanguage()

  // Check if user is logged in
  const isUserLoggedIn = () => {
    if (typeof window !== "undefined") {
      const currentUser = localStorage.getItem("currentUser")
      return !!currentUser
    }
    return false
  }

  const toggleSidebar = () => {
    setIsOpen(!isOpen)
  }

  const closeSidebar = () => {
    setIsOpen(false)
  }

  // Handle Home click - reload the page
  const handleHomeClick = () => {
    if (pathname === "/home") {
      // Reload the page if already on home
      window.location.href = "/home"
    } else {
      // Navigate to home if on a different page
      router.push("/home")
    }
    closeSidebar()
  }

  // Toggle language menu
  const toggleLanguageMenu = () => {
    setShowLanguageMenu(!showLanguageMenu)
  }

  // Change language
  const changeLanguage = (lang: "en" | "gu" | "hi") => {
    setLanguage(lang)
    setShowLanguageMenu(false)
  }

  return (
    <>
      {/* Hamburger menu button */}
      <button
        onClick={toggleSidebar}
        className="fixed top-4 left-4 z-50 p-2 bg-blue-600 text-white rounded-md shadow-md hover:bg-blue-700 transition-colors"
        aria-label={isOpen ? "Close menu" : "Open menu"}
      >
        {isOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      {/* Overlay */}
      {isOpen && <div className="fixed inset-0 bg-black bg-opacity-50 z-40" onClick={closeSidebar}></div>}

      {/* Sidebar */}
      <div
        className={`fixed top-0 left-0 h-full bg-white shadow-lg z-50 transition-all duration-300 ease-in-out w-64 transform ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="p-4 border-b flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Store className="text-blue-600" size={24} />
              <h2 className="text-xl font-bold text-gray-800">Shop Seva</h2>
            </div>
            <button onClick={closeSidebar} className="text-gray-500 hover:text-gray-700" aria-label="Close menu">
              <X size={20} />
            </button>
          </div>

          {/* Navigation links */}
          <nav className="flex-1 overflow-y-auto p-4">
            <ul className="space-y-2">
              <li>
                <button
                  onClick={handleHomeClick}
                  className={`w-full flex items-center space-x-3 p-3 rounded-md transition-colors ${
                    pathname === "/home" ? "bg-blue-100 text-blue-700" : "text-gray-700 hover:bg-gray-100"
                  }`}
                >
                  <Home size={20} />
                  <span>{t("home")}</span>
                </button>
              </li>

              {isUserLoggedIn() ? (
                <li>
                  <Link
                    href="/shopkeeper/dashboard"
                    className={`flex items-center space-x-3 p-3 rounded-md transition-colors ${
                      pathname === "/shopkeeper/dashboard"
                        ? "bg-blue-100 text-blue-700"
                        : "text-gray-700 hover:bg-gray-100"
                    }`}
                    onClick={closeSidebar}
                  >
                    <User size={20} />
                    <span>{t("shopkeeperLogin")}</span>
                  </Link>
                </li>
              ) : (
                <li>
                  <Link
                    href="/shopkeeper/login"
                    className={`flex items-center space-x-3 p-3 rounded-md transition-colors ${
                      pathname === "/shopkeeper/login" ? "bg-blue-100 text-blue-700" : "text-gray-700 hover:bg-gray-100"
                    }`}
                    onClick={closeSidebar}
                  >
                    <User size={20} />
                    <span>{t("shopkeeperLogin")}</span>
                  </Link>
                </li>
              )}

              <li>
                <Link
                  href="/admin/login"
                  className={`flex items-center space-x-3 p-3 rounded-md transition-colors ${
                    pathname === "/admin/login" ? "bg-blue-100 text-blue-700" : "text-gray-700 hover:bg-gray-100"
                  }`}
                  onClick={closeSidebar}
                >
                  <Shield size={20} />
                  <span>{t("adminLogin")}</span>
                </Link>
              </li>

              <li>
                <Link
                  href="/contact"
                  className={`flex items-center space-x-3 p-3 rounded-md transition-colors ${
                    pathname === "/contact" ? "bg-blue-100 text-blue-700" : "text-gray-700 hover:bg-gray-100"
                  }`}
                  onClick={closeSidebar}
                >
                  <Phone size={20} />
                  <span>{t("contact")}</span>
                </Link>
              </li>

              <li>
                <Link
                  href="/liked-shops"
                  className={`flex items-center space-x-3 p-3 rounded-md transition-colors ${
                    pathname === "/liked-shops" ? "bg-blue-100 text-blue-700" : "text-gray-700 hover:bg-gray-100"
                  }`}
                  onClick={closeSidebar}
                >
                  <Heart size={20} />
                  <span>Liked Shops</span>
                </Link>
              </li>


              <li>
                <Link
                  href="/about"
                  className={`flex items-center space-x-3 p-3 rounded-md transition-colors ${
                    pathname === "/about" ? "bg-blue-100 text-blue-700" : "text-gray-700 hover:bg-gray-100"
                  }`}
                  onClick={closeSidebar}
                >
                  <Info size={20} />
                  <span>{t("about")}</span>
                </Link>
              </li>
            </ul>
          </nav>

          {/* Language Selector */}
          <div className="p-4 border-t">
            <div className="relative">
              <button
                onClick={toggleLanguageMenu}
                className="w-full flex items-center justify-between p-3 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
              >
                <div className="flex items-center space-x-2">
                  <Globe size={18} className="text-gray-600" />
                  <span className="text-gray-700">{t("selectLanguage")}</span>
                </div>
                <span className="text-sm font-medium bg-blue-100 text-blue-800 px-2 py-0.5 rounded">
                  {language === "en" ? "EN" : language === "gu" ? "GU" : "HI"}
                </span>
              </button>

              {showLanguageMenu && (
                <div className="absolute bottom-full left-0 right-0 mb-1 bg-white rounded-md shadow-lg border overflow-hidden z-10">
                  <button
                    onClick={() => changeLanguage("en")}
                    className={`w-full text-left px-4 py-2 hover:bg-gray-100 flex items-center justify-between ${
                      language === "en" ? "bg-blue-50 text-blue-700" : ""
                    }`}
                  >
                    <span>{t("english")}</span>
                    {language === "en" && (
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-4 w-4 text-blue-600"
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
                    onClick={() => changeLanguage("gu")}
                    className={`w-full text-left px-4 py-2 hover:bg-gray-100 flex items-center justify-between ${
                      language === "gu" ? "bg-blue-50 text-blue-700" : ""
                    }`}
                  >
                    <span>{t("gujarati")}</span>
                    {language === "gu" && (
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-4 w-4 text-blue-600"
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
                    onClick={() => changeLanguage("hi")}
                    className={`w-full text-left px-4 py-2 hover:bg-gray-100 flex items-center justify-between ${
                      language === "hi" ? "bg-blue-50 text-blue-700" : ""
                    }`}
                  >
                    <span>{t("hindi")}</span>
                    {language === "hi" && (
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-4 w-4 text-blue-600"
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
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="p-4 border-t text-center text-sm text-gray-500">
            &copy; {new Date().getFullYear()} Shop Seva
          </div>
        </div>
      </div>
    </>
  )
}
