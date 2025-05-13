"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import SidebarNavigation from "@/components/sidebar-navigation"
import { Send, Phone, Mail, MapPin } from "lucide-react"
import { addContactMessage, ContactMessage } from "@/lib/firebase"

export default function ContactPage() {
  const router = useRouter()
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [message, setMessage] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      // Create a new message object
      const newMessage: Omit<ContactMessage, 'id'> = {
        name,
        email,
        message,
        date: new Date().toISOString(),
        read: false,
      }

      // Save message to Firestore
      const result = await addContactMessage(newMessage);
      
      if (!result.success) {
        toast.error("There was a problem sending your message. Please try again.");
        setIsSubmitting(false);
        return;
      }

      // Also save to localStorage for backward compatibility
      try {
        // Get existing messages from localStorage
        const existingMessages = JSON.parse(localStorage.getItem("contactMessages") || "[]")

        // Add new message with the Firestore ID to the list
        const messageWithId = { ...newMessage, id: result.id };
        const updatedMessages = [messageWithId, ...existingMessages]

        // Save back to localStorage
        localStorage.setItem("contactMessages", JSON.stringify(updatedMessages))
      } catch (error) {
        console.error("Error saving to localStorage:", error);
        // If localStorage fails, we still saved to Firestore so continue
      }

      // Show success message and reset form
      toast.success("Your message has been sent! We'll get back to you soon.")
      setName("")
      setEmail("")
      setMessage("")
    } catch (error) {
      console.error("Error submitting contact form:", error);
      toast.error("There was a problem sending your message. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <SidebarNavigation />

      <div className="container mx-auto px-4 py-12 pt-20 max-w-4xl">
        <h1 className="text-3xl font-bold text-center mb-8">Contact Us</h1>

        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="grid md:grid-cols-2">
            {/* Left side - Contact Info */}
            <div className="bg-gradient-to-br from-blue-600 to-blue-800 text-white p-8">
              <h2 className="text-2xl font-semibold mb-6">Get in Touch</h2>
              <p className="mb-8 opacity-90">
                Have questions about Shop Seva? We're here to help! Fill out the form and we'll get back to you as soon
                as possible.
              </p>

              <div className="space-y-6">
                <div className="flex items-start">
                  <div className="flex-shrink-0 mt-1 bg-blue-500 p-2 rounded-full">
                    <Phone size={18} />
                  </div>
                  <div className="ml-4">
                    <p className="font-medium">Phone</p>
                    <p className="opacity-90">+91 78599 05788</p>
                  </div>
                </div>

                <div className="flex items-start">
                  <div className="flex-shrink-0 mt-1 bg-blue-500 p-2 rounded-full">
                    <Mail size={18} />
                  </div>
                  <div className="ml-4">
                    <p className="font-medium">Email</p>
                    <p className="opacity-90">krinanakrani11@gmail.com</p>
                  </div>
                </div>

                <div className="flex items-start">
                  <div className="flex-shrink-0 mt-1 bg-blue-500 p-2 rounded-full">
                    <MapPin size={18} />
                  </div>
                  <div className="ml-4">
                    <p className="font-medium">Address</p>
                    <p className="opacity-90">Bardoli, Gujarat 394601</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Right side - Contact Form */}
            <div className="p-8">
              <h2 className="text-2xl font-semibold text-gray-800 mb-6">Send a Message</h2>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                    Your Name
                  </label>
                  <input
                    id="name"
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full py-2 px-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter your name"
                    required
                  />
                </div>

                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                    Your Email
                  </label>
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full py-2 px-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter your email"
                    required
                  />
                </div>

                <div>
                  <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-1">
                    Your Message
                  </label>
                  <textarea
                    id="message"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    className="w-full py-2 px-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter your message"
                    rows={4}
                    required
                  />
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white py-3 px-4 rounded-md transition-colors disabled:opacity-70 flex items-center justify-center gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                      <span>Sending...</span>
                    </>
                  ) : (
                    <>
                      <Send size={18} />
                      <span>Send Message</span>
                    </>
                  )}
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

