import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut, User } from "firebase/auth";
import { getFirestore, collection, addDoc, updateDoc, getDocs, query, where, doc, getDoc, deleteDoc, Timestamp, DocumentData, Query, orderBy } from "firebase/firestore";
import type { Shop, Review } from "./types";

// Your web app's Firebase configuration
// Replace these with your actual Firebase config values from the Firebase console
const firebaseConfig = {
  apiKey: "AIzaSyC5UFhuVPW5lc-v2IAeaoJ9p1OXR-_TrYE",
  authDomain: "shop-seva-1489c.firebaseapp.com",
  projectId: "shop-seva-1489c",
  storageBucket: "shop-seva-1489c.firebasestorage.app",
  messagingSenderId: "457298251997",
  appId: "1:457298251997:web:535dfef637efdc5741cb34",
  measurementId: "G-V1DFM1NYNS"
};

// Initialize Firebase
const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const googleProvider = new GoogleAuthProvider();

// Google Sign In
export const signInWithGoogle = async () => {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    return {
      success: true,
      user: result.user,
    };
  } catch (error) {
    console.error("Error signing in with Google:", error);
    return {
      success: false,
      error,
    };
  }
};

// Sign out
export const logOut = async () => {
  try {
    await signOut(auth);
    return { success: true };
  } catch (error) {
    console.error("Error signing out:", error);
    return { success: false, error };
  }
};

// Convert Firebase user to app user
export const firebaseUserToAppUser = (user: User) => {
  return {
    id: user.uid,
    name: user.displayName || "User",
    email: user.email || "",
    phone: user.phoneNumber || "",
    photoURL: user.photoURL || "",
    role: "shopkeeper", // Default role for Google sign-in users
  };
};

// Type for shop status
type ShopStatus = "pending" | "approved" | "rejected";

// Shop Firestore operations
export const addShop = async (shopData: Omit<Shop, "id">) => {
  try {
    const docRef = await addDoc(collection(db, "shops"), {
      ...shopData,
      createdAt: Timestamp.now(),
    });
    return { success: true, id: docRef.id };
  } catch (error) {
    console.error("Error adding shop:", error);
    return { success: false, error };
  }
};

export const getShopsByStatus = async (status: ShopStatus) => {
  try {
    let q: Query<DocumentData>;
    
    if (status === "pending") {
      // For pending, we need both isApproved and isRejected to be false
      q = query(
        collection(db, "shops"),
        where("isApproved", "==", false),
        where("isRejected", "==", false)
      );
    } else if (status === "approved") {
      // For approved, just check isApproved is true
      q = query(
        collection(db, "shops"),
        where("isApproved", "==", true)
      );
    } else {
      // For rejected, just check isRejected is true
      q = query(
        collection(db, "shops"),
        where("isRejected", "==", true)
      );
    }
    
    const querySnapshot = await getDocs(q);
    const shops: Shop[] = [];
    querySnapshot.forEach((doc) => {
      shops.push({ id: doc.id, ...doc.data() } as Shop);
    });
    return { success: true, shops };
  } catch (error) {
    console.error(`Error getting ${status} shops:`, error);
    return { success: false, error };
  }
};

export const getUserShops = async (userId: string, status: ShopStatus) => {
  try {
    let q: Query<DocumentData>;
    if (status === "pending") {
      q = query(
        collection(db, "shops"),
        where("ownerId", "==", userId),
        where("isApproved", "==", false),
        where("isRejected", "==", false)
      );
    } else if (status === "approved") {
      q = query(
        collection(db, "shops"),
        where("ownerId", "==", userId),
        where("isApproved", "==", true)
      );
    } else {
      // rejected
      q = query(
        collection(db, "shops"),
        where("ownerId", "==", userId),
        where("isRejected", "==", true)
      );
    }
    
    const querySnapshot = await getDocs(q);
    const shops: Shop[] = [];
    querySnapshot.forEach((doc) => {
      shops.push({ id: doc.id, ...doc.data() } as Shop);
    });
    return { success: true, shops };
  } catch (error) {
    console.error(`Error getting user ${status} shops:`, error);
    return { success: false, error };
  }
};

export const updateShopStatus = async (shopId: string, isApproved: boolean, isRejected: boolean, rejectionReason: string = "") => {
  try {
    const shopRef = doc(db, "shops", shopId);
    const updateData: Partial<Shop> = { isApproved, isRejected };
    
    if (isRejected && rejectionReason) {
      updateData.rejectionReason = rejectionReason;
    }
    
    await updateDoc(shopRef, updateData);
    return { success: true };
  } catch (error) {
    console.error("Error updating shop status:", error);
    return { success: false, error };
  }
};

// Update shop details in Firestore
export const updateShopDetails = async (shopId: string, shopData: Partial<Shop>) => {
  try {
    const shopRef = doc(db, "shops", shopId);
    await updateDoc(shopRef, shopData);
    return { success: true };
  } catch (error) {
    console.error("Error updating shop details:", error);
    return { success: false, error };
  }
};

