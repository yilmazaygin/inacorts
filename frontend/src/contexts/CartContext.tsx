import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import type { PublicProduct } from '@/types/site';

const STORAGE_KEY = 'inacorts_cart';

export interface CartLine {
  productId: number;
  name: string;
  price: number;
  imageUrl: string | null;
  categoryName: string;
  quantity: number;
}

interface CartContextType {
  lines: CartLine[];
  count: number;
  total: number;
  add: (product: PublicProduct) => void;
  setQuantity: (productId: number, quantity: number) => void;
  remove: (productId: number) => void;
  clear: () => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

function readCart(): CartLine[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((line) => line && typeof line.productId === 'number' && line.quantity > 0);
  } catch {
    return [];
  }
}

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [lines, setLines] = useState<CartLine[]>(readCart);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(lines));
  }, [lines]);

  const add = (product: PublicProduct) => {
    setLines((current) => {
      const existing = current.find((line) => line.productId === product.id);
      if (existing) {
        return current.map((line) => (
          line.productId === product.id ? { ...line, quantity: line.quantity + 1 } : line
        ));
      }
      return [
        ...current,
        {
          productId: product.id,
          name: product.name,
          price: product.list_price,
          imageUrl: product.image_url ?? null,
          categoryName: product.category_name,
          quantity: 1,
        },
      ];
    });
  };

  const setQuantity = (productId: number, quantity: number) => {
    setLines((current) => {
      if (quantity <= 0) return current.filter((line) => line.productId !== productId);
      return current.map((line) => (
        line.productId === productId ? { ...line, quantity } : line
      ));
    });
  };

  const remove = (productId: number) => {
    setLines((current) => current.filter((line) => line.productId !== productId));
  };

  const clear = () => setLines([]);

  const value = useMemo(() => ({
    lines,
    count: lines.reduce((sum, line) => sum + line.quantity, 0),
    total: lines.reduce((sum, line) => sum + line.price * line.quantity, 0),
    add,
    setQuantity,
    remove,
    clear,
  }), [lines]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};

export const useCart = (): CartContextType => {
  const context = useContext(CartContext);
  if (!context) throw new Error('useCart must be used within CartProvider');
  return context;
};
