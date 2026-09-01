// src/store/store.js

import { configureStore } from "@reduxjs/toolkit";
import { api } from "./api";
import recentlyViewedReducer from "./recentlyViewedSlice";

export const store = configureStore({
  reducer: {
    [api.reducerPath]: api.reducer,

    recentlyViewed: recentlyViewedReducer,
  },

  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(
      api.middleware
    ),
});