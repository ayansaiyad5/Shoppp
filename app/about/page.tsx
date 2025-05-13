"use client"

import SidebarNavigation from "@/components/sidebar-navigation"
import { Store, Search, PlusCircle, MessageSquare } from "lucide-react"

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <SidebarNavigation />

      <div className="container mx-auto px-4 py-12 pt-20 max-w-4xl">
        <h1 className="text-3xl font-bold text-center mb-8">About Shop Seva</h1>

        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          {/* Hero section */}
          <div className="bg-gradient-to-r from-blue-600 to-blue-800 text-white p-8 text-center">
            <Store className="w-16 h-16 mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-2">Connecting Shops Across Gujarat</h2>
            <p className="max-w-2xl mx-auto opacity-90">
              Shop Seva is dedicated to creating a digital bridge between local businesses and customers throughout
              Gujarat.
            </p>
          </div>

          <div className="p-8">
            <div className="space-y-8">
              <section>
                <h2 className="text-xl font-semibold mb-3 text-blue-700">Our Mission</h2>
                <p className="text-gray-700">
                  Shop Seva is dedicated to connecting shoppers with local businesses across Gujarat. Our mission is to
                  help small and medium-sized businesses thrive by increasing their visibility and making it easier for
                  customers to discover them.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold mb-3 text-blue-700">What We Do</h2>
                <p className="text-gray-700 mb-6">
                  We provide a comprehensive directory of shops across all districts of Gujarat, organized by categories
                  to help users find exactly what they're looking for. Shop owners can register their businesses, add
                  details, and connect with potential customers.
                </p>

                <div className="grid md:grid-cols-3 gap-6 mt-6">
                  <div className="bg-blue-50 p-6 rounded-lg">
                    <div className="flex items-center justify-center h-12 w-12 rounded-full bg-blue-100 text-blue-600 mx-auto mb-4">
                      <Search className="h-6 w-6" />
                    </div>
                    <h3 className="text-lg font-medium text-center mb-2">Find Shops</h3>
                    <p className="text-sm text-gray-600 text-center">
                      Easily search and discover shops by location, category, or name.
                    </p>
                  </div>

                  <div className="bg-blue-50 p-6 rounded-lg">
                    <div className="flex items-center justify-center h-12 w-12 rounded-full bg-blue-100 text-blue-600 mx-auto mb-4">
                      <PlusCircle className="h-6 w-6" />
                    </div>
                    <h3 className="text-lg font-medium text-center mb-2">List Your Shop</h3>
                    <p className="text-sm text-gray-600 text-center">
                      Shop owners can register and showcase their business to potential customers.
                    </p>
                  </div>

                  <div className="bg-blue-50 p-6 rounded-lg">
                    <div className="flex items-center justify-center h-12 w-12 rounded-full bg-blue-100 text-blue-600 mx-auto mb-4">
                      <MessageSquare className="h-6 w-6" />
                    </div>
                    <h3 className="text-lg font-medium text-center mb-2">Connect</h3>
                    <p className="text-sm text-gray-600 text-center">
                      Facilitate direct communication between shoppers and shop owners.
                    </p>
                  </div>
                </div>
              </section>

              <section>
                <h2 className="text-xl font-semibold mb-3 text-blue-700">Our Story</h2>
                <p className="text-gray-700">
                  Shop Seva was founded in 2023 with the vision of creating a digital bridge between local businesses
                  and customers. In an increasingly digital world, we recognized the need for small businesses to have
                  an online presence without the complexity and cost of building their own websites.
                </p>
                <p className="text-gray-700 mt-3">
                  Starting with just a few districts in Gujarat, we've grown to cover the entire state and continue to
                  expand our services to better serve both shoppers and shop owners.
                </p>
              </section>

              <section className="bg-blue-50 p-6 rounded-lg text-center">
                <h2 className="text-xl font-semibold mb-3 text-blue-700">Join Us</h2>
                <p className="text-gray-700 mb-4">
                  Whether you're a shopper looking for the perfect store or a business owner wanting to reach more
                  customers, Shop Seva is here to help. Join our growing community today!
                </p>
                <div className="flex justify-center gap-4">
                  <a
                    href="/shopkeeper/login"
                    className="bg-blue-600 hover:bg-blue-700 text-white py-2 px-6 rounded-md transition-colors">
                    Register Shop
                  </a>
                  <a
                    href="/contact"
                    className="bg-white border border-blue-600 text-blue-600 hover:bg-blue-50 py-2 px-6 rounded-md transition-colors">
                    Contact Us
                  </a>
                </div>
              </section>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

