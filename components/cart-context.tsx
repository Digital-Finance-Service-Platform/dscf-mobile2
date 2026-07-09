import React, { createContext, useContext, useEffect, useMemo, useState } from "react";

import { useSdk } from "@/lib/sdk/context";

export type CartItem = {
  id: string;
  title: string;
  price: number;
  subtitle?: string;
  image?: any;
  quantity: number;
  raw?: any;
  listing_id?: number | string;
  product_id?: number;
  unit_id?: number;
  ordered_to_id?: number;
};

type CartContextType = {
  items: CartItem[];
  count: number;
  subtotal: number;
  addItem: (
    item:
      | Omit<CartItem, "quantity">
      | { id: string; title: string; price: number },
  ) => void;
  removeItem: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  clear: () => void;
};

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const { token } = useSdk();

  // Clear cart when user logs out (token becomes null)
  useEffect(() => {
    if (!token) {
      setItems([]);
    }
  }, [token]);

  const addItem = (item: any) => {
    setItems((prev) => {
      const found = prev.find((p) => p.id === item.id);
      if (found) {
        return prev.map((p) =>
          p.id === item.id ? { ...p, quantity: p.quantity + 1 } : p,
        );
      }
      return [...prev, { ...item, quantity: item.quantity ?? 1 }];
    });
  };

  const removeItem = (id: string) =>
    setItems((prev) => prev.filter((p) => p.id !== id));

  const updateQuantity = (id: string, quantity: number) =>
    setItems((prev) =>
      prev
        .map((p) =>
          p.id === id ? { ...p, quantity: Math.max(0, quantity) } : p,
        )
        .filter((p) => p.quantity > 0),
    );

  const clear = () => setItems([]);

  const count = useMemo(
    () => items.reduce((s, it) => s + it.quantity, 0),
    [items],
  );
  const subtotal = useMemo(
    () => items.reduce((s, it) => s + it.price * it.quantity, 0),
    [items],
  );

  return (
    <CartContext.Provider
      value={{
        items,
        count,
        subtotal,
        addItem,
        removeItem,
        updateQuantity,
        clear,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}
