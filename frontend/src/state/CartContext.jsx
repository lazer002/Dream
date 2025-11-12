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
   const [loading, setLoading] = useState(true);
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
     setLoading(true); // start loading
    try {
      const { data } = await client().get('/');
      // console.log("Cart refreshed:", data);
      setItems(data.items);
    } catch (err) {
      console.error(err);
      toast.error("Failed to refresh cart");
    } finally {
      setLoading(false); // stop loading
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

  
const add = async (productId, size, quantity = 1) => {
  if (!size) {
    toast.error("Please select a size!");
    return;
  }

  // Check if the item with same product + size exists in frontend cart
  const existing = items.find(
    i => i.product && i.product._id === productId && i.size === size
  );

  if (existing) {
    setItems(prev =>
      prev.map(i =>
        i.product && i.product._id === productId && i.size === size
          ? { ...i, quantity: i.quantity + quantity }
          : i
      )
    );

  } else {
    setItems(prev => [...prev, { product: { _id: productId }, size, quantity }]);
  }

  try {
    // Send to backend: include size to avoid duplicate key errors
    await client().post('/add', { productId, size, quantity });
    
    // Refresh cart state from backend
    await refresh();

    toast.success("Added to cart");
  } catch (err) {
    console.error(err);

    // Likely duplicate key issue if backend index not updated
    if (err.response?.data?.code === 11000) {
      toast.error("This product & size is already in cart");
    } else {
      toast.error("Failed to add item");
    }

    refresh();
  }
};


const update = async (id, quantity, size, isBundle = false) => {
  setItems((prev) =>
    prev.map((i) => {
      if (isBundle) {
        // match bundle by id
        return i.bundle?._id === id ? { ...i, quantity } : i;
      } else {
        // match single product by id + size
        return i.product?._id === id && i.size === size
          ? { ...i, quantity }
          : i;
      }
    })
  );

  try {
    await client().post("/update", {
      quantity,
      size: isBundle ? undefined : size,
      productId: isBundle ? undefined : id,
      bundleId: isBundle ? id : undefined,
    });
    // await refresh();
    toast.success("Cart updated");
  } catch (err) {
    console.error(err);
    toast.error("Failed to update cart");
    await refresh();
  }
};


  // 🧩 Remove item
const remove = async (id, size, isBundle = false) => {
  if (isBundle) {
    // Remove bundle locally
    setItems((prev) => prev.filter((i) => i.bundle?._id !== id));
  } else {
    // Remove single product locally
    setItems((prev) =>
      prev.filter((i) => !(i.product?._id === id && i.size === size))
    );
  }

  try {
    if (isBundle) {
      await client().post("/remove", { bundleId: id });
    } else {
      await client().post("/remove", { productId: id, size });
    }
    // await refresh();
    toast.success(isBundle ? "Bundle removed from cart" : "Product removed from cart");
  } catch (err) {
    console.error(err);
    toast.error(err.response?.data?.error || "Failed to remove item");
    await refresh();
  }
};

const clearCart = async (opts = { server: true }) => {
  setLoading(true);
  try {
    setItems([]);

    if (opts.server) {
      await client().post("/clear"); // backend should handle guestId or user from header/token
    }
    toast.success("Cart cleared");
  } catch (err) {
    console.error("Failed to clear cart:", err);
    toast.error("Failed to clear cart");
    await refresh();
  } finally {
    setLoading(false);
  }
};

const addBundleToCart = async (bundle, selectedSizes) => {
  console.log("Adding bundle to cart:", bundle, selectedSizes);

  // Ensure all products have a selected size
  const allSizesSelected =
    bundle.products.every((p) => selectedSizes[p._id]) &&
    Object.keys(selectedSizes).length === bundle.products.length;

  if (!allSizesSelected) {
    toast.error("Please select size for all products in the bundle!");
    return;
  }

  // Check if bundle already exists in cart (with same sizes)
  const existing = items.find((item) => {
    if (!item.bundle) return false;
    if (item.bundle._id !== bundle._id) return false;

    return item.bundleProducts.every((bp) => {
      const productId = bp.product?._id || bp.product;
      return (
        selectedSizes[productId] && bp.size === selectedSizes[productId]
      );
    });
  });

  if (existing) {
    // Increase quantity
    setItems((prev) =>
      prev.map((item) =>
        item === existing ? { ...item, quantity: item.quantity + 1 } : item
      )
    );
  } else {
    // Build new bundle object for cart
    const bundleProducts = bundle.products.map((p) => ({
      product: {
        _id: p._id,
        title: p.title,
        price: p.price,
        images: p.images,
      },
      size: selectedSizes[p._id],
      quantity: 1,
    }));

    setItems((prev) => [
      ...prev,
      {
        bundle: {
          _id: bundle._id,
          title: bundle.title,
          price: bundle.price,
          mainImage: bundle.mainImages?.[0] || "/placeholder.jpg",
        },
        bundleProducts,
        quantity: 1,
      },
    ]);
  }

  // 🔗 Send to backend
  try {
    await client().post("/addbundle", {
      bundleId: bundle._id,
      mainImage: bundle.mainImages?.[0] || "",
      bundleProducts: bundle.products.map((p) => ({
        productId: p._id,
        size: selectedSizes[p._id],
        quantity: 1,
      })),
    });

    await refresh();
    toast.success("Bundle added to cart!");
  } catch (err) {
    console.error(err);
    toast.error("Failed to add bundle");
    await refresh();
  }
};


  const value = { items, add, update, remove, refresh, mergeGuestCart, addBundleToCart, clearCart, loading };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  return useContext(CartContext);
}
