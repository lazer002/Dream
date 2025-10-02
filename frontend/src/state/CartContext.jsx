import React, { createContext, useContext, useEffect, useMemo, useState } from 'react'
import axios from 'axios'
import { useAuth } from './AuthContext.jsx'
import { toast } from "react-hot-toast"

const CartContext = createContext(null)
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000/api'

function ensureGuestId() {
  let gid = localStorage.getItem('ds_guest')
  if (!gid) {
    gid = crypto.randomUUID()
    localStorage.setItem('ds_guest', gid)
  }
  return gid
}

export function CartProvider({ children }) {
  const { user } = useAuth()
  const [items, setItems] = useState([])
  const guestId = ensureGuestId()

  const client = useMemo(() => axios.create({
    baseURL: `${API_URL}/cart`,
    headers: { 'x-guest-id': guestId }
  }), [guestId])

  const refresh = async () => {
    try {
      const { data } = await client.get('/')
      setItems(data.items)
    } catch (err) {
      console.error(err)
      toast.error("Failed to refresh cart")
    }
  }

  // Fetch cart on load
  useEffect(() => { refresh() }, [])

  // Merge guest cart after login
  const mergeGuestCart = async () => {
    const token = localStorage.getItem('ds_access')
    if (!user || !token) return

    try {
      await axios.post(`${API_URL}/cart/merge`, { guestId }, {
        headers: { Authorization: `Bearer ${token}` }
      })
      await refresh()
      toast.success("Guest cart merged successfully")
    } catch (err) {
      console.error(err)
      toast.error("Failed to merge guest cart")
    }
  }

  useEffect(() => {
    if (user) mergeGuestCart()
  }, [user])

  // Optimistic updates for add/update/remove
  const add = async (productId, quantity = 1) => {
    const existing = items.find(i => i.product._id === productId)
    if (existing) {
      setItems(prev => prev.map(i => i.product._id === productId ? { ...i, quantity: i.quantity + quantity } : i))
    } else {
      setItems(prev => [...prev, { product: { _id: productId }, quantity }])
    }

    try {
      await client.post('/add', { productId, quantity })
      await refresh()
      toast.success("Added to cart")
    } catch (err) {
      console.error(err)
      toast.error("Failed to add item")
      refresh()
    }
  }

  const update = async (productId, quantity) => {
    setItems(prev => prev.map(i => i.product._id === productId ? { ...i, quantity } : i))
    try {
      await client.post('/update', { productId, quantity })
      await refresh()
      toast.success("Cart updated")
    } catch (err) {
      console.error(err)
      toast.error("Failed to update cart")
      refresh()
    }
  }

  const remove = async (productId) => {
    setItems(prev => prev.filter(i => i.product._id !== productId))
    try {
      await client.post('/remove', { productId })
      await refresh()
      toast.success("Product removed from cart")
    } catch (err) {
      console.error(err)
      toast.error("Failed to remove item")
      refresh()
    }
  }

  const value = { items, add, update, remove, refresh, mergeGuestCart }

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>
}

export function useCart() {
  return useContext(CartContext)
}
