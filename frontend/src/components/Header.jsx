"use client";

import { useEffect, useRef, useState } from "react";
import {
  Menu,
  Search,
  ShoppingCart,
  User,
  X,
  Clock ,ChevronRight,Heart ,Package ,LogOut ,ChevronLeft
} from "lucide-react";
import {
  Link,
  useLocation,
} from "react-router-dom";
import { useCart } from "../state/CartContext.jsx";
import { useAuth } from "../state/AuthContext.jsx";
import { useWishlist } from "../state/WishlistContext.jsx";

import {
  useGetCategoriesQuery,
  useGetProductsQuery,
} from "@/store/api";

const navItems = [
  {
    id: "home",
    title: "HOME",
    url: "/",
  },
  {
    id: "men",
    title: "MEN",
    url: "/products",
    megaMenu: true,
  },
  {
    id: "collections",
    title: "COLLECTIONS",
    url: "/collections",
  },
  {
    id: "new-arrivals",
    title: "NEW ARRIVALS",
    url: "/newarrivals",
  },
];


// 4. ADD THIS COMPONENT AT THE BOTTOM OF Header.jsx

function QuickViewModal({
  product,
  onClose,
}) {
  const { add } = useCart();

  const [selectedSize, setSelectedSize] =
    useState("");

  const inventory =
    product?.inventory || {};

  const stock =
    inventory?.stock ||
    inventory ||
    {};

  const sizes = Object.entries(stock)
    .filter(
      ([, qty]) => Number(qty) > 0
    )
    .map(([size]) => size);

  const selectedStock = selectedSize
    ? Number(stock[selectedSize] || 0)
    : 0;

  const outOfStock =
    product?.inventory?.trackInventory !==
    false &&
    sizes.length === 0;

  const handleAdd = async () => {
    if (!selectedSize) {
      toast.error("Please select a size");
      return;
    }

    if (
      product?.inventory?.trackInventory !==
      false &&
      selectedStock <= 0
    ) {
      toast.error("This size is out of stock");
      return;
    }

    await add(
      product.publicId,
      selectedSize,
      1
    );

    onClose();
  };

  return (
    <div className="
  fixed
  inset-0
  z-[99999]
  flex
  items-center
  justify-center
  p-4
">
      <button
        type="button"
        onClick={onClose}
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
      />

      <div className="
    relative
    z-10
    w-full
    max-w-4xl
    max-h-[90vh]
    overflow-y-auto
    rounded-2xl
    bg-white
    shadow-2xl
  ">
        <button
          type="button"
          onClick={onClose}
          className="
            absolute
            right-4
            top-4
            z-10
            flex
            h-10
            w-10
            items-center
            justify-center
            rounded-full
            bg-white
            shadow
            transition
            hover:bg-black
            hover:text-white
          "
        >
          <X size={18} />
        </button>

        <div className="
          grid
          grid-cols-1
          md:grid-cols-2
        ">
          <div className="
             h-[45vh]
  min-h-[300px]
  max-h-[650px]
  bg-neutral-100
  overflow-hidden
  md:h-[70vh]
          ">
            <img
              src={
                product?.images?.[0] ||
                product?.mainImage ||
                "/placeholder.png"
              }
              alt={product?.title}
              className="
                h-full
                w-full
                object-cover
              "
            />
          </div>

          <div className="
            flex
            flex-col
            justify-center
            p-7
            md:p-10
          ">
            <p className="
              text-[9px]
              font-bold
              uppercase
              tracking-[0.25em]
              text-neutral-400
            ">
              {product?.category?.name ||
                "Product"}
            </p>

            <h2 className="
              mt-3
              text-2xl
              font-black
              uppercase
              tracking-tight
            ">
              {product?.title}
            </h2>

            <div className="
              mt-5
              flex
              items-center
              gap-3
            ">
              {product?.onSale && (
                <span className="
                  text-sm
                  text-neutral-400
                  line-through
                ">
                  ₹
                  {Math.round(
                    Number(product.price) /
                    0.7
                  ).toLocaleString("en-IN")}
                </span>
              )}

              <span className="
                text-xl
                font-bold
              ">
                ₹
                {Number(
                  product?.price || 0
                ).toLocaleString("en-IN")}
              </span>
            </div>

            {!outOfStock && (
              <>
                <p className="
                  mt-8
                  text-[10px]
                  font-bold
                  uppercase
                  tracking-[0.18em]
                ">
                  Select size
                </p>

                <div className="
                  mt-3
                  flex
                  flex-wrap
                  gap-2
                ">
                  {sizes.map((size) => {
                    const qty =
                      Number(
                        stock[size] || 0
                      );

                    const selected =
                      selectedSize === size;

                    return (
                      <button
                        key={size}
                        type="button"
                        onClick={() =>
                          setSelectedSize(
                            size
                          )
                        }
                        className={`
                          min-w-14
                          border
                          px-4
                          py-3
                          text-xs
                          font-bold
                          transition
                          ${selected
                            ? "border-black bg-black text-white"
                            : "border-neutral-200 hover:border-black"
                          }
                        `}
                      >
                        {size}
                      </button>
                    );
                  })}
                </div>

                {selectedSize && (
                  <p className="
                    mt-3
                    text-[10px]
                    font-semibold
                    uppercase
                    tracking-wider
                    text-neutral-400
                  ">
                    {selectedStock} available
                  </p>
                )}
              </>
            )}

            {outOfStock && (
              <p className="
                mt-8
                text-xs
                font-bold
                uppercase
                tracking-[0.15em]
                text-red-500
              ">
                Out of stock
              </p>
            )}

            <button
              type="button"
              disabled={
                outOfStock ||
                !selectedSize
              }
              onClick={handleAdd}
              className="
                mt-8
                flex
                h-14
                w-full
                items-center
                justify-center
                bg-black
                text-xs
                font-bold
                uppercase
                tracking-[0.18em]
                text-white
                transition
                hover:bg-neutral-800
                disabled:cursor-not-allowed
                disabled:opacity-30
              "
            >
              Add to bag
            </button>

            <Link
              to={`/product/${product?.publicId}`}
              onClick={onClose}
              className="
                mt-3
                flex
                h-12
                w-full
                items-center
                justify-center
                border
                border-neutral-200
                text-[10px]
                font-bold
                uppercase
                tracking-[0.16em]
                transition
                hover:border-black
              "
            >
              View full product
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Header() {
  const location = useLocation();

  const { user, logout } = useAuth();
  const { items } = useCart();
  const { wishlist } = useWishlist();

  /* =========================
     CATEGORIES
  ========================= */

  const {
    data: categoriesData,
    isLoading: categoriesLoading,
    isError: categoriesError,
  } = useGetCategoriesQuery();

  const categories = Array.isArray(
    categoriesData?.categories
  )
    ? categoriesData.categories
    : Array.isArray(categoriesData)
      ? categoriesData
      : [];

  /* =========================
     STATE
  ========================= */

  const [cartAnimate, setCartAnimate] =
    useState(false);

  const [mobileOpen, setMobileOpen] =
    useState(false);

  const [searchOpen, setSearchOpen] =
    useState(false);

  const [query, setQuery] =
    useState("");

  const [activeMenu, setActiveMenu] =
    useState(null);
  const [quickViewProduct, setQuickViewProduct] =
    useState(null);
const closeTimeoutRef = useRef(null);
const categoryScrollRef = useRef(null);

const [categoryScrollState, setCategoryScrollState] = useState({
  left: false,
  right: true,
});

  const baseClass = `
    text-[13px]
    font-bold
    tracking-[0.18em]
    uppercase
  `;

  /* =========================
     MENU
  ========================= */

  const openMenu = (menuId) => {
    if (closeTimeoutRef.current) {
      clearTimeout(closeTimeoutRef.current);
    }

    setActiveMenu(menuId);
  };

  const closeMenu = () => {
    closeTimeoutRef.current =
      setTimeout(() => {
        setActiveMenu(null);
      }, 180);
  };
useEffect(() => {
  const el = categoryScrollRef.current;

  if (!el) return;

  const updateCategoryScroll = () => {
    const maxScroll =
      el.scrollWidth - el.clientWidth;

    const currentScroll = el.scrollLeft;

    setCategoryScrollState({
      left: currentScroll > 5,
      right: currentScroll < maxScroll - 5,
    });
  };

  updateCategoryScroll();

  el.addEventListener(
    "scroll",
    updateCategoryScroll,
    { passive: true }
  );

  window.addEventListener(
    "resize",
    updateCategoryScroll
  );

  return () => {
    el.removeEventListener(
      "scroll",
      updateCategoryScroll
    );

    window.removeEventListener(
      "resize",
      updateCategoryScroll
    );
  };
}, [categories.length, activeMenu]);
  useEffect(() => {
    setActiveMenu(null);
    setMobileOpen(false);
  }, [
    location.pathname,
    location.search,
  ]);

  /* =========================
     SEARCH
  ========================= */

  const trimmedQuery = query.trim();

  const {
    data: searchData,
    isFetching: searchLoading,
  } = useGetProductsQuery(
    {
      q: trimmedQuery,
      limit: 8,
      page: 1,
    },
    {
      skip: trimmedQuery.length < 2,
    }
  );

  const results =
    searchData?.items ||
    searchData?.products ||
    [];

  const loading =
    trimmedQuery.length >= 2 &&
    searchLoading;

  /* =========================
     CART ANIMATION
  ========================= */

  useEffect(() => {
    if (!items.length) return;

    setCartAnimate(true);

    const timer = setTimeout(() => {
      setCartAnimate(false);
    }, 600);

    return () => clearTimeout(timer);
  }, [items.length]);

  /* =========================
     CLEANUP MENU TIMER
  ========================= */

  useEffect(() => {
    return () => {
      if (closeTimeoutRef.current) {
        clearTimeout(closeTimeoutRef.current);
      }
    };
  }, []);

  /* =========================
     SEARCH CLOSE
  ========================= */

  const closeSearch = () => {
    setSearchOpen(false);
    setQuery("");
  };

  /* =========================
     SEARCH RESULT CLICK
  ========================= */

  const handleSearchResult = () => {
    setSearchOpen(false);
    setQuery("");
  };

  return (
    <header
      className="
        sticky top-0 z-[10000]
        bg-white/95 
        border-b border-gray-100
      "
    >
      {/* NAVBAR */}
      <div
        className="
          relative
          h-[74px]
          px-6 xl:px-10
          flex items-center justify-between
        "
      >
        {/* LEFT */}
        <div
          className="
            flex items-center gap-16
          "
        >
          {/* MOBILE MENU */}
          <button
            className="xl:hidden"
            onClick={() =>
              setMobileOpen(true)
            }
          >
            <Menu className="w-6 h-6" />
          </button>

          {/* LOGO */}
          <Link
            to="/"
            className="
              hidden xl:block
              text-[28px]
              font-black
              tracking-tight
              uppercase
              [transform:scaleX(1.15)]
              origin-left
            "
          >
            GARRIB
          </Link>

          {/* NAV */}
          <nav
            className="
    hidden xl:flex
    items-center gap-2
  "
          >
            {navItems.map((item) => {
              const active =
                item.url === "/"
                  ? false
                  : location.pathname.startsWith(
                    item.url
                  );

              return (
                <div
                  key={item.id}
                  onMouseEnter={() => {
                    if (item.megaMenu) {
                      openMenu(item.id);
                    }
                  }}
                  onMouseLeave={() => {
                    if (item.megaMenu) {
                      closeMenu();
                    }
                  }}
                >
                  <Link
                    to={item.url}
                    className={`
            ${baseClass}

            px-5 py-3
            rounded-full

            transition-all duration-300 ease-out

            hover:bg-black
            hover:text-white
            hover:scale-[1.03]

            ${active
                        ? "bg-black text-white"
                        : "text-black"
                      }
          `}
                  >
                    {item.title}
                  </Link>
                </div>
              );
            })}
          </nav>
        </div>

        {/* MOBILE LOGO */}
        <div
          className="
            absolute left-1/2 max-[380px]:left-[37%]
          
            -translate-x-1/2
            xl:hidden
          "
        >
          <Link
            to="/"
            className="
              text-[22px]
              font-black
              tracking-tight
              uppercase
              [transform:scaleX(1.1)]
            "
          >
            GARRIB
          </Link>
        </div>

        {/* RIGHT */}
        <div
          className="
            flex items-center gap-5
          "
        >
          {user && user.role == "admin" && (
            <Link to="/admin" className="text-sm font-medium">
              {user.role}
            </Link>
          )}

          {/* SEARCH */}
          <button
            onClick={() =>
              setSearchOpen(true)
            }
          >
            <Search className="w-5 h-5" />
          </button>

          {/* PROFILE */}
          <div className="relative group">
            <button
              className="
                relative p-2 rounded-full
                hover:bg-gray-100
                transition-colors
              "
            >
              <User className="w-5 h-5" />
{wishlist.length > 0 && (
  <span className="absolute top-1 right-1 flex h-2.5 w-2.5 items-center justify-center">
    {/* Pulse */}
    <span
      className="
        absolute
        h-2.5
        w-2.5
        rounded-full
        bg-[#B6FF2E]
        wishlist-pulse
      "
    />

    {/* Core */}
    <span
      className="
        relative
        h-1.5
        w-1.5
        rounded-full
        bg-[#B6FF2E]
        ring-1
        ring-white
      "
    />
  </span>
)}
            </button>

 <div
  className="
    absolute right-0 mt-3
    w-[310px]
    overflow-hidden
    rounded-2xl
    border border-gray-200
    bg-white
    shadow-[0_20px_50px_rgba(0,0,0,0.12)]
    opacity-0 invisible
    translate-y-2
    group-hover:opacity-100
    group-hover:visible
    group-hover:translate-y-0
    transition-all duration-200
    z-50
  "
>
  {user ? (
    <>
      {/* ACCOUNT HEADER */}

      <div className="border-b border-gray-100 px-5 py-5">
        <div className="flex items-center gap-3">
          <div
            className="
              flex h-12 w-12 shrink-0 items-center justify-center
              rounded-full bg-black text-white
              text-sm font-black uppercase
            "
          >
            {user?.name?.charAt(0) ||
              user?.email?.charAt(0) ||
              "U"}
          </div>

          <div className="min-w-0">
            <p className="text-[9px] font-black uppercase tracking-[0.22em] text-gray-400">
              My Account
            </p>

            <p className="mt-1 truncate text-sm font-bold text-black">
              {user?.name || "Welcome back"}
            </p>

            {user?.email && (
              <p className="mt-0.5 truncate text-[11px] text-gray-500">
                {user.email}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* MENU */}

      <div className="p-2">

        <Link
          to="/profile"
          className="
            group/item flex items-center gap-3
            rounded-xl px-3 py-3
            transition-colors
            hover:bg-gray-50
          "
        >
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gray-100">
            <User className="h-4 w-4 text-black" />
          </div>

          <div className="flex-1">
            <p className="text-xs font-bold text-black">
              My Account
            </p>
            <p className="mt-0.5 text-[10px] text-gray-400">
              Profile, addresses & settings
            </p>
          </div>

          <ChevronRight className="h-4 w-4 text-gray-400 transition-transform group-hover/item:translate-x-0.5" />
        </Link>

        <Link
          to="/orders"
          className="
            group/item flex items-center gap-3
            rounded-xl px-3 py-3
            transition-colors
            hover:bg-gray-50
          "
        >
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gray-100">
            <Package className="h-4 w-4 text-black" />
          </div>

          <div className="flex-1">
            <p className="text-xs font-bold text-black">
              My Orders
            </p>
            <p className="mt-0.5 text-[10px] text-gray-400">
              View and track your orders
            </p>
          </div>

          <ChevronRight className="h-4 w-4 text-gray-400 transition-transform group-hover/item:translate-x-0.5" />
        </Link>

        <Link
          to="/wishlist"
          className="
            group/item flex items-center gap-3
            rounded-xl px-3 py-3
            transition-colors
            hover:bg-gray-50
          "
        >
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gray-100">
            <Heart className="h-4 w-4 text-black" />
          </div>

          <div className="flex-1">
            <p className="text-xs font-bold text-black">
              Wishlist
            </p>
            <p className="mt-0.5 text-[10px] text-gray-400">
              Your saved items
            </p>
          </div>

          {wishlist.length > 0 && (
            <span className="mr-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-[#B6FF2E] px-1.5 text-[9px] font-black text-black">
              {wishlist.length}
            </span>
          )}

          <ChevronRight className="h-4 w-4 text-gray-400 transition-transform group-hover/item:translate-x-0.5" />
        </Link>

        <Link
          to="/trackorder"
          className="
            group/item flex items-center gap-3
            rounded-xl px-3 py-3
            transition-colors
            hover:bg-gray-50
          "
        >
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gray-100">
            <Clock className="h-4 w-4 text-black" />
          </div>

          <div className="flex-1">
            <p className="text-xs font-bold text-black">
              Track Order
            </p>
            <p className="mt-0.5 text-[10px] text-gray-400">
              Check your order status
            </p>
          </div>

          <ChevronRight className="h-4 w-4 text-gray-400 transition-transform group-hover/item:translate-x-0.5" />
        </Link>

      </div>

      {/* LOGOUT */}

      <div className="border-t border-gray-100 p-3">
        <button
          onClick={logout}
          className="
            group/logout flex h-11 w-full
            items-center justify-center gap-2
            rounded-xl
            bg-gray-100
            text-[10px]
            font-black
            uppercase
            tracking-[0.18em]
            text-black
            transition-all
            hover:bg-black
            hover:text-white
          "
        >
          <LogOut className="h-4 w-4 transition-transform group-hover/logout:-translate-x-0.5" />
          Sign Out
        </button>
      </div>

      <div className="pb-3 text-center">
        <p className="text-[8px] font-medium uppercase tracking-[0.28em] text-gray-300">
          Premium Fashion · GARRIB
        </p>
      </div>
    </>
  ) : (
    <>
      {/* GUEST HEADER */}

      <div className="border-b border-gray-100 px-5 py-5">
        <p className="text-[9px] font-black uppercase tracking-[0.25em] text-gray-400">
          Account
        </p>

        <h3 className="mt-2 text-xl font-black tracking-tight text-black">
          Welcome to GARRIB
        </h3>

        <p className="mt-1 text-[11px] leading-5 text-gray-500">
          Sign in to access your account
          <br />
          and a better shopping experience.
        </p>
      </div>

      {/* GUEST MENU */}

      <div className="p-2">

        <Link
          to="/trackorder"
          className="
            group/item flex items-center gap-3
            rounded-xl px-3 py-3
            transition-colors
            hover:bg-gray-50
          "
        >
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gray-100">
            <Clock className="h-4 w-4 text-black" />
          </div>

          <div className="flex-1">
            <p className="text-xs font-bold text-black">
              Track Order
            </p>
            <p className="mt-0.5 text-[10px] text-gray-400">
              Check your order status
            </p>
          </div>

          <ChevronRight className="h-4 w-4 text-gray-400 transition-transform group-hover/item:translate-x-0.5" />
        </Link>

        <Link
          to="/wishlist"
          className="
            group/item flex items-center gap-3
            rounded-xl px-3 py-3
            transition-colors
            hover:bg-gray-50
          "
        >
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gray-100">
            <Heart className="h-4 w-4 text-black" />
          </div>

          <div className="flex-1">
            <p className="text-xs font-bold text-black">
              Wishlist
            </p>
            <p className="mt-0.5 text-[10px] text-gray-400">
              Your saved items
            </p>
          </div>

          {wishlist.length > 0 && (
            <span className="mr-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-[#B6FF2E] px-1.5 text-[9px] font-black text-black">
              {wishlist.length}
            </span>
          )}

          <ChevronRight className="h-4 w-4 text-gray-400 transition-transform group-hover/item:translate-x-0.5" />
        </Link>

      </div>

      {/* LOGIN */}

      <div className="border-t border-gray-100 p-3">
        <Link
          to="/login"
          className="
            flex h-12 w-full
            items-center justify-center gap-2
            rounded-xl
            bg-black
            text-[10px]
            font-black
            uppercase
            tracking-[0.2em]
            text-white
            transition-all
            hover:bg-[#B6FF2E]
            hover:text-black
          "
        >
          Sign In / Create Account
          <ChevronRight className="h-4 w-4" />
        </Link>
      </div>

      <div className="pb-3 text-center">
        <p className="text-[8px] font-medium uppercase tracking-[0.28em] text-gray-300">
          Premium Fashion · GARRIB
        </p>
      </div>
    </>
  )}
</div>
          </div>

          {/* CART */}
          <Link
            to="/cart"

            className={`
    relative

    transition-transform
    duration-300

    ${cartAnimate
                ? "animate-cartShake"
                : ""
              }
  `}
          >
            <ShoppingCart className="w-5 h-5" />

            {items.length > 0 && (
              <span
                className={`
    absolute
    -top-2
    -right-2

    bg-black
    text-white

    text-[10px]
    font-bold

    rounded-full

    min-w-[20px]
    h-5

    px-1

    flex items-center justify-center

    transition-all
    duration-500

    ${cartAnimate
                    ? "animate-cartShake"
                    : ""
                  }
  `}
              >
                {items.length}
              </span>
            )}
          </Link>
        </div>
        
      </div>

      {/* GLOBAL MEGA MENU */}
      <div
        onMouseEnter={() =>
          openMenu("men")
        }
        onMouseLeave={closeMenu}
        className={`
          fixed left-0 top-[74px]
          w-screen
          transition-all duration-300 ease-out
          z-[90]
h-fit
          ${activeMenu === "men"
            ? "opacity-100 visible translate-y-0"
            : "opacity-0 invisible -translate-y-2 pointer-events-none"
          }
        `}
      >
        <div
          className="
            bg-gradient-to-b
            from-gray-50 to-gray-100
            border-t border-gray-200
            shadow-2xl
          "
        >
          <div
            className="
              max-w-[100vw]
            
              mx-auto
              px-10 pt-10
            "
          >
            <div className="flex gap-8 px-6" >
              {/* PROMO */}
              <div
                className="
      hidden xl:flex
      relative shrink-0
      w-[300px] h-[38vh]
      overflow-hidden
      rounded-[2rem]
      bg-black
      text-white
      group
      
    "
              >
                {/* Background glow */}
                <div
                  className="
        absolute -top-24 -right-24
        h-64 w-64
        rounded-full
        bg-white/10
        blur-3xl
        transition-transform duration-700
        group-hover:scale-125
      "
                />

                <div
                  className="
        absolute -bottom-24 -left-24
        h-64 w-64
        rounded-full
        bg-white/10
        blur-3xl
        transition-transform duration-700
        group-hover:scale-125
      "
                />

                {/* Content */}
                <div
                  className="
        relative z-10
        flex h-full
        flex-col
        justify-between
        p-8
      "
                >
                  <div>
                    <span
                      className="
            inline-flex
            rounded-full
            border border-white/20
            bg-white/10
            px-3 py-1.5
            text-[10px]
            font-semibold
            uppercase
            tracking-[0.2em]
            backdrop-blur-md
          "
                    >
                      Limited Offer
                    </span>

                    <h3
                      className="
            mt-8
            text-5xl
            font-black
            leading-[0.9]
            tracking-[-0.04em]
          "
                    >
                      20%
                      <br />
                      OFF
                    </h3>

                    <p className="mt-5 max-w-[210px] text-sm leading-relaxed text-white/60">
                      Your first order deserves something special.
                      Enjoy an exclusive discount when you shop with us.
                    </p>
                  </div>

                  <Link
                    to="/app-offer"
                    className="
          flex
          w-full
          items-center
          justify-between
          rounded-full
          bg-white
          px-5 py-3.5
          text-sm
          font-semibold
          text-black
          transition-all duration-300
          hover:scale-[1.03]
          hover:bg-neutral-200
        "
                  >
                    <span>Shop the offer</span>

                    <span
                      className="
            flex h-8 w-8
            items-center justify-center
            rounded-full
            bg-black
            text-white
            transition-transform duration-300
            group-hover:translate-x-1
          "
                    >
                      →
                    </span>
                  </Link>
                </div>
              </div>

              {/* CATEGORIES */}

<div className="relative min-w-0 flex-1">

  {/* CATEGORY SCROLL AREA */}
  <div
    ref={categoryScrollRef}
    className="
      overflow-x-auto
      scrollbar-hide
      pr-2
    "
  >
    <div className="flex min-w-max gap-5 pb-6">
                  {categories.map((category) => (
                    <Link
                      key={category._id}
                      to={`/products?category=${category.slug}`}
                      className="
            group
            relative
            w-[260px]
            shrink-0
            overflow-hidden
            rounded-[2rem]
            bg-neutral-100
            shadow-sm
            transition-all
            duration-500
            hover:-translate-y-1
            hover:shadow-2xl
          "
                    >
                      {/* IMAGE */}
                      <div className="relative h-[350px] overflow-hidden">
                        <img
                          src={
                            category.photo ||
                            `https://via.placeholder.com/300x400?text=${encodeURIComponent(
                              category.name
                            )}`
                          }
                          alt={category.name}
                          loading="lazy"
                          className="
                h-full
                w-full
                object-cover
                transition-transform
                duration-700
                ease-out
                group-hover:scale-105
              "
                        />

                        {/* Overlay */}
                        <div
                          className="
                absolute inset-0
                bg-gradient-to-t
                from-black/80
                via-black/10
                to-transparent
              "
                        />

                        {/* Top label */}
                        <div className="absolute left-5 top-5">
                          <span
                            className="
                  rounded-full
                  border border-white/30
                  bg-black/20
                  px-3 py-1.5
                  text-[10px]
                  font-semibold
                  uppercase
                  tracking-[0.2em]
                  text-white
                  backdrop-blur-md
                "
                          >
                            Collection
                          </span>
                        </div>

                        {/* Bottom content */}
                        <div className="absolute bottom-0 left-0 right-0 p-5">
                          <div className="flex items-end justify-between gap-4">
                            <div className="min-w-0">
                              <p className="mb-1 text-[10px] uppercase tracking-[0.25em] text-white/60">
                                Explore
                              </p>

                              <h4 className="truncate text-2xl font-bold tracking-tight text-white">
                                {category.name}
                              </h4>
                            </div>

                            <div
                              className="
                    flex h-11 w-11
                    shrink-0
                    items-center justify-center
                    rounded-full
                    bg-white
                    text-lg
                    text-black
                    transition-all
                    duration-300
                    group-hover:translate-x-1
                    group-hover:scale-105
                  "
                            >
                              →
                            </div>
                          </div>
                        </div>
                      </div>
                    </Link>
                       ))}
                </div>
              </div>

      {/* LEFT SCROLL FADE */}
{categoryScrollState.left && (
  <button
    type="button"
    onClick={() => {
      categoryScrollRef.current?.scrollBy({
        left: -285,
        behavior: "smooth",
      });
    }}
    className="
      absolute
      left-0
      top-0
      z-30
      flex
      h-[350px]
      w-[72px]
      items-center
      justify-center
      bg-gradient-to-r
      from-white
      via-white/90
      to-white/0
      text-black
      transition-all
      duration-300
      hover:w-[84px]
    "
    aria-label="Previous categories"
  >
    <span
      className="
        flex
        h-12
        w-12
        items-center
        justify-center
        rounded-full
        bg-white/80
        shadow-[0_8px_30px_rgba(0,0,0,0.12)]
        backdrop-blur-md
        transition-all
        duration-300
        hover:scale-110
        hover:bg-black
        hover:text-white
        active:scale-95
      "
    >
      <ChevronLeft
        className="h-5 w-5"
        strokeWidth={2}
      />
    </span>
  </button>
)}


{/* RIGHT SCROLL FADE */}
{categoryScrollState.right && (
  <button
    type="button"
    onClick={() => {
      categoryScrollRef.current?.scrollBy({
        left: 285,
        behavior: "smooth",
      });
    }}
    className="
      absolute
      right-0
      top-0
      z-30
      flex
      h-[350px]
      w-[72px]
      items-center
      justify-center
      bg-gradient-to-l
      from-white
      via-white/90
      to-white/0
      text-black
      transition-all
      duration-300
      hover:w-[84px]
    "
    aria-label="Next categories"
  >
    <span
      className="
        flex
        h-12
        w-12
        items-center
        justify-center
        rounded-full
        bg-white/80
        shadow-[0_8px_30px_rgba(0,0,0,0.12)]
        backdrop-blur-md
        transition-all
        duration-300
        hover:scale-110
        hover:bg-black
        hover:text-white
        active:scale-95
      "
    >
      <ChevronRight
        className="h-5 w-5"
        strokeWidth={2}
      />
    </span>
  </button>
)}

            </div>
          </div>
        </div>
      </div>
</div>

      {/* Mobile Menu */}
      <div
        className={`fixed inset-0 z-50 xl:hidden transition-all duration-300 ${mobileOpen ? "visible" : "invisible"
          }`}
      >
        {/* Backdrop */}
        <div
          onClick={() => setMobileOpen(false)}
          className={`absolute inset-0 bg-black/40 transition-opacity duration-300 ${mobileOpen ? "opacity-100" : "opacity-0"
            }`}
        />

        {/* Drawer */}
        <div
          className={`absolute left-0 top-0 h-[100vh]    w-[86vw]
    max-w-[420px] bg-white shadow-2xl flex flex-col
transform transition-transform  duration-500 
ease-\[cubic-bezier\(.76\,0\,.24\,1\)\]
${mobileOpen ? "translate-x-0" : "-translate-x-full"}`}
        >
          {/* Header row */}
          <div className="flex items-center justify-between mb-6 px-4 pt-5 pb-3 border-b border-gray-200">
            <Link
              to="/"
              className="text-lg font-semibold tracking-[0.25em] uppercase"
              onClick={() => setMobileOpen(false)}
            >
              GARRIB
            </Link>
            <button
              onClick={() => setMobileOpen(false)}
              className="p-1.5 rounded-full border border-gray-200 hover:bg-gray-100 active:scale-95 transition"
            >
              <span className="block text-sm font-semibold">×</span>
            </button>
          </div>

          {/* Scrollable content */}
          <div className="flex-1 overflow-y-auto px-4 pb-6">
            {/* Main nav */}
            <nav>
              <ul className="space-y-2">
                {navItems.map((item) => (
                  <li key={item.title}>
                    <Link
                      to={item.url || "#"}
                      onClick={() => setMobileOpen(false)}
                      className="block px-2 py-2.5 rounded-lg text-sm font-semibold tracking-wide uppercase
                      hover:bg-black hover:text-white transition-colors"
                    >
                      {item.title}
                    </Link>
                  </li>
                ))}

                <li className="pt-2">
                  <Link
                    to="/wishlist"
                    onClick={() => setMobileOpen(false)}
                    className="flex items-center justify-between px-2 py-2.5 rounded-lg text-sm font-semibold tracking-wide uppercase hover:bg-black hover:text-white transition-colors"
                  >
                    Wishlist

                    {wishlist.length > 0 && (
                      <span className="bg-green-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                        {wishlist.length}
                      </span>
                    )}
                  </Link>
                </li>
              </ul>
            </nav>

            {/* Divider */}
            <div className="my-5 h-px bg-gray-200" />

            {/* Account section (optional, assumes `user` & `logout` exist in Header) */}
            <div className="space-y-2">
              {user ? (
                <>
                  <p className="px-2 text-xs uppercase tracking-[0.2em] text-gray-400">
                    Account
                  </p>
                  <Link
                    to="/profile"
                    onClick={() => setMobileOpen(false)}
                    className="block px-2 py-2.5 rounded-lg text-sm font-medium hover:bg-gray-100"
                  >
                    My Profile
                  </Link>
                  <Link
                    to="/trackorder"
                    onClick={() => setMobileOpen(false)}
                    className="block px-2 py-2.5 rounded-lg text-sm font-medium hover:bg-gray-100"
                  >
                    Track Order
                  </Link>
                  <button
                    onClick={() => {
                      logout();
                      setMobileOpen(false);
                    }}
                    className="w-full text-left px-2 py-2.5 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50"
                  >
                    Logout
                  </button>
                </>
              ) : (
                <>
                  <p className="px-2 text-xs uppercase tracking-[0.2em] text-gray-400">
                    Account
                  </p>
                  <Link
                    to="/login"
                    onClick={() => setMobileOpen(false)}
                    className="block px-2 py-2.5 rounded-lg text-sm font-medium hover:bg-gray-100"
                  >
                    Log In
                  </Link>
                  <Link
                    to="/register"
                    onClick={() => setMobileOpen(false)}
                    className="block px-2 py-2.5 rounded-lg text-sm font-medium hover:bg-gray-100"
                  >
                    Sign Up
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </div>





      {/* Search Overlay */}

      <div
        className={`
    absolute
    left-0
    top-[74px]

    w-full

    bg-white

    border-t border-gray-200
    border-b border-gray-200

    z-[999]
h-[100vh]
   overflow-hidden
max-h-[100vh]

    transition-all duration-500 ease-out

    ${searchOpen
            ? "max-h-[1000px] opacity-100"
            : "max-h-0 opacity-0 pointer-events-none"
          }
  `}
        data-lenis-prevent
      >

        {/* SEARCH BAR */}
        <div
          className="
      h-[86px]

      px-6
      md:px-10

      flex items-center

      border-b border-gray-100
    "
        >

          <div
            className="
        flex items-center
        gap-4

        w-full
      "
          >

            <Search
              className="
    w-5 h-5
    text-gray-400
  "
            />

            <input
              type="text"

              value={query}

              onChange={(e) =>
                setQuery(e.target.value)
              }

              placeholder="Search for a Product, Category..."

              autoFocus

              className="
    flex-1

    h-full

    text-[12px]
    md:text-[15px]

    font-light
bg-transparent  focus:border-transparent focus:outline-none 
    placeholder:text-gray-400
  "
            />

            {/* RESET BUTTON */}
            {query.length > 0 && (

              <button
                onClick={() => {
                  setQuery("");
                  setResults([]);
                }}

                className="
    p-3

      flex items-center
      justify-center

      rounded-lg

      hover:bg-gray-100

      transition
    "
              >
                Reset
              </button>

            )}

            {/* CLOSE SEARCH */}
            <button
              onClick={() =>
                setSearchOpen(false)
              }

              className="
    flex items-center justify-center

    w-10 h-10

    hover:rotate-90

    transition-transform duration-300
  "
            >
              <X className="w-7 h-7" />
            </button>

          </div>

        </div>



        {/* RESULTS */}
        {results.length > 0 && (

          <div
            className="
      px-6
      md:px-10
      py-10

      overflow-y-auto

      max-h-[calc(100vh-70px)]

      search-scroll
    "
          >

            {/* TITLE */}
            <div
              className="
          flex items-center
          justify-between

          mb-8
        "
            >

              <h3
                className="
            text-2xl
            md:text-3xl

            font-bold
            tracking-tight
          "
              >
                Products
              </h3>

              <Link
                to={`/search?q=${encodeURIComponent(query)}`}

                onClick={() =>
                  setSearchOpen(false)
                }

                className="
            text-sm
            font-medium

            hover:underline
          "
              >
                View all
              </Link>

            </div>

            {/* GRID */}
            <div
              className="
          grid
pb-32
          grid-cols-2
          md:grid-cols-3
          lg:grid-cols-5

          gap-6
        "
            >

              {results.map((p) => {
                const inventory = p.inventory || {};

                const stockEntries = Object.entries(
                  inventory.stock || inventory
                );

                const totalStock = stockEntries.reduce(
                  (total, [, qty]) =>
                    total + Math.max(0, Number(qty) || 0),
                  0
                );

                const isTracked = true;

                const reserved = Number(
                  inventory.reserved || 0
                );

                const availableStock = Math.max(
                  0,
                  totalStock - reserved
                );

                const isOutOfStock =
                  isTracked &&
                  availableStock <= 0;

                const isLowStock =
                  isTracked &&
                  availableStock > 0 &&
                  availableStock <= 3;

                const salePrice = Number(p.price) || 0;

                const originalPrice = p.onSale
                  ? Math.round(salePrice / 0.7)
                  : null;

                return (
                  <Link
                    key={p.publicId}
                    to={`/product/${p.publicId}`}
                    onClick={() => setSearchOpen(false)}
                    className="group relative flex flex-col"
                  >
                    {/* IMAGE */}
                    <div
                      className={`
          relative
          aspect-[3/4]
          overflow-hidden
          rounded-[3px]
          bg-neutral-100
        `}
                    >
                      <img
                        src={
                          p.images?.[0] ||
                          p.mainImage ||
                          "/placeholder.png"
                        }
                        alt={p.title || "Product"}
                        loading="lazy"
                        className={`
            h-full
            w-full
            object-cover
            transition-transform
            duration-700
            ease-out
            group-hover:scale-[1.04]
            ${isOutOfStock
                            ? "opacity-60 grayscale-[20%]"
                            : ""
                          }
          `}
                        onError={(e) => {
                          e.currentTarget.src =
                            "/placeholder.png";
                        }}
                      />

                      {/* SALE */}
                      {p.onSale && !isOutOfStock && (
                        <span
                          className="
              absolute
              left-3
              top-3
              rounded-full
              bg-black
              px-3
              py-1.5
              text-[9px]
              font-bold
              uppercase
              tracking-[0.18em]
              text-white
            "
                        >
                          Sale
                        </span>
                      )}

                      {/* OUT OF STOCK */}
                      {isOutOfStock && (
                        <div
                          className="
              absolute
              inset-x-0
              bottom-0
              bg-black/85
              px-3
              py-3
              text-center
              backdrop-blur-sm
            "
                        >
                          <span
                            className="
                text-[9px]
                font-bold
                uppercase
                tracking-[0.2em]
                text-white
              "
                          >
                            Out of stock
                          </span>
                        </div>
                      )}

                      {/* LOW STOCK */}
                      {/* {!isOutOfStock &&
          isLowStock && (
            <span
              className="
                absolute
                bottom-3
                left-3
                rounded-full
                bg-white/95
                px-3
                py-1.5
                text-[9px]
                font-bold
                uppercase
                tracking-[0.15em]
                text-black
                shadow-sm
                backdrop-blur-md
              "
            >
              Only {availableStock} left
            </span>
          )} */}

                      {/* QUICK VIEW */}
                      {!isOutOfStock && (
                        <div
                          className="
              absolute
              bottom-4
              left-1/2
              -translate-x-1/2
              translate-y-3
              opacity-0
              transition-all
              duration-500
              group-hover:translate-y-0
              group-hover:opacity-100
            "
                        >
                          <button
                            type="button"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              setQuickViewProduct(p);
                            }}
                            className="
    whitespace-nowrap
    bg-white/95
    backdrop-blur-md
    text-[11px]
    font-semibold
    tracking-[0.18em]
    uppercase
    px-5
    py-3
    rounded-full
    shadow-lg
    hover:bg-black
    hover:text-white
    transition
  "
                          >
                            Quick View
                          </button>
                        </div>
                      )}
                    </div>

                    {/* INFO */}
                    <div className="mt-4 space-y-1.5">
                      {/* TITLE */}
                      <h4
                        className="
            line-clamp-1
            text-[14px]
            font-medium
            tracking-tight
            text-black/90
            transition-colors
            duration-300
            group-hover:text-black
          "
                      >
                        {p.title}
                      </h4>

                      {/* CATEGORY */}
                      {p.category?.name && (
                        <p
                          className="
              text-[9px]
              font-semibold
              uppercase
              tracking-[0.2em]
              text-neutral-400
            "
                        >
                          {p.category.name}
                        </p>
                      )}

                      {/* PRICE */}
                      <div className="flex items-center gap-2 pt-1">
                        <span
                          className="
              text-[14px]
              font-bold
              tracking-tight
              text-black
            "
                        >
                          ₹{" "}
                          {salePrice.toLocaleString("en-IN")}
                        </span>

                        {p.onSale &&
                          originalPrice && (
                            <span
                              className="
                  text-[11px]
                  text-neutral-400
                  line-through
                "
                            >
                              ₹{" "}
                              {originalPrice.toLocaleString(
                                "en-IN"
                              )}
                            </span>
                          )}

                        {p.onSale && (
                          <span
                            className="
                text-[9px]
                font-bold
                uppercase
                tracking-wider
                text-red-500
              "
                          >
                            30% off
                          </span>
                        )}
                      </div>

                      {/* INVENTORY */}
                      {!isOutOfStock &&
                        isTracked && (
                          <div className="flex items-center gap-2 pt-1">
                            <span
                              className={`
                  h-1.5
                  w-1.5
                  rounded-full
                  ${isLowStock
                                  ? "bg-red-500"
                                  : "bg-black"
                                }
                `}
                            />

                            <span
                              className={`
                  text-[9px]
                  font-semibold
                  uppercase
                  tracking-[0.16em]
                  ${isLowStock
                                  ? "text-red-500"
                                  : "text-neutral-400"
                                }
                `}
                            >
                              {isLowStock
                                ? `Only ${availableStock} available`
                                : "In stock"}
                            </span>
                          </div>
                        )}

                      {!isTracked && (
                        <div className="flex items-center gap-2 pt-1">
                          <span className="h-1.5 w-1.5 rounded-full bg-black" />

                          <span
                            className="
                text-[9px]
                font-semibold
                uppercase
                tracking-[0.16em]
                text-neutral-400
              "
                          >
                            Available
                          </span>
                        </div>
                      )}
                    </div>
                  </Link>
                );
              })}

            </div>

          </div>

        )}
        {quickViewProduct && (
          <QuickViewModal
            product={quickViewProduct}
            onClose={() =>
              setQuickViewProduct(null)
            }
          />
        )}

      </div>

    </header>
  );
}


