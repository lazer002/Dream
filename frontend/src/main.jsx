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

const hasAccess = localStorage.getItem("garrib_access");

const ComingSoon = () => (
  <div
    style={{
      minHeight: "100vh",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      background: "#fff",
      color: "#111",
      fontFamily: "Arial, sans-serif",
      textAlign: "center",
      padding: "24px",
    }}
  >
    <div>
      <h1
        style={{
          fontSize: "48px",
          fontWeight: "800",
          margin: 0,
          letterSpacing: "-2px",
        }}
      >
        GARRIB
      </h1>

      <p
        style={{
          marginTop: "16px",
          fontSize: "18px",
          color: "#777",
        }}
      >
        Coming Soon
      </p>
    </div>
  </div>
);

createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    {hasAccess ? (
      <Provider store={store}>
        <AuthProvider>
          <BrowserRouter>
            <WishlistProvider>
              <SmoothScroll>
                <ScrollManager />
                <App />
              </SmoothScroll>
            </WishlistProvider>
          </BrowserRouter>
        </AuthProvider>
      </Provider>
    ) : (
      <ComingSoon />
    )}
  </React.StrictMode>
);