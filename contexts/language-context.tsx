"use client"

import type React from "react"
import { createContext, useContext, useState, useEffect } from "react"

type Language = "en" | "gu" | "hi"

type LanguageContextType = {
  language: Language
  setLanguage: (language: Language) => void
  translations: Record<string, Record<string, string>>
  t: (key: string) => string
}

// Default translations
const translations: Record<string, Record<string, string>> = {
  en: {
    // Navigation
    home: "Home",
    shopkeeperLogin: "Shop Seva Login",
    adminLogin: "Admin Login",
    contact: "Contact",
    about: "About",

    // Common actions
    call: "Call",
    whatsapp: "WhatsApp",
    details: "Details",
    review: "Review",

    // Language names
    english: "English",
    gujarati: "Gujarati",
    hindi: "Hindi",
    selectLanguage: "Select Language",

    // Shop related
    shops: "Shops",
    categories: "Categories",
    findShops: "Find Shops",
    search: "Search",
    noShopsFound: "No shops found matching your criteria.",
    selectState: "Select State",
    selectCity: "Select City",
    pleaseSelectState: "Please select a state first",
    state: "State",
    district: "District",
    allLocations: "All Locations",
    allCitiesInState: "All Cities in {{state}}",

    // Review related
    reviews: "Reviews",
    reviewsFor: "Reviews for",
    writeReview: "Write a Review",
    yourRating: "Your Rating",
    yourReview: "Your Review",
    submitReview: "Submit Review",
    loginToReview: "You'll need to login after clicking submit to post your review.",
    noReviewsYet: "No reviews yet. Be the first to review this shop!",
    customerReviews: "Customer Reviews",

    // Other common terms
    back: "Back",
    backToHome: "Back to Home",

    // Shopkeeper dashboard
    welcome: "Welcome",
    myShops: "My Shops",
    addNewShop: "Add New Shop",
    pendingApprovals: "Pending Approvals",
    approvedShops: "Approved Shops",
    rejectedShops: "Rejected Shops",
    shopName: "Shop Name",
    address: "Address",
    images: "Images",
    edit: "Edit",
    delete: "Delete",
    save: "Save",
    cancel: "Cancel",
    submit: "Submit",
    submitting: "Submitting...",
  },
  gu: {
    // Navigation
    home: "હોમ",
    shopkeeperLogin: "શોપ સેવા લોગિન",
    adminLogin: "એડમિન લોગિન",
    contact: "સંપર્ક",
    about: "વિશે",

    // Common actions
    call: "કૉલ",
    whatsapp: "વોટ્સએપ",
    details: "વિગતો",
    review: "સમીક્ષા",

    // Language names
    english: "અંગ્રેજી",
    gujarati: "ગુજરાતી",
    hindi: "હિન્દી",
    selectLanguage: "ભાષા પસંદ કરો",

    // Shop related
    shops: "દુકાનો",
    categories: "શ્રેણીઓ",
    findShops: "દુકાનો શોધો",
    search: "શોધ",
    noShopsFound: "તમારા માપદંડ સાથે મેળ ખાતી કોઈ દુકાનો મળી નથી.",
    selectState: "રાજ્ય પસંદ કરો",
    selectCity: "શહેર પસંદ કરો",
    pleaseSelectState: "કૃપા કરીને પહેલા રાજ્ય પસંદ કરો",
    state: "રાજ્ય",
    district: "જિલ્લો",
    allLocations: "બધા સ્થળો",
    allCitiesInState: "{{state}}માં બધા શહેરો",

    // Review related
    reviews: "સમીક્ષાઓ",
    reviewsFor: "સમીક્ષાઓ",
    writeReview: "સમીક્ષા લખો",
    yourRating: "તમારું રેટિંગ",
    yourReview: "તમારી સમીક્ષા",
    submitReview: "સમીક્ષા સબમિટ કરો",
    loginToReview: "સમીક્ષા પોસ્ટ કરવા માટે સબમિટ પર ક્લિક કર્યા પછી તમારે લોગિન કરવાની જરૂર પડશે.",
    noReviewsYet: "હજી સુધી કોઈ સમીક્ષાઓ નથી. આ દુકાનની સમીક્ષા કરનાર પ્રથમ વ્યક્તિ બનો!",
    customerReviews: "ગ્રાહક સમીક્ષાઓ",

    // Other common terms
    back: "પાછા",
    backToHome: "હોમ પર પાછા જાઓ",

    // Shopkeeper dashboard
    welcome: "સ્વાગત છે",
    myShops: "મારી દુકાનો",
    addNewShop: "નવી દુકાન ઉમેરો",
    pendingApprovals: "મંજૂરી બાકી",
    approvedShops: "મંજૂર દુકાનો",
    rejectedShops: "નકારેલી દુકાનો",
    shopName: "દુકાનનું નામ",
    address: "સરનામું",
    images: "છબીઓ",
    edit: "સંપાદિત કરો",
    delete: "કાઢી નાખો",
    save: "સાચવો",
    cancel: "રદ કરો",
    submit: "સબમિટ કરો",
    submitting: "સબમિટ કરી રહ્યા છીએ...",
  },
  hi: {
    // Navigation
    home: "होम",
    shopkeeperLogin: "शॉप सेवा लॉगिन",
    adminLogin: "एडमिन लॉगिन",
    contact: "संपर्क",
    about: "परिचय",

    // Common actions
    call: "कॉल",
    whatsapp: "व्हाट्सएप",
    details: "विवरण",
    review: "समीक्षा",

    // Language names
    english: "अंग्रेज़ी",
    gujarati: "गुजराती",
    hindi: "हिंदी",
    selectLanguage: "भाषा चुनें",

    // Shop related
    shops: "दुकानें",
    categories: "श्रेणियाँ",
    findShops: "दुकानें खोजें",
    search: "खोज",
    noShopsFound: "आपके मापदंडों से मेल खाती कोई दुकान नहीं मिली।",
    selectState: "राज्य चुनें",
    selectCity: "शहर चुनें",
    pleaseSelectState: "कृपया पहले राज्य चुनें",
    state: "राज्य",
    district: "जिला",
    allLocations: "सभी स्थान",
    allCitiesInState: "{{state}} के सभी शहर",

    // Review related
    reviews: "समीक्षाएँ",
    reviewsFor: "के लिए समीक्षाएँ",
    writeReview: "समीक्षा लिखें",
    yourRating: "आपकी रेटिंग",
    yourReview: "आपकी समीक्षा",
    submitReview: "समीक्षा जमा करें",
    loginToReview: "समीक्षा पोस्ट करने के लिए सबमिट पर क्लिक करने के बाद आपको लॉगिन करना होगा।",
    noReviewsYet: "अभी तक कोई समीक्षा नहीं। इस दुकान की समीक्षा करने वाले पहले व्यक्ति बनें!",
    customerReviews: "ग्राहक समीक्षाएँ",

    // Other common terms
    back: "वापस",
    backToHome: "होम पर वापस जाएं",

    // Shopkeeper dashboard
    welcome: "स्वागत है",
    myShops: "मेरी दुकानें",
    addNewShop: "नई दुकान जोड़ें",
    pendingApprovals: "अनुमोदन लंबित",
    approvedShops: "स्वीकृत दुकानें",
    rejectedShops: "अस्वीकृत दुकानें",
    shopName: "दुकान का नाम",
    address: "पता",
    images: "छवियां",
    edit: "संपादित करें",
    delete: "हटाएं",
    save: "सहेजें",
    cancel: "रद्द करें",
    submit: "जमा करें",
    submitting: "जमा कर रहे हैं...",
  },
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined)

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<Language>("en")

  // Load language preference from localStorage on component mount
  useEffect(() => {
    const savedLanguage = localStorage.getItem("language") as Language
    if (savedLanguage && ["en", "gu", "hi"].includes(savedLanguage)) {
      setLanguageState(savedLanguage)
    }
  }, [])

  // Save language preference to localStorage when it changes
  const setLanguage = (newLanguage: Language) => {
    setLanguageState(newLanguage)
    localStorage.setItem("language", newLanguage)
  }

  // Translation function
  const t = (key: string): string => {
    return translations[language]?.[key] || translations.en[key] || key
  }

  const value = {
    language,
    setLanguage,
    translations,
    t,
  }

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>
}

export function useLanguage() {
  const context = useContext(LanguageContext)
  if (context === undefined) {
    throw new Error("useLanguage must be used within a LanguageProvider")
  }
  return context
}
