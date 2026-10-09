"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface CartItem {
  productId: string;
  slug: string;
  name: string;
  image: string;
  packSize: string;
  price: number;
  mrp: number;
  quantity: number;
}

interface CartState {
  items: CartItem[];
  addItem: (item: Omit<CartItem, "quantity">, quantity?: number) => void;
  removeItem: (productId: string, packSize: string) => void;
  updateQuantity: (productId: string, packSize: string, quantity: number) => void;
  clearCart: () => void;
}

export const useCart = create<CartState>()(
  persist(
    (set) => ({
      items: [],
      addItem: (item, quantity = 1) =>
        set((state) => {
          const existing = state.items.find(
            (i) => i.productId === item.productId && i.packSize === item.packSize
          );
          if (existing) {
            return {
              items: state.items.map((i) =>
                i.productId === item.productId && i.packSize === item.packSize
                  ? { ...i, quantity: Math.min(50, i.quantity + quantity) }
                  : i
              ),
            };
          }
          return { items: [...state.items, { ...item, quantity }] };
        }),
      removeItem: (productId, packSize) =>
        set((state) => ({
          items: state.items.filter(
            (i) => !(i.productId === productId && i.packSize === packSize)
          ),
        })),
      updateQuantity: (productId, packSize, quantity) =>
        set((state) => ({
          items: state.items.map((i) =>
            i.productId === productId && i.packSize === packSize
              ? { ...i, quantity: Math.max(1, Math.min(50, quantity)) }
              : i
          ),
        })),
      clearCart: () => set({ items: [] }),
    }),
    { name: "mj-cart", version: 1 }
  )
);

export interface WishlistItem {
  productId: string;
  slug: string;
  name: string;
  image: string;
  price: number;
  mrp: number;
}

interface WishlistState {
  items: WishlistItem[];
  toggle: (item: WishlistItem) => void;
  has: (productId: string) => boolean;
  setItems: (items: WishlistItem[]) => void;
}

export const useWishlist = create<WishlistState>()(
  persist(
    (set, get) => ({
      items: [],
      toggle: (item) =>
        set((state) => {
          const exists = state.items.some((i) => i.productId === item.productId);
          if (exists) {
            return { items: state.items.filter((i) => i.productId !== item.productId) };
          }
          return { items: [...state.items, item] };
        }),
      has: (productId) => get().items.some((i) => i.productId === productId),
      setItems: (items) => set({ items }),
    }),
    { name: "mj-wishlist", version: 1 }
  )
);
