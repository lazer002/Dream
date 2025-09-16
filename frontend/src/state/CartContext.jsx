import React, { createContext, useContext, useEffect, useMemo, useState } from 'react'
import axios from 'axios'
import { useAuth } from './AuthContext.jsx'

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

  const client = useMemo(() => {
    const inst = axios.create({ baseURL: `${API_URL}/cart`, headers: { 'x-guest-id': guestId } })
    return inst
  }, [guestId])

  async function refresh() {
    const { data } = await client.get('/')
    setItems(data.items)
  }

  useEffect(() => {
    refresh()
  }, [])

  useEffect(() => {
    if (user) {
      axios.post(`${API_URL}/cart/merge`, { guestId }, { headers: { Authorization: `Bearer ${localStorage.getItem('ds_access')}` } }).then(refresh)
    }
  }, [user])

  async function add(productId, quantity = 1) {
    await client.post('/add', { productId, quantity })
    await refresh()
  }

  async function update(productId, quantity) {
    await client.post('/update', { productId, quantity })
    await refresh()
  }

  const value = { items, add, update, refresh }
  return <CartContext.Provider value={value}>{children}</CartContext.Provider>
}

export function useCart() {
  return useContext(CartContext)
}


