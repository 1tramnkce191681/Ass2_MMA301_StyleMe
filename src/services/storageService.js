//Ngô Kim Trâm_CE191681
import AsyncStorage from '@react-native-async-storage/async-storage';

const CART_KEY = '@styleme_cart';
const WISHLIST_KEY = '@styleme_wishlist';
const ORDERS_KEY = '@styleme_orders';

const readArray = async (key) => {
  const value = await AsyncStorage.getItem(key);
  if (!value) {
    return [];
  }

  const parsed = JSON.parse(value);
  if (!Array.isArray(parsed)) {
    throw new Error(`Stored data for ${key} must be an array.`);
  }
  return parsed;
};

const writeArray = (key, value) => {
  if (!Array.isArray(value)) {
    throw new Error(`Data for ${key} must be an array.`);
  }
  return AsyncStorage.setItem(key, JSON.stringify(value));
};

export const loadCart = () => readArray(CART_KEY);
export const saveCart = (items) => writeArray(CART_KEY, items);
export const loadWishlist = () => readArray(WISHLIST_KEY);
export const saveWishlist = (items) => writeArray(WISHLIST_KEY, items);
export const loadOrders = () => readArray(ORDERS_KEY);
export const saveOrders = (orders) => writeArray(ORDERS_KEY, orders);
