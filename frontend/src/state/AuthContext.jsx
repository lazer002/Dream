import  { createContext, useContext, useEffect, useMemo, useState } from 'react'
import axios from 'axios'

const AuthContext = createContext(null)

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000/api'

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const raw = localStorage.getItem('ds_user')
    return raw ? JSON.parse(raw) : null
  })
  const [accessToken, setAccessToken] = useState(localStorage.getItem('ds_access') || null)
  const [refreshToken, setRefreshToken] = useState(localStorage.getItem('ds_refresh') || null)

  useEffect(() => {
    if (user) localStorage.setItem('ds_user', JSON.stringify(user))
    else localStorage.removeItem('ds_user')
  }, [user])
  useEffect(() => {
    if (accessToken) localStorage.setItem('ds_access', accessToken)
    else localStorage.removeItem('ds_access')
  }, [accessToken])
  useEffect(() => {
    if (refreshToken) localStorage.setItem('ds_refresh', refreshToken)
    else localStorage.removeItem('ds_refresh')
  }, [refreshToken])

  const api = useMemo(() => {
    const instance = axios.create({ baseURL: API_URL })
    instance.interceptors.request.use((config) => {
      if (accessToken) config.headers.Authorization = `Bearer ${accessToken}`
      return config
    })
    instance.interceptors.response.use(
      (res) => res,
      async (error) => {
        if (error.response?.status === 401 && refreshToken) {
          try {
            const { data } = await axios.post(`${API_URL}/auth/refresh`, { refreshToken })
            setAccessToken(data.accessToken)
            error.config.headers.Authorization = `Bearer ${data.accessToken}`
            return axios(error.config)
          } catch (e) {
            setUser(null)
            setAccessToken(null)
            setRefreshToken(null)
          }
        }
        return Promise.reject(error)
      }
    )
    return instance
  }, [accessToken, refreshToken])

  const login = async (email, password) => {
    const { data } = await axios.post(`${API_URL}/auth/login`, { email, password })
    setUser(data.user)
    setAccessToken(data.accessToken)
    setRefreshToken(data.refreshToken)
    return data
  }

  const register = async (name, email, password) => {
    const { data } = await axios.post(`${API_URL}/auth/register`, { name, email, password })
    setUser(data.user)
    setAccessToken(data.accessToken)
    setRefreshToken(data.refreshToken)
    return data
  }

  const logout = () => {
    setUser(null)
    setAccessToken(null)
    setRefreshToken(null)
  }

  const value = { user, api, login, register, logout }
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  return useContext(AuthContext)
}


