// src/main.jsx
import React from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { Provider } from "react-redux";

import App from "./App.jsx";
import "./styles.css";

import { store } from "./store/store.js";
import { WishlistProvider } from "./state/WishlistContext.jsx";
import { AuthProvider } from "./state/AuthContext.jsx";
import SmoothScroll from "./components/SmoothScroll.jsx";
import ScrollManager from "./components/ScrollManager.jsx";

createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <Provider store={store}>
      <AuthProvider>
        <WishlistProvider>
          <BrowserRouter>
            <SmoothScroll>
              <ScrollManager />
              <App />
            </SmoothScroll>
          </BrowserRouter>
        </WishlistProvider>
      </AuthProvider>
    </Provider>
  </React.StrictMode>
);