export const deleteShop = async (shopId: string) => {
  try {
    await deleteDoc(doc(db, "shops", shopId));
    return { success: true };
  } catch (error) {
    console.error("Error deleting shop:", error);
    return { success: false, error };
  }
};

export const getApprovedShopsForSearch = async (searchQuery?: string, categoryId?: string, districtId?: string, stateId?: string) => {
  try {
    // Base query to get all approved shops
    const q = query(
      collection(db, "shops"),
      where("isApproved", "==", true)
    );
    
    const querySnapshot = await getDocs(q);
    let shops: Shop[] = [];
    
    querySnapshot.forEach((doc) => {
      shops.push({ id: doc.id, ...doc.data() } as Shop);
    });
    
    // Apply additional filters on client side
    if (categoryId) {
      shops = shops.filter(shop => shop.category === categoryId);
    }
    
    if (districtId) {
      shops = shops.filter(shop => shop.district === districtId);
    }

    if (stateId) {
      shops = shops.filter(shop => shop.state === stateId);
    }
    
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      shops = shops.filter(shop => {
        return shop.name.toLowerCase().includes(query) || 
          shop.address.toLowerCase().includes(query);
      });
    }
    
    return { success: true, shops };
  } catch (error) {
    console.error("Error getting shops for search:", error);
    return { success: false, error };
  }
};

export const getShopById = async (shopId: string) => {
  try {
    const shopDoc = await getDoc(doc(db, "shops", shopId));
    
    if (shopDoc.exists()) {
      return { 
        success: true, 
        shop: { 
          id: shopDoc.id, 
          ...shopDoc.data() 
        } as Shop 
      };
    } else {
      return { success: false, error: "Shop not found" };
    }
  } catch (error) {
    console.error("Error getting shop by id:", error);
    return { success: false, error };
  }
};

// Contact message type
export interface ContactMessage {
  id?: string;
  name: string;
  email: string;
  message: string;
  date: string;
  read: boolean;
}

// Contact message Firestore operations
export const addContactMessage = async (messageData: Omit<ContactMessage, 'id'>) => {
  try {
    const docRef = await addDoc(collection(db, "contactMessages"), {
      ...messageData,
      date: Timestamp.now(),
    });
    return { success: true, id: docRef.id };
  } catch (error) {
    console.error("Error adding contact message:", error);
    return { success: false, error };
  }
};

export const getContactMessages = async () => {
  try {
    const q = query(
      collection(db, "contactMessages"),
      orderBy("date", "desc")
    );
    
    const querySnapshot = await getDocs(q);
    const messages: ContactMessage[] = [];
    
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      messages.push({ 
        id: doc.id, 
        name: data.name,
        email: data.email,
        message: data.message,
        // Convert Firestore timestamp to ISO string for consistency
        date: data.date instanceof Timestamp ? data.date.toDate().toISOString() : data.date,
        read: data.read
      });
    });
    
    return { success: true, messages };
  } catch (error) {
    console.error("Error getting contact messages:", error);
    return { success: false, error };
  }
};

export const markMessageAsRead = async (messageId: string) => {
  try {
    const messageRef = doc(db, "contactMessages", messageId);
    await updateDoc(messageRef, { read: true });
    return { success: true };
  } catch (error) {
    console.error("Error marking message as read:", error);
    return { success: false, error };
  }
};

export const deleteContactMessage = async (messageId: string) => {
  try {
    await deleteDoc(doc(db, "contactMessages", messageId));
    return { success: true };
  } catch (error) {
    console.error("Error deleting contact message:", error);
    return { success: false, error };
  }
};

// Review Firestore operations
export const addReview = async (reviewData: Omit<Review, "id" | "createdAt">) => {
  try {
    // Add the review document
    const docRef = await addDoc(collection(db, "reviews"), {
      ...reviewData,
      createdAt: Timestamp.now(),
    });

    // Update the shop review count
    const shopDoc = await getDoc(doc(db, "shops", reviewData.shopId));
    if (shopDoc.exists()) {
      const shopData = shopDoc.data() as Shop;
      const currentReviewCount = shopData.reviewCount || 0;
      await updateDoc(doc(db, "shops", reviewData.shopId), {
        reviewCount: currentReviewCount + 1,
      });
    }

    return { success: true, id: docRef.id };
  } catch (error) {
    console.error("Error adding review:", error);
    return { success: false, error };
  }
};

export const getReviewsByShopId = async (shopId: string) => {
  try {
    const q = query(
      collection(db, "reviews"),
      where("shopId", "==", shopId),
      orderBy("createdAt", "desc")
    );
    
    const querySnapshot = await getDocs(q);
    const reviews: Review[] = [];
    
    querySnapshot.forEach((doc) => {
      reviews.push({ 
        id: doc.id, 
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate().toISOString() || new Date().toISOString()
      } as Review);
    });
    
    return { success: true, reviews };
  } catch (error) {
    console.error("Error getting reviews for shop:", error);
    return { success: false, error };
  }
};

export { auth, db }; 