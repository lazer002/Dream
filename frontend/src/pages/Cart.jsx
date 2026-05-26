// src/pages/Cart.jsx

import { Link } from "react-router-dom";
import { Trash } from "lucide-react";
import { useCart } from "../state/CartContext.jsx";
import { getDeliveryDate } from "@/utils/public.js";
import { useState } from "react";
import { useWishlist } from "../state/WishlistContext.jsx";

export default function Cart() {
  const { wishlist, addToWishlist, removeFromWishlist } = useWishlist();
  const { items, update, remove, loading } = useCart();
const [expandedBundles, setExpandedBundles] = useState({});
const [removeModal, setRemoveModal] = useState({
  open: false,
  id: null,
  size: null,
  isBundle: false,
  image: null,
  title: "",
});
const subtotal = items.reduce((s, it) => {
  const isBundle =
    !!it.bundle || !!it.customBundle;

  return (
    s +
    (
      isBundle
        ? (it.bundle?.price ||
           it.customBundle?.price ||
           0) * it.quantity
        : (it.product?.price || 0) *
          it.quantity
    )
  );
}, 0);

  const tax = subtotal * 0.05;
  const deliveryFee = subtotal > 500 ? 0 : 50;
  const discount = 0;
  const total = subtotal + tax + deliveryFee - discount;
const openRemoveModal = (
  id,
  size = null,
  isBundle = false,
  image = null,
  title = ""
) => {
  setRemoveModal({
    open: true,
    id,
    size,
    isBundle,
    image,
    title,
  });
};
  // =========================
  // LOADING
  // =========================

  if (loading) {
    return (
      <div className=" mx-auto px-4 md:px-8 py-10 animate-pulse">
        <div className="h-10 w-40 bg-gray-200 mb-10"></div>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-12">
          <div className="space-y-8">
            {[1, 2, 3].map((_, i) => (
              <div key={i} className="border-b pb-6 flex gap-5">
                <div className="w-28 h-32 bg-gray-200"></div>

                <div className="flex-1 space-y-3">
                  <div className="h-4 bg-gray-200 w-48"></div>
                  <div className="h-3 bg-gray-200 w-24"></div>
                  <div className="h-3 bg-gray-200 w-20"></div>
                </div>
              </div>
            ))}
          </div>

          <div className="border p-6 h-[350px] bg-gray-50"></div>
        </div>
      </div>
    );
  }

  // =========================
  // EMPTY CART
  // =========================

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-32 gap-6 text-center">
        <h2 className="text-4xl font-black uppercase">
          Your Cart is Empty
        </h2>

        <p className="text-gray-600 max-w-md">
          Looks like you haven’t added any products yet.
        </p>

        <Link
          to="/products"
          className="bg-black text-white px-8 py-4 uppercase text-sm tracking-wide"
        >
          Continue Shopping
        </Link>
      </div>
    );
  }

  // =========================
  // MAIN
  // =========================

  return (
    <div className="max-w-[75vw] mx-auto px-4 md:px-8 py-10">
      
      {/* HEADER */}
      <div className="flex items-center justify-between border-b border-gray-200 pb-5 mb-10">
        <div className="flex items-center gap-3">
          <h1 className="text-4xl md:text-5xl font-black uppercase tracking-tight">
            Cart
          </h1>

          <span className="text-xs uppercase tracking-widest text-gray-500 mt-4">
            [{items.length} Items]
          </span>
        </div>

        <div className="hidden md:flex items-center gap-2 text-xs text-gray-600">
          <div className="w-2 h-2 rounded-full bg-black"></div>
          <span>You have unlocked free shipping</span>
        </div>
      </div>

      {/* MAIN GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-14">
        
        {/* ========================= */}
        {/* LEFT SIDE */}
        {/* ========================= */}

        <div>
          {items.map((it) => {
            const isBundle =  !!it.bundle || !!it.customBundle;

           const key = isBundle
  ? (it.bundle?._id ||
     `custom-${it._id}`)
  : `${it.product?._id}-${it.size}`;

            const imageSrc = isBundle
              ? it.mainImage || "/placeholder.jpg"
              : it.product?.images?.[0] || "/placeholder.jpg";

            return (
              <div
                key={key}
                className="border-b border-gray-200 py-6 max-w-4xl"
              >
                <div className="flex gap-5 justify-between">
                  
                  {/* LEFT */}
                  <div className="flex gap-4 flex-1">
                    
                    {/* IMAGE */}
                    <img
                      src={imageSrc}
                      alt=""
                      className="w-32 h-38 object-cover bg-gray-100"
                    />

                    {/* INFO */}
                    <div className="flex flex-col justify-between">
                      
                      <div>
                        <h3 className="uppercase tracking-wide text-xl font-semibold text-black">
                          {isBundle
                            ? it.bundle?.title ||it.customBundle?.title || "Custom Bundle"
                            : it.product.title}
                        </h3>

                        {isBundle ? (
                          <p className="text-sm text-black/70 font-semibold mt-1 uppercase">
                            Bundle of{" "}
                            {it.bundleProducts?.length || 0} items
                          </p>
                        ) : (
                          it.size && (
                            <p className="text-sm text-black/70 font-semibold mt-1 uppercase">
                              Size {it.size}
                            </p>
                          )
                        )}

                        <p className="text-sm font-bold text-black/70 mt-2">
                          Delivery by{" "}
                          <span className="text-black font-bold">
                            {getDeliveryDate()}
                          </span>
                        </p>
                      </div>

                      {/* QUANTITY */}
                      <div className="flex items-center gap-5 mt-4">
                        
          <button
  onClick={() => {

    // OPEN MODAL WHEN QTY = 1
    if (it.quantity === 1) {

      openRemoveModal(
        isBundle
          ?  it._id
          : it.product._id,

        isBundle ? null : it.size,

        isBundle,

        imageSrc,

    isBundle
  ? (
      it.bundle?.title ||
      it.customBundle?.title ||
      "Custom Bundle"
    )
  : it.product?.title
      );

      return;
    }

    // NORMAL DECREASE
    update(
      isBundle
        ? it.bundle?._id || it._id
        : it.product._id,
      it.quantity - 1,
      it.size,
      isBundle
    );

  }}
  className="text-xl text-gray-500 hover:text-black transition"
>
  -
</button>

                        <span className="text-sm font-medium min-w-[20px] text-center">
                          {it.quantity}
                        </span>

                        <button
                          onClick={() =>
                            update(
                              isBundle
                                ? it.bundle?._id || it._id
                                : it.product._id,
                              it.quantity + 1,
                              it.size,
                              isBundle
                            )
                          }
                          className="text-xl text-gray-500 hover:text-black transition"
                        >
                          +
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* RIGHT */}
                  <div className="flex flex-col items-end justify-between">
                    
                    {/* PRICE */}
                    <div className="text-right">
                      <p className="text-lg font-semibold text-black">
                        ₹
                        {(
                          isBundle
                            ?  (it.bundle?.price || it.customBundle?.price ) * it.quantity
                            : it.product.price * it.quantity
                        ).toLocaleString()}
                      </p>
                    </div>

                    {/* ACTIONS */}
                    <div className="flex items-center gap-4">
                <Trash
  className="size-4 text-gray-400 hover:text-red-500 cursor-pointer transition"
  onClick={() =>
    openRemoveModal(
      isBundle
        ?  it._id
        : it.product._id,

      isBundle ? null : it.size,

      isBundle,

      imageSrc,

     isBundle
  ? (
      it.bundle?.title ||
      it.customBundle?.title ||
      "Custom Bundle"
    )
  : it.product?.title
    )
  }
/>
                    </div>
                  </div>
                </div>

                {/* ========================= */}
                {/* KEEP THIS EXACTLY */}
                {/* ========================= */}

           {/* ========================= */}
{/* BUNDLE EXPAND SECTION */}
{/* ========================= */}

{isBundle && (
  <div className="mt-4 ml-24">
    
    {/* Toggle Button */}
    <button
      onClick={() =>
        setExpandedBundles((prev) => ({
          ...prev,
          [key]: !prev[key],
        }))
      }
      className="flex items-center gap-2 text-xs uppercase tracking-wide text-gray-500 hover:text-black transition"
    >
      <span>
        {expandedBundles[key] ? "Hide Items" : "View Items"}
      </span>

      <span
        className={`transition-transform duration-300 ${
          expandedBundles[key] ? "rotate-180" : ""
        }`}
      >
        ▼
      </span>
    </button>

    {/* Expand Content */}
    <div
      className={`overflow-hidden transition-all duration-300 ${
        expandedBundles[key]
          ? "max-h-[500px] opacity-100 mt-4"
          : "max-h-0 opacity-0"
      }`}
    >
      <div className="space-y-3 border-l border-gray-200 pl-4">
        {it.bundleProducts?.map((bp, i) => (
          <div
            key={i}
            className="flex items-center gap-3"
          >
            {/* IMAGE */}
            <img
              src={
                bp.product?.images?.[0] ||
                "/placeholder.jpg"
              }
              alt=""
              className="w-12 h-12 rounded object-cover border border-gray-200"
            />

            {/* INFO */}
            <div className="flex flex-col">
              <p className="text-xs font-medium text-gray-800 uppercase">
                {bp.product?.title}
              </p>

              {bp.size && (
                <p className="text-[11px] text-gray-500 uppercase">
                  Size {bp.size}
                </p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  </div>
)}
              </div>
            );
          })}
        </div>

        {/* ========================= */}
        {/* RIGHT SUMMARY */}
        {/* ========================= */}

        <div>
          <div className="sticky top-24 border border-gray-200 p-6 bg-white">
            
            <h2 className="text-2xl font-black uppercase mb-8">
              Order Summary
            </h2>

            <div className="space-y-5 text-sm">
              
              <div className="flex justify-between">
                <span className="uppercase text-gray-500">
                  Subtotal
                </span>

                <span>
                  ₹{subtotal.toFixed(2)}
                </span>
              </div>

              <div className="flex justify-between">
                <span className="uppercase text-gray-500">
                  Tax
                </span>

                <span>
                  ₹{tax.toFixed(2)}
                </span>
              </div>

              <div className="flex justify-between">
                <span className="uppercase text-gray-500">
                  Delivery
                </span>

                <span>
                  ₹{deliveryFee.toFixed(2)}
                </span>
              </div>

              <div className="flex justify-between">
                <span className="uppercase text-gray-500">
                  Discount
                </span>

                <span>
                  -₹{discount.toFixed(2)}
                </span>
              </div>

              <div className="border-t pt-5 flex justify-between text-lg font-bold">
                <span className="uppercase">
                  Total
                </span>

                <span>
                  ₹{total.toFixed(2)}
                </span>
              </div>
            </div>

            {/* PROMO */}
            <div className="mt-8">
              <p className="text-xs uppercase tracking-wide mb-3 font-semibold">
                Promo Code
              </p>

              <div className="flex">
                <input
                  type="text"
                  placeholder="ENTER PROMO CODE"
                  className="flex-1 border border-gray-300 px-3 py-3 text-xs outline-none"
                />

                <button className="bg-black text-white px-5 text-xs font-semibold hover:opacity-90 transition rounded-lg">
                  APPLY
                </button>
              </div>
            </div>

            {/* CHECKOUT */}
            <Link to="/checkout">
              <button className="w-full bg-black text-white py-4 mt-6 uppercase tracking-wide text-sm hover:opacity-90 transition rounded-lg">
                Checkout
              </button>
            </Link>
          </div>
        </div>
      </div>

      {/* ========================= */}
      {/* YOU MIGHT ALSO LIKE */}
      {/* ========================= */}

      <div className="mt-24">
        <h2 className="text-4xl md:text-5xl font-black uppercase mb-10">
          You Might Also Like
        </h2>

        {/* PUT YOUR PRODUCT SLIDER HERE */}
      </div>

{/* REMOVE MODAL */}
{removeModal.open && (
  <div className="fixed inset-0 z-[999] flex items-center justify-center p-4">
    
    {/* BACKDROP */}
    <div
      className="absolute inset-0 bg-black/30 backdrop-blur-[2px]"
      onClick={() =>
        setRemoveModal({
          open: false,
          id: null,
          size: null,
          isBundle: false,
          image: null,
          title: "",
        })
      }
    />

    {/* MODAL */}
    <div className="relative w-full max-w-md rounded-[30px] bg-white p-7 shadow-[0_20px_60px_rgba(0,0,0,0.12)]">

      {/* CLOSE */}
      <button
        onClick={() =>
          setRemoveModal({
            open: false,
            id: null,
            size: null,
            isBundle: false,
            image: null,
            title: "",
          })
        }
        className="absolute right-5 top-5 flex h-9 w-9 items-center justify-center rounded-full hover:bg-gray-100 transition"
      >
        ✕
      </button>

      {/* HEADER */}
      <div className="text-center">
        <p className="text-xs uppercase tracking-[0.25em] text-gray-400">
          Shopping Bag
        </p>

        <h2 className="mt-3 text-[30px] font-semibold tracking-tight text-black">
          Move from bag
        </h2>

      </div>

      {/* PRODUCT */}
      <div className="mt-2 flex items-center gap-4 rounded-2xl border border-gray-100 p-4">
        
        {/* IMAGE */}
        <img
          src={removeModal.image}
          alt=""
          className="h-24 w-20 rounded-xl object-cover bg-gray-100"
        />

        {/* INFO */}
        <div className="flex flex-col">
          
          <p className="text-sm font-bold leading-relaxed text-black">
            {removeModal.title}
          </p>

        <p className="text-sm leading-relaxed text-gray-500">
          Are you sure you want to move this
          product from bag?
        </p>
          {removeModal.isBundle && (
            <span className="mt-2 w-fit rounded-full bg-gray-100 px-3 py-1 text-[10px] uppercase tracking-wide text-gray-500">
              Bundle
            </span>
          )}
        </div>
      </div>

      {/* BUTTONS */}
      <div className="mt-8 grid grid-cols-2 gap-3">
        
        {/* REMOVE */}
        <button
          onClick={async () => {

            const { id, size, isBundle } = removeModal;

            setRemoveModal({
              open: false,
              id: null,
              size: null,
              isBundle: false,
              image: null,
              title: "",
            });

            await remove(id, size, isBundle);
          }}
          className="w-full h-14 rounded-2xl border border-gray-300 bg-white text-sm font-semibold tracking-wide text-black transition hover:bg-gray-100"
        >
          REMOVE
        </button>

        {/* WISHLIST */}
    <button
  onClick={async () => {

    const { id, size, isBundle } = removeModal;

    // wishlist toggle
    wishlist.includes(id)
      ? removeFromWishlist(id)
      : addToWishlist(id);

    // close modal
    setRemoveModal({
      open: false,
      id: null,
      size: null,
      isBundle: false,
      image: null,
      title: "",
    });

    // remove from cart
    await remove(id, size, isBundle);

  }}
  className="w-full h-14 rounded-2xl bg-black text-sm font-semibold tracking-wide text-white transition hover:opacity-90"
>
  MOVE TO WISHLIST
</button>
      </div>
    </div>
  </div>
)}

    </div>
  );
}