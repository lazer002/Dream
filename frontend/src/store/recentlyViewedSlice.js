// src/store/recentlyViewedSlice.js

import { createSlice } from "@reduxjs/toolkit";

const STORAGE_KEY = "recently_viewed_items";
const MAX_ITEMS = 8;

const getInitialItems = () => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);

    if (!stored) return [];

    const parsed = JSON.parse(stored);

    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

const saveItems = (items) => {
  try {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(items)
    );
  } catch (error) {
    console.error(
      "FAILED TO SAVE RECENTLY VIEWED:",
      error
    );
  }
};

const recentlyViewedSlice = createSlice({
  name: "recentlyViewed",

  initialState: {
    items: getInitialItems(),
  },

  reducers: {
    addRecentlyViewed: (state, action) => {
      const item = action.payload;

      if (
        !item?.publicId &&
        !item?._id
      ) {
        return;
      }

      const id = String(
        item.publicId || item._id
      );

      const filtered = state.items.filter(
        (existing) =>
          String(
            existing.publicId ||
              existing._id
          ) !== id
      );

      state.items = [
        item,
        ...filtered,
      ].slice(0, MAX_ITEMS);

      saveItems(state.items);
    },

    clearRecentlyViewed: (state) => {
      state.items = [];

      localStorage.removeItem(
        STORAGE_KEY
      );

      // Remove old version too
      localStorage.removeItem(
        "recently_viewed_products"
      );
    },
  },
});

export const {
  addRecentlyViewed,
  clearRecentlyViewed,
} = recentlyViewedSlice.actions;

export default recentlyViewedSlice.reducer;