import React from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App.jsx'
import './styles.css'
import { WishlistProvider } from "./state/WishlistContext.jsx";
import { AuthProvider } from './state/AuthContext.jsx'
createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <AuthProvider>
      <WishlistProvider>
        <BrowserRouter>
          <App />
        </BrowserRouter>
      </WishlistProvider>
    </AuthProvider>
  </React.StrictMode>
)


