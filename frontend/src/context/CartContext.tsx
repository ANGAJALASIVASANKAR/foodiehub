import { createContext, useCallback, useContext, useEffect, useMemo, useState, ReactNode } from 'react';
import { api, errorMessage } from '../api/client';
import { useAuth } from './AuthContext';
import { Cart } from '../types';

interface CartContextValue {
  cart: Cart | null;
  loading: boolean;
  restaurantMismatch: { foodId: number; quantity: number; restaurantName: string } | null;
  refresh: () => Promise<void>;
  addItem: (foodId: number, quantity?: number, replaceExisting?: boolean) => Promise<Cart>;
  updateQuantity: (itemId: number, quantity: number) => Promise<Cart>;
  removeItem: (itemId: number) => Promise<Cart>;
  clear: () => Promise<Cart>;
  applyCoupon: (code: string) => Promise<Cart>;
  removeCoupon: () => Promise<Cart>;
  dismissMismatch: () => void;
  confirmMismatchAndAdd: () => Promise<void>;
}

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [cart, setCart] = useState<Cart | null>(null);
  const [loading, setLoading] = useState(false);
  const [restaurantMismatch, setRestaurantMismatch] = useState<{
    foodId: number;
    quantity: number;
    restaurantName: string;
  } | null>(null);

  const refresh = useCallback(async () => {
    if (!user) {
      setCart(null);
      return;
    }
    try {
      const res = await api.get<Cart>('/cart');
      setCart(res.data);
    } catch {
      // Keep the previous cart on transient errors so a flaky
      // request doesn't look like an empty cart.
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      setLoading(true);
      refresh().finally(() => setLoading(false));
    } else {
      setCart(null);
    }
  }, [user, refresh]);

  const addItem = useCallback(
    async (foodId: number, quantity = 1, replaceExisting = false) => {
      try {
        const res = await api.post<Cart>('/cart/items', { foodId, quantity, replaceExisting });
        setCart(res.data);
        return res.data;
      } catch (error) {
        const payload = errorMessage(error);
        const code = (error as { response?: { data?: { code?: string } } })?.response?.data?.code;
        if (code === 'RESTAURANT_MISMATCH') {
          const name = payload.includes('Clear it to order from')
            ? payload.split('Clear it to order from')[1].replace('.', '').trim()
            : 'another restaurant';
          setRestaurantMismatch({ foodId, quantity, restaurantName: name });
        }
        throw error;
      }
    },
    [],
  );

  const updateQuantity = useCallback(async (itemId: number, quantity: number) => {
    const res = await api.put<Cart>(`/cart/items/${itemId}`, { quantity });
    setCart(res.data);
    return res.data;
  }, []);

  const removeItem = useCallback(async (itemId: number) => {
    const res = await api.delete<Cart>(`/cart/items/${itemId}`);
    setCart(res.data);
    return res.data;
  }, []);

  const clear = useCallback(async () => {
    const res = await api.delete<Cart>('/cart/items');
    setCart(res.data);
    return res.data;
  }, []);

  const applyCoupon = useCallback(async (code: string) => {
    const res = await api.post<Cart>('/cart/coupon', { code });
    setCart(res.data);
    return res.data;
  }, []);

  const removeCoupon = useCallback(async () => {
    const res = await api.delete<Cart>('/cart/coupon');
    setCart(res.data);
    return res.data;
  }, []);

  const dismissMismatch = useCallback(() => setRestaurantMismatch(null), []);

  const confirmMismatchAndAdd = useCallback(async () => {
    if (!restaurantMismatch) return;
    const { foodId, quantity } = restaurantMismatch;
    setRestaurantMismatch(null);
    await clear();
    await addItem(foodId, quantity, true);
  }, [restaurantMismatch, clear, addItem]);

  const value = useMemo(
    () => ({
      cart,
      loading,
      restaurantMismatch,
      refresh,
      addItem,
      updateQuantity,
      removeItem,
      clear,
      applyCoupon,
      removeCoupon,
      dismissMismatch,
      confirmMismatchAndAdd,
    }),
    [cart, loading, restaurantMismatch, refresh, addItem, updateQuantity, removeItem, clear, applyCoupon, removeCoupon, dismissMismatch, confirmMismatchAndAdd],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used within CartProvider');
  return ctx;
}
