//Ngô Kim Trâm_CE191681
import { getApps, initializeApp } from 'firebase/app';
import { addDoc, collection, deleteDoc, doc, getDocs, getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY || '',
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN || '',
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID || '',
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET || '',
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || '',
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID || '',
};

export const isFirebaseConfigured = Object.values(firebaseConfig).every(
  (value) => value.length > 0 && !value.startsWith('YOUR_')
);

const firebaseApp = isFirebaseConfigured
  ? getApps()[0] || initializeApp(firebaseConfig)
  : null;
export const db = firebaseApp ? getFirestore(firebaseApp) : null;

const getWishlistCollection = () => {
  if (!db) {
    throw new Error(
      'Firebase chưa được cấu hình. Danh sách yêu thích vẫn được lưu trên thiết bị.'
    );
  }
  return collection(db, 'wishlist');
};

export const saveWishlistToFirebase = async (product) => {
  try {
    const docRef = await addDoc(getWishlistCollection(), {
      productId: product.id,
      title: product.title,
      price: product.price,
      thumbnail: product.thumbnail || product.image || '',
      category: product.category || '',
      addedAt: new Date().toISOString(),
    });
    return docRef.id;
  } catch (error) {
    console.error('Failed to save wishlist item to Firebase:', error);
    throw error;
  }
};

export const loadWishlistFromFirebase = async () => {
  try {
    const snapshot = await getDocs(getWishlistCollection());
    return snapshot.docs.map((document) => ({ id: document.id, ...document.data() }));
  } catch (error) {
    console.error('Failed to load wishlist from Firebase:', error);
    throw error;
  }
};

export const removeWishlistFromFirebase = async (documentId) => {
  if (!db) {
    throw new Error('Firebase chưa được cấu hình để xóa sản phẩm yêu thích.');
  }
  if (typeof documentId !== 'string' || !documentId.trim()) {
    throw new Error('Mã sản phẩm yêu thích không hợp lệ.');
  }

  try {
    await deleteDoc(doc(db, 'wishlist', documentId));
  } catch (error) {
    console.error('Failed to remove wishlist item from Firebase:', error);
    throw error;
  }
};

export const loadOrdersFromFirebase = async () => {
  if (!db) {
    throw new Error('Firebase chưa được cấu hình để tải đơn hàng.');
  }

  try {
    const snapshot = await getDocs(collection(db, 'orders'));
    return snapshot.docs.map((document) => ({ id: document.id, ...document.data() }));
  } catch (error) {
    console.error('Failed to load orders from Firebase:', error);
    throw error;
  }
};

export const saveOrderToFirebase = async (cartItems, totalAmount) => {
  if (!db) {
    throw new Error('Firebase chưa được cấu hình. Không thể xác nhận đơn hàng.');
  }
  if (!Array.isArray(cartItems) || cartItems.length === 0) {
    throw new Error('Giỏ hàng đang trống.');
  }
  if (!Number.isFinite(totalAmount) || totalAmount <= 0) {
    throw new Error('Tổng tiền đơn hàng không hợp lệ.');
  }

  try {
    const docRef = await addDoc(collection(db, 'orders'), {
      items: cartItems.map((item) => ({
        productId: item.id,
        title: item.title,
        price: item.price,
        quantity: item.quantity,
        size: item.size,
        color: item.color,
      })),
      totalAmount,
      status: 'placed',
      createdAt: new Date().toISOString(),
    });
    return docRef.id;
  } catch (error) {
    console.error('Failed to place order in Firebase:', error);
    throw error;
  }
};
