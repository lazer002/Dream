import React, { createContext, useContext, useEffect, useState } from 'react';
import { useAuth } from './AuthContext.jsx';
import { toast } from "react-hot-toast";
import { api } from '@/utils/config.js';

const CartContext = createContext(null);

function ensureGuestId() {
  let gid = localStorage.getItem('ds_guest');
  if (!gid) {
    gid = crypto.randomUUID();
    localStorage.setItem('ds_guest', gid);
  }
  return gid;
}

export function CartProvider({ children }) {
  const { user } = useAuth();
  const [items, setItems] = useState([]);
  const guestId = ensureGuestId();

  // Function to call cart endpoints with guest header
  const client = (token) => {
    return {
      get: (url) => api.get(`/cart${url}`, { headers: { 'x-guest-id': guestId, ...(token ? { Authorization: `Bearer ${token}` } : {}) } }),
      post: (url, data) => api.post(`/cart${url}`, data, { headers: { 'x-guest-id': guestId, ...(token ? { Authorization: `Bearer ${token}` } : {}) } })
    };
  };

  const refresh = async () => {
    try {
      const { data } = await client().get('/');
      setItems(data.items);
    } catch (err) {
      console.error(err);
      toast.error("Failed to refresh cart");
    }
  };

  // Fetch cart on load
  useEffect(() => { refresh() }, []);

  // Merge guest cart after login
  const mergeGuestCart = async () => {
    const token = localStorage.getItem('ds_access');
    if (!user || !token) return;

    try {
      await client(token).post('/merge', { guestId });
      await refresh();
      toast.success("Guest cart merged successfully");
    } catch (err) {
      console.error(err);
      toast.error("Failed to merge guest cart");
    }
  };

  useEffect(() => {
    if (user) mergeGuestCart();
  }, [user]);

  // Optimistic updates for add/update/remove
  const add = async (productId, size, quantity = 1) => {
    if (!size) {
      toast.error("Please select a size!");
      return;
    }

    const existing = items.find(i => i.product._id === productId && i.size === size);

    if (existing) {
      setItems(prev =>
        prev.map(i =>
          i.product._id === productId && i.size === size
            ? { ...i, quantity: i.quantity + quantity }
            : i
        )
      );
    } else {
      setItems(prev => [...prev, { product: { _id: productId }, size, quantity }]);
    }

    try {
      await client().post('/add', { productId, size, quantity });
      await refresh();
      toast.success("Added to cart");
    } catch (err) {
      console.error(err);
      toast.error("Failed to add item");
      refresh();
    }
  };

  const update = async (productId, quantity) => {
    setItems(prev => prev.map(i => i.product._id === productId ? { ...i, quantity } : i));
    try {
      await client().post('/update', { productId, quantity });
      await refresh();
      toast.success("Cart updated");
    } catch (err) {
      console.error(err);
      toast.error("Failed to update cart");
      refresh();
    }
  };

  const remove = async (productId) => {
    setItems(prev => prev.filter(i => i.product._id !== productId));
    try {
      await client().post('/remove', { productId });
      await refresh();
      toast.success("Product removed from cart");
    } catch (err) {
      console.error(err);
      toast.error("Failed to remove item");
      refresh();
    }
  };

  const value = { items, add, update, remove, refresh, mergeGuestCart };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  return useContext(CartContext);
}
