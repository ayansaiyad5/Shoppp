export type Shop = {
  id: string
  name: string
  images: string[] // Changed from single image to array of images
  contact: string
  category: string
  district: string
  address: string
  state?: string // New field for state selection
  isApproved: boolean
  isRejected?: boolean // New field to track rejected shops
  rejectionReason?: string // Optional reason for rejection
  ownerId: string
  createdAt: string
  // New fields for detailed shop information
  ownerName?: string
  businessHours?: string
  alternateContact?: string
  email?: string
  establishmentYear?: string
  latitude?: string
  longitude?: string
  likes?: number // New field to track likes count
  reviewCount?: number // New field to track the number of reviews
}

export type Category = {
  id: string
  name: string
  icon: string
}

export type District = {
  id: string
  name: string
  stateId: string // Reference to the state this district belongs to
}

export type State = {
  id: string
  name: string
}

export type User = {
  id: string
  name: string
  email: string
  phone: string
  role: "shopkeeper" | "admin"
}

export type Review = {
  id: string
  shopId: string
  userId: string
  userName: string
  rating: number
  text: string
  createdAt: string
}

