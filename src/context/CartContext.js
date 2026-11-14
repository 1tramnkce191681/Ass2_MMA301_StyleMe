//Ngô Kim Trâm_CE191681
import { createContext, useCallback, useEffect, useMemo, useState } from 'react';
import { isClothingProduct } from '../services/apiService';
import {
  loadCart,
  loadOrders,
  loadWishlist,
  saveCart,
  saveOrders,
  saveWishlist,
} from '../services/storageService';

export const CartContext = createContext(null);

const getCartItemId = (productId, size, color) =>
  `${productId}-${size || 'M'}-${color || 'Mặc định'}`;

const normalizeSavedCart = (items) =>
  items
    .filter((item) => isClothingProduct(item.product || item))
    .map((item) => {
      const product = item.product || item;
      const size = item.size || 'M';
      const color = item.color || 'Đen';
      return {
        ...product,
        ...item,
        size,
        color,
        cartItemId: item.cartItemId || getCartItemId(product.id, size, color),
        quantity: Math.max(1, Math.floor(Number(item.quantity) || 1)),
      };
    });

export const CartProvider = ({ children }) => {
  const [cartItems, setCartItems] = useState([]);
  const [wishlist, setWishlist] = useState([]);
  const [orders, setOrders] = useState([]);
  const [isCartLoaded, setIsCartLoaded] = useState(false);
  const [isWishlistLoaded, setIsWishlistLoaded] = useState(false);
  const [isOrdersLoaded, setIsOrdersLoaded] = useState(false);
  const [cartStorageError, setCartStorageError] = useState('');
  const [wishlistStorageError, setWishlistStorageError] = useState('');

  useEffect(() => {
    let isActive = true;
    const restoreCart = async () => {
      try {
        const items = await loadCart();
        if (isActive) {
          setCartItems(normalizeSavedCart(items));
          setCartStorageError('');
        }
      } catch (error) {
        console.error('Failed to load cart from storage:', error);
        if (isActive) {
          setCartStorageError('Không thể đọc giỏ hàng đã lưu trên thiết bị.');
        }
      } finally {
        if (isActive) {
          setIsCartLoaded(true);
        }
      }
    };
    restoreCart();
    return () => {
      isActive = false;
    };
  }, []);

  useEffect(() => {
    let isActive = true;
    const restoreOrders = async () => {
      try {
        const savedOrders = await loadOrders();
        if (isActive) {
          setOrders(savedOrders);
        }
      } catch (error) {
        console.error('Failed to load orders from storage:', error);
      } finally {
        if (isActive) {
          setIsOrdersLoaded(true);
        }
      }
    };
    restoreOrders();
    return () => {
      isActive = false;
    };
  }, []);

  useEffect(() => {
    let isActive = true;
    const restoreWishlist = async () => {
      try {
        const items = await loadWishlist();
        if (isActive) {
          setWishlist(items.filter(isClothingProduct));
          setWishlistStorageError('');
        }
      } catch (error) {
        console.error('Failed to load wishlist from storage:', error);
        if (isActive) {
          setWishlistStorageError('Không thể đọc danh sách yêu thích đã lưu trên thiết bị.');
        }
      } finally {
        if (isActive) {
          setIsWishlistLoaded(true);
        }
      }
    };
    restoreWishlist();
    return () => {
      isActive = false;
    };
  }, []);

  useEffect(() => {
    if (isCartLoaded) {
      saveCart(cartItems).catch((error) =>
        console.error('Failed to persist cart:', error)
      );
    }
  }, [cartItems, isCartLoaded]);

  useEffect(() => {
    if (isWishlistLoaded) {
      saveWishlist(wishlist).catch((error) =>
        console.error('Failed to persist wishlist:', error)
      );
    }
  }, [wishlist, isWishlistLoaded]);

  useEffect(() => {
    if (isOrdersLoaded) {
      saveOrders(orders).catch((error) =>
        console.error('Failed to persist orders:', error)
      );
    }
  }, [orders, isOrdersLoaded]);

  const addToCart = useCallback((product, size = 'M', color = 'Đen') => {
    if (!isClothingProduct(product)) {
      throw new Error('Chỉ có thể thêm sản phẩm quần áo vào giỏ hàng.');
    }
    if (!['S', 'M', 'L', 'XL'].includes(size)) {
      throw new Error('Kích cỡ sản phẩm không hợp lệ.');
    }
    if (typeof color !== 'string' || !color.trim()) {
      throw new Error('Vui lòng chọn màu sản phẩm.');
    }

    const cartItemId = getCartItemId(product.id, size, color.trim());
    setCartItems((items) => {
      const existingItem = items.find((item) => item.cartItemId === cartItemId);
      if (existingItem) {
        return items.map((item) =>
          item.cartItemId === cartItemId
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [...items, { ...product, size, color: color.trim(), cartItemId, quantity: 1 }];
    });
  }, []);

  const updateQuantity = useCallback((cartItemId, quantity) => {
    const parsedQuantity = Number(quantity);
    if (!Number.isFinite(parsedQuantity)) {
      throw new Error('Số lượng sản phẩm không hợp lệ.');
    }
    setCartItems((items) =>
      items
        .map((item) =>
          item.cartItemId === cartItemId
            ? { ...item, quantity: Math.floor(parsedQuantity) }
            : item
        )
        .filter((item) => item.quantity > 0)
    );
  }, []);

  const removeFromCart = useCallback((cartItemId) => {
    setCartItems((items) =>
      items.filter(
        (item) => item.cartItemId !== cartItemId && item.id !== cartItemId
      )
    );
  }, []);

  const clearCart = useCallback(() => setCartItems([]), []);
  const retryCartLoad = useCallback(async () => {
    setIsCartLoaded(false);
    try {
      setCartItems(normalizeSavedCart(await loadCart()));
      setCartStorageError('');
    } catch (error) {
      console.error('Failed to retry loading cart:', error);
      setCartStorageError('Không thể đọc giỏ hàng đã lưu trên thiết bị.');
    } finally {
      setIsCartLoaded(true);
    }
  }, []);

  const retryWishlistLoad = useCallback(async () => {
    try {
      setWishlist((await loadWishlist()).filter(isClothingProduct));
      setWishlistStorageError('');
    } catch (error) {
      console.error('Failed to retry loading wishlist:', error);
      setWishlistStorageError('Không thể đọc danh sách yêu thích đã lưu trên thiết bị.');
    }
  }, []);

  const addToWishlist = useCallback((product) => {
    if (!isClothingProduct(product)) {
      throw new Error('Chỉ có thể lưu sản phẩm quần áo yêu thích.');
    }
    setWishlist((items) =>
      items.some((item) => item.id === product.id) ? items : [...items, product]
    );
  }, []);

  const removeFromWishlist = useCallback(
    (productId) => setWishlist((items) => items.filter((item) => item.id !== productId)),
    []
  );
  const saveOrder = useCallback((order) => {
    setOrders((items) => [order, ...items]);
  }, []);

  const totals = useMemo(
    () => ({
      totalAmount: cartItems.reduce(
        (sum, item) => sum + Number(item.price) * item.quantity,
        0
      ),
      totalItemCount: cartItems.reduce((sum, item) => sum + item.quantity, 0),
    }),
    [cartItems]
  );

  const value = useMemo(
    () => ({
      cartItems,
      wishlist,
      orders,
      addToCart,
      updateQuantity,
      removeFromCart,
      clearCart,
      retryCartLoad,
      retryWishlistLoad,
      addToWishlist,
      removeFromWishlist,
      saveOrder,
      ...totals,
      totalPrice: totals.totalAmount,
      totalItems: totals.totalItemCount,
      isCartLoaded,
      isWishlistLoaded,
      isOrdersLoaded,
      cartStorageError,
      wishlistStorageError,
    }),
    [
      cartItems,
      wishlist,
      orders,
      addToCart,
      updateQuantity,
      removeFromCart,
      clearCart,
      retryCartLoad,
      retryWishlistLoad,
      addToWishlist,
      removeFromWishlist,
      saveOrder,
      totals,
      isCartLoaded,
      isWishlistLoaded,
      isOrdersLoaded,
      cartStorageError,
      wishlistStorageError,
    ]
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};
