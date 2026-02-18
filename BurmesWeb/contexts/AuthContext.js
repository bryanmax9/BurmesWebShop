import React, { createContext, useContext, useEffect, useState } from "react";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  signInWithPopup,
  GoogleAuthProvider,
  deleteUser as firebaseDeleteUser,
  reauthenticateWithPopup,
  reauthenticateWithCredential,
  EmailAuthProvider,
} from "firebase/auth";
import { doc, getDoc, setDoc, deleteDoc, updateDoc, collection, addDoc, query, getDocs, orderBy, where, runTransaction } from "firebase/firestore";
import { auth, db } from "../config/firebase";
import { getDriveImageUrl } from "../services/googleDrive";

const USERS_COLLECTION = "users";
const ORDERS_COLLECTION = "orders";
const REQUESTS_COLLECTION = "requests";
const PRODUCTS_COLLECTION = "products";
const ROLE_CLIENT = "client";
const ROLE_ADMIN = "admin";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [firebaseUser, setFirebaseUser] = useState(null);
  const [userDoc, setUserDoc] = useState(null);
  const [loading, setLoading] = useState(true);

  const role = userDoc?.role === ROLE_ADMIN ? ROLE_ADMIN : ROLE_CLIENT;
  const isAdmin = role === ROLE_ADMIN;
  const profileNeedsCompletion = !!firebaseUser && !isAdmin && (!userDoc || (userDoc.role === ROLE_CLIENT && userDoc.profileCompleted === false));

  useEffect(() => {
    if (!auth) {
      setLoading(false);
      return;
    }
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setFirebaseUser(user);
      if (!user) {
        setUserDoc(null);
        setLoading(false);
        return;
      }
      try {
        if (db) {
          const userRef = doc(db, USERS_COLLECTION, user.uid);
          let snap = await getDoc(userRef);
          if (!snap.exists()) {
            await setDoc(userRef, {
              email: user.email ?? null,
              displayName: user.displayName ?? null,
              role: ROLE_CLIENT,
              profileCompleted: false,
              fullName: null,
              address: null,
              workTitle: null,
              phone: null,
              hasWhatsApp: true,
              cart: [],
              createdAt: new Date().toISOString(),
            });
            snap = await getDoc(userRef);
          }
          if (snap.exists()) {
            setUserDoc({ id: snap.id, ...snap.data() });
          } else {
            setUserDoc(null);
          }
        } else {
          setUserDoc(null);
        }
      } catch (e) {
        setUserDoc(null);
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const ensureUserDoc = async (uid, data) => {
    if (!db) return;
    const userRef = doc(db, USERS_COLLECTION, uid);
    const snap = await getDoc(userRef);
    if (!snap.exists()) {
      await setDoc(userRef, {
        email: data.email ?? null,
        displayName: data.displayName ?? null,
        role: ROLE_CLIENT,
        profileCompleted: false,
        fullName: null,
        address: null,
        workTitle: null,
        phone: null,
        hasWhatsApp: true,
        cart: [],
        createdAt: new Date().toISOString(),
      });
    }
  };

  const signUpClient = async (email, password, displayName = "") => {
    if (!auth) throw new Error("Firebase not configured");
    const cred = await createUserWithEmailAndPassword(auth, email, password);
    await ensureUserDoc(cred.user.uid, {
      email: cred.user.email,
      displayName: displayName || cred.user.displayName || null,
    });
  };

  const signInClientEmail = async (email, password) => {
    if (!auth) throw new Error("Firebase not configured");
    await signInWithEmailAndPassword(auth, email, password);
  };

  const signInWithGoogle = async () => {
    if (!auth) throw new Error("Firebase not configured");
    const provider = new GoogleAuthProvider();
    const cred = await signInWithPopup(auth, provider);
    await ensureUserDoc(cred.user.uid, {
      email: cred.user.email,
      displayName: cred.user.displayName || null,
    });
  };

  const signInAdmin = async (email, password) => {
    if (!auth) throw new Error("Firebase not configured");
    if (!db) throw new Error("Firestore not configured");
    await signInWithEmailAndPassword(auth, email, password);
    const userRef = doc(db, USERS_COLLECTION, auth.currentUser.uid);
    const snap = await getDoc(userRef);
    if (!snap.exists() || snap.data().role !== ROLE_ADMIN) {
      await firebaseSignOut(auth);
      throw new Error("This account is not an admin. Use client sign-in or contact support.");
    }
  };

  const signUpAdmin = async (email, password, displayName = "") => {
    if (!auth) throw new Error("Firebase not configured");
    if (!db) throw new Error("Firestore not configured");
    const cred = await createUserWithEmailAndPassword(auth, email, password);
    const userRef = doc(db, USERS_COLLECTION, cred.user.uid);
    await setDoc(userRef, {
      email: cred.user.email ?? email,
      displayName: displayName || null,
      role: ROLE_ADMIN,
      createdAt: new Date().toISOString(),
    });
  };

  const createOrder = async (productId, productName) => {
    if (!db || !firebaseUser) return null;
    const ref = await addDoc(collection(db, ORDERS_COLLECTION), {
      userId: firebaseUser.uid,
      userEmail: firebaseUser.email || null,
      productId: productId || null,
      productName: productName || "",
      status: "requested",
      createdAt: new Date().toISOString(),
    });
    return ref.id;
  };

  const getMyOrders = async () => {
    if (!db || !firebaseUser) return [];
    const q = query(
      collection(db, ORDERS_COLLECTION),
      where("userId", "==", firebaseUser.uid)
    );
    const snap = await getDocs(q);
    return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  };

  const updateUserProfile = async (profile) => {
    if (!db || !firebaseUser) throw new Error("Not configured or not signed in");
    const userRef = doc(db, USERS_COLLECTION, firebaseUser.uid);
    await setDoc(userRef, {
      fullName: profile.fullName ?? null,
      address: profile.address ?? null,
      workTitle: profile.workTitle ?? null,
      phone: profile.phone ?? null,
      hasWhatsApp: profile.hasWhatsApp !== false,
      profileCompleted: true,
    }, { merge: true });
    const snap = await getDoc(userRef);
    if (snap.exists()) setUserDoc({ id: snap.id, ...snap.data() });
  };

  const getCart = () => (userDoc?.cart && Array.isArray(userDoc.cart) ? userDoc.cart : []);

  const setCart = async (cartItems) => {
    if (!db || !firebaseUser) return;
    const userRef = doc(db, USERS_COLLECTION, firebaseUser.uid);
    await setDoc(userRef, { cart: cartItems || [] }, { merge: true });
    const snap = await getDoc(userRef);
    if (snap.exists()) setUserDoc({ id: snap.id, ...snap.data() });
  };

  const createRequest = async (items) => {
    if (!db || !firebaseUser || !items?.length) return null;
    const uid = firebaseUser.uid;
    const userRef = doc(db, USERS_COLLECTION, uid);
    const now = new Date().toISOString();

    const snap = await getDoc(userRef);
    const data = snap?.exists() ? snap.data() : {};

    // Group quantities per productId
    const qtyByProduct = new Map();
    for (const i of items) {
      const productId = i.productId || i.id;
      if (!productId) continue;
      const q = Math.max(1, Number(i.quantity ?? 1) || 1);
      qtyByProduct.set(productId, (qtyByProduct.get(productId) || 0) + q);
    }

    const requestsCol = collection(db, USERS_COLLECTION, uid, REQUESTS_COLLECTION);
    const reqRef = doc(requestsCol); // create id locally for transaction

    await runTransaction(db, async (tx) => {
      // Decrement stock for each product (if countInStock exists)
      for (const [productId, qty] of qtyByProduct.entries()) {
        const productRef = doc(db, PRODUCTS_COLLECTION, String(productId));
        const pSnap = await tx.get(productRef);
        if (!pSnap.exists()) continue; // if missing, skip stock check
        const p = pSnap.data() || {};
        const stock = p.countInStock;
        if (typeof stock === "number") {
          const next = stock - qty;
          if (next < 0) {
            const name = p.name || "this product";
            throw new Error(`Not enough stock for ${name}. Only ${stock} left.`);
          }
          tx.update(productRef, { countInStock: next, updatedAt: now });
        }
      }

      tx.set(
        reqRef,
        {
          userId: uid,
          userEmail: firebaseUser.email || data.email || null,
          fullName: data.fullName || null,
          address: data.address || null,
          phone: data.phone || null,
          hasWhatsApp: data.hasWhatsApp !== false,
          items: items.map((i) => {
            const imageUrl = typeof i.image === "string" && i.image.trim() ? i.image.trim() : null;
            return {
              productId: i.productId || i.id,
              productName: i.productName || i.name,
              quantity: Math.max(1, Number(i.quantity ?? 1) || 1),
              image: imageUrl,
              price: i.price != null ? i.price : null,
              description: i.description || null,
            };
          }),
          status: "pending",
          requestNumber: reqRef.id,
          createdAt: now,
        },
        { merge: true }
      );

      tx.set(userRef, { cart: [] }, { merge: true });
    });

    const snap2 = await getDoc(userRef);
    if (snap2.exists()) setUserDoc({ id: snap2.id, ...snap2.data() });
    return reqRef.id;
  };

  const getMyRequests = async () => {
    if (!db || !firebaseUser) return [];
    const requestsCol = collection(db, USERS_COLLECTION, firebaseUser.uid, REQUESTS_COLLECTION);
    const q = query(requestsCol, orderBy("createdAt", "desc"));
    const snapshot = await getDocs(q);
    return snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
  };

  const getRequestsForAdmin = async () => {
    if (!db || !firebaseUser) return [];
    const usersSnap = await getDocs(collection(db, USERS_COLLECTION));
    const clientUserIds = usersSnap.docs
      .filter((d) => (d.data().role || "client") === "client")
      .map((d) => d.id);
    const allRequests = [];
    for (const uid of clientUserIds) {
      const requestsCol = collection(db, USERS_COLLECTION, uid, REQUESTS_COLLECTION);
      const q = query(requestsCol, orderBy("createdAt", "desc"));
      const snap = await getDocs(q);
      snap.docs.forEach((d) => allRequests.push({ id: d.id, ...d.data(), userId: uid }));
    }
    allRequests.sort((a, b) => {
      const tA = a.createdAt || "";
      const tB = b.createdAt || "";
      return tB.localeCompare(tA);
    });
    return allRequests;
  };

  const getUsersForAdmin = async () => {
    if (!db || !firebaseUser) return [];
    const snapshot = await getDocs(collection(db, USERS_COLLECTION));
    return snapshot.docs
      .filter((d) => (d.data().role || "client") === "client")
      .map((d) => ({ id: d.id, ...d.data() }));
  };

  const updateRequestStatus = async (userId, requestId, status) => {
    if (!db || !firebaseUser) return;
    const ref = doc(db, USERS_COLLECTION, userId, REQUESTS_COLLECTION, requestId);
    await updateDoc(ref, { status: status || "pending" });
  };

  const getProducts = async (categoryId = null) => {
    if (!db) return [];
    const baseCol = collection(db, PRODUCTS_COLLECTION);
    let q;
    if (categoryId) {
      // Filter only by category to avoid needing a composite index.
      // We'll sort by name on the client.
      q = query(baseCol, where("category", "==", categoryId));
    } else {
      q = query(baseCol, orderBy("name", "asc"));
    }
    const snapshot = await getDocs(q);
    const list = snapshot.docs.map((d) => {
      const data = d.data() || {};
      const rawImages = Array.isArray(data.images) ? data.images : [];
      const rawIds = Array.isArray(data.driveFileIds)
        ? data.driveFileIds
        : data.driveFileId
        ? [data.driveFileId]
        : [];

      // Normalize images so they always use a Drive thumbnail URL
      let images = rawImages
        .map((u) => getDriveImageUrl(u) || null)
        .filter(Boolean);
      if (!images.length && rawIds.length) {
        images = rawIds
          .map((id) => getDriveImageUrl(id) || null)
          .filter(Boolean);
      }

      const image = images[0] || (data.image ? getDriveImageUrl(data.image) : null);

      return {
        id: d.id,
        ...data,
        image,
        images,
        driveFileIds: rawIds,
      };
    });

    // If we couldn't sort by name in Firestore (when filtering by category),
    // sort the list here so UI ordering is still nice.
    return list.sort((a, b) => {
      const an = (a.name || "").toLowerCase();
      const bn = (b.name || "").toLowerCase();
      return an.localeCompare(bn);
    });
  };

  const createProduct = async (productData) => {
    if (!db || !firebaseUser) throw new Error("Not authenticated");
    const ref = await addDoc(collection(db, PRODUCTS_COLLECTION), {
      name: productData.name || "",
      brand: productData.brand || "Burmes & Co",
      description: productData.description || "",
      price: productData.price != null ? Number(productData.price) : null,
      image: productData.image || null,
      images: productData.images && Array.isArray(productData.images) ? productData.images : [],
      category: productData.category || null,
      countInStock: productData.countInStock != null ? Number(productData.countInStock) : 0,
      isFeatured: productData.isFeatured === true,
      rating: productData.rating != null ? Number(productData.rating) : 0,
      numReviews: productData.numReviews != null ? Number(productData.numReviews) : 0,
      driveFileId: productData.driveFileId || null,
      driveFileIds: productData.driveFileIds && Array.isArray(productData.driveFileIds) ? productData.driveFileIds : [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
    return ref.id;
  };

  const updateProduct = async (productId, productData) => {
    if (!db || !firebaseUser) throw new Error("Not authenticated");
    const ref = doc(db, PRODUCTS_COLLECTION, productId);
    await updateDoc(ref, {
      name: productData.name,
      brand: productData.brand || "Burmes & Co",
      description: productData.description,
      price: productData.price != null ? Number(productData.price) : null,
      image: productData.image || null,
      images: productData.images && Array.isArray(productData.images) ? productData.images : [],
      category: productData.category || null,
      countInStock: productData.countInStock != null ? Number(productData.countInStock) : 0,
      isFeatured: productData.isFeatured === true,
      rating: productData.rating != null ? Number(productData.rating) : 0,
      numReviews: productData.numReviews != null ? Number(productData.numReviews) : 0,
      driveFileId: productData.driveFileId || null,
      driveFileIds: productData.driveFileIds && Array.isArray(productData.driveFileIds) ? productData.driveFileIds : [],
      updatedAt: new Date().toISOString(),
    });
  };

  const deleteProduct = async (productId) => {
    if (!db || !firebaseUser) throw new Error("Not authenticated");
    const productRef = doc(db, PRODUCTS_COLLECTION, productId);
    const productSnap = await getDoc(productRef);
    if (!productSnap.exists()) throw new Error("Product not found");
    const productData = productSnap.data();
    
    // Delete from Firestore
    await deleteDoc(productRef);
    
    // Note: Google Drive deletion is handled in AdminListings component
    // This keeps the deletion logic together with the upload logic
  };

  const signOut = async () => {
    if (auth) await firebaseSignOut(auth);
    setUserDoc(null);
  };

  const deleteUserAccount = async (password) => {
    const currentUser = auth?.currentUser;
    if (!currentUser) throw new Error("Not signed in.");
    const uid = currentUser.uid;
    const isGoogle = currentUser.providerData?.some((p) => p?.providerId === "google.com");
    try {
      if (isGoogle) {
        const provider = new GoogleAuthProvider();
        await reauthenticateWithPopup(currentUser, provider);
      } else {
        if (!password || typeof password !== "string") {
          throw new Error("Please enter your password to confirm account deletion.");
        }
        const credential = EmailAuthProvider.credential(currentUser.email || "", password);
        await reauthenticateWithCredential(currentUser, credential);
      }
    } catch (e) {
      if (e?.code === "auth/invalid-credential" || e?.code === "auth/wrong-password") {
        throw new Error("Incorrect password. Please try again.");
      }
      if (e?.code === "auth/popup-closed-by-user" || e?.code === "auth/cancelled-popup-request") {
        throw new Error("Sign-in was cancelled.");
      }
      throw e;
    }
    if (db) {
      const requestsCol = collection(db, USERS_COLLECTION, uid, REQUESTS_COLLECTION);
      const requestsSnap = await getDocs(requestsCol);
      for (const d of requestsSnap.docs) {
        await deleteDoc(d.ref);
      }
      const userRef = doc(db, USERS_COLLECTION, uid);
      await deleteDoc(userRef);
    }
    try {
      await firebaseDeleteUser(currentUser);
    } catch (e) {
      throw new Error(e?.message || "Could not delete account. Try again or contact support.");
    }
    setUserDoc(null);
    setFirebaseUser(null);
  };

  const value = {
    user: firebaseUser,
    userDoc,
    role,
    isAdmin,
    loading,
    profileNeedsCompletion,
    signUpClient,
    signInClientEmail,
    signInWithGoogle,
    signInAdmin,
    signUpAdmin,
    signOut,
    deleteUserAccount,
    updateUserProfile,
    createOrder,
    getMyOrders,
    getCart,
    setCart,
    createRequest,
    getMyRequests,
    getRequestsForAdmin,
    getUsersForAdmin,
    updateRequestStatus,
    getProducts,
    createProduct,
    updateProduct,
    deleteProduct,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
