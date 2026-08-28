import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';
import type { Course } from '@/data/content';

export interface CartItem {
  course: Course;
  quantity: number;
}

interface CartContextValue {
  items: CartItem[];
  isOpen: boolean;
  addCourse: (course: Course, quantity?: number) => void;
  removeCourse: (courseId: string) => void;
  updateQuantity: (courseId: string, quantity: number) => void;
  clearCart: () => void;
  openCart: () => void;
  closeCart: () => void;
  subtotal: number;
  itemCount: number;
  appliedCoupon: string | null;
  couponDiscount: number;
  applyCoupon: (code: string) => boolean;
  removeCoupon: () => void;
  total: number;
}

const VALID_COUPONS: Record<string, number> = {
  PHAROS10: 0.10,
  BEMVINDO: 0.05,
};

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [appliedCoupon, setAppliedCoupon] = useState<string | null>(null);

  const addCourse = useCallback((course: Course, quantity = 1) => {
    setItems((prev) => {
      const existing = prev.find((i) => i.course.id === course.id);
      if (existing) {
        return prev.map((i) =>
          i.course.id === course.id ? { ...i, quantity: i.quantity + quantity } : i
        );
      }
      return [...prev, { course, quantity }];
    });
    setIsOpen(true);
  }, []);

  const removeCourse = useCallback((courseId: string) => {
    setItems((prev) => prev.filter((i) => i.course.id !== courseId));
  }, []);

  const updateQuantity = useCallback((courseId: string, quantity: number) => {
    if (quantity < 1) return;
    setItems((prev) =>
      prev.map((i) => (i.course.id === courseId ? { ...i, quantity } : i))
    );
  }, []);

  const clearCart = useCallback(() => {
    setItems([]);
    setAppliedCoupon(null);
  }, []);

  const openCart = useCallback(() => setIsOpen(true), []);
  const closeCart = useCallback(() => setIsOpen(false), []);

  const applyCoupon = useCallback((code: string) => {
    const upper = code.toUpperCase().trim();
    if (VALID_COUPONS[upper]) {
      setAppliedCoupon(upper);
      return true;
    }
    return false;
  }, []);

  const removeCoupon = useCallback(() => setAppliedCoupon(null), []);

  const subtotal = items.reduce((sum, i) => sum + i.course.price * i.quantity, 0);
  const couponDiscount = appliedCoupon && VALID_COUPONS[appliedCoupon]
    ? subtotal * VALID_COUPONS[appliedCoupon]
    : 0;
  const total = subtotal - couponDiscount;
  const itemCount = items.reduce((sum, i) => sum + i.quantity, 0);

  return (
    <CartContext.Provider
      value={{
        items,
        isOpen,
        addCourse,
        removeCourse,
        updateQuantity,
        clearCart,
        openCart,
        closeCart,
        subtotal,
        itemCount,
        appliedCoupon,
        couponDiscount,
        applyCoupon,
        removeCoupon,
        total,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used within CartProvider');
  return ctx;
}
