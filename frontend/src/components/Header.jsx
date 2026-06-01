"use client";
// data-lenis-prevent
import { useEffect, useRef, useState } from "react";
import {
  Menu,
  Search,
  ShoppingCart,
  User,
  X,
} from "lucide-react";
import {
  Link,
  useLocation,
} from "react-router-dom";

import api from "@/utils/config";

import { useCart } from "../state/CartContext.jsx";
import { useAuth } from "../state/AuthContext.jsx";
import { useWishlist } from "../state/WishlistContext.jsx";

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

export default function Header() {
  const location = useLocation();
  const { user, logout } = useAuth();
  const { items } = useCart();
  const { wishlist } = useWishlist();
const [cartAnimate, setCartAnimate] =
  useState(false);
  const [mobileOpen, setMobileOpen] =
    useState(false);

  const [searchOpen, setSearchOpen] =
    useState(false);

  const [query, setQuery] = useState("");

  const [results, setResults] = useState([]);

  const [loading, setLoading] =
    useState(false);

  const [categories, setCategories] =
    useState([]);

  const [activeMenu, setActiveMenu] =
    useState(null);

  const closeTimeoutRef = useRef(null);

  const baseClass = `
    text-[13px]
    font-bold
    tracking-[0.18em]
    uppercase
  `;

  // =========================
  // MENU INTERACTION
  // =========================

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

  // =========================
  // FETCH CATEGORIES
  // =========================

  const fetchCategories = async () => {
    try {
      const res = await api.get(
        "/categories"
      );

      setCategories(
        Array.isArray(
          res.data.categories
        )
          ? res.data.categories
          : []
      );
    } catch (error) {
      console.error(error);
    }
  };
useEffect(() => {
  setActiveMenu(null);
}, [location.pathname, location.search]);

  useEffect(() => {
    fetchCategories();

    return () => {
      if (closeTimeoutRef.current) {
        clearTimeout(
          closeTimeoutRef.current
        );
      }
    };
  }, []);

  // =========================
  // SEARCH
  // =========================

useEffect(() => {

  const trimmedQuery = query.trim();

  if (trimmedQuery.length < 2) {
    setResults([]);
    setLoading(false);
    return;
  }

  const controller = new AbortController();

  const debounce = setTimeout(async () => {

    try {

      setLoading(true);

      const res = await api.get(
        `/search/products?q=${encodeURIComponent(trimmedQuery)}`,
        {
          signal: controller.signal,
        }
      );

      setResults(res.data || []);

    } catch (error) {

      if (
        error.name !== "CanceledError" &&
        error.name !== "AbortError"
      ) {
        console.error(error);
      }

    } finally {

      setLoading(false);

    }

  }, 500);

  return () => {

    controller.abort();

    clearTimeout(debounce);

  };

}, [query]);



useEffect(() => {

  if (items.length > 0) {

    setCartAnimate(true);

    const timer = setTimeout(() => {
      setCartAnimate(false);
    }, 600);

    return () => clearTimeout(timer);

  }

}, [items.length]);

  return (
    <header
      className="
        sticky top-0 z-[10000]
        bg-white/95 backdrop-blur-xl
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

            ${
              active
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
                <span
                  className="
                    absolute top-1 right-1
                    w-2 h-2 rounded-full
                    bg-green-500
                  "
                />
              )}
            </button>

            <div
              className="
                absolute right-0 mt-2
                w-52
                bg-white
                border border-gray-100
                rounded-2xl
                shadow-xl

                opacity-0 invisible
                group-hover:opacity-100
                group-hover:visible

                transition-all duration-200
              "
            >
              {user ? (
                <>
                  <Link
                    to="/profile"
                    className="block px-4 py-3 text-sm hover:bg-gray-50 rounded-t-2xl"
                  >
                    My Profile
                  </Link>

                  <Link
                    to="/trackorder"
                    className="block px-4 py-3 text-sm hover:bg-gray-50"
                  >
                    Track Order
                  </Link>

                  <button
                    onClick={logout}
                    className="block w-full text-left px-4 py-3 text-sm hover:bg-gray-50 rounded-b-2xl"
                  >
                    Logout
                  </button>
                </>
              ) : (
                <>
            
     <Link
                    to="/trackorder"
                    className="block px-4 py-3 text-sm hover:bg-gray-50"
                  >
                    Track Order
                  </Link>
                  <Link
                    to="/wishlist"
                    className="flex items-center justify-between px-4 py-3 text-sm hover:bg-gray-50"
                  >
                    Wishlist

                    {wishlist.length > 0 && (
                      <span
                        className="
                          bg-green-500 text-white
                          text-xs rounded-full
                          w-5 h-5
                          flex items-center justify-center
                        "
                      >
                        {wishlist.length}
                      </span>
                    )}
                  </Link>
                        <Link
                    to="/login"
                    className="block px-4 py-3 text-sm hover:bg-gray-50 rounded-t-2xl"
                  >
                    Login
                  </Link>
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

    ${
      cartAnimate
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

    ${
      cartAnimate
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

          ${
            activeMenu === "men"
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
            <div className="flex gap-8 justify-center ">
              {/* PROMO */}
             <div
className="
  hidden xl:flex
  relative overflow-hidden

  flex-col justify-center items-center

  bg-white
  rounded-3xl

  px-8

  w-72 h-[36vh]

  border border-gray-200
  shadow-sm

  transition-all duration-500
  hover:shadow-xl
  hover:-translate-y-1

  group

  animate-[promoFloat_6s_ease-in-out_infinite]
"
>

  {/* SUBTLE SPLASH GLOW */}
  <div
    className="
      absolute inset-0
      opacity-0
      group-hover:opacity-100
      transition-opacity duration-700
      pointer-events-none
    "
  >
    <div
      className="
        absolute
        -top-10 -left-10

        w-40 h-40
        rounded-full

        bg-gray-200/40
        blur-3xl

        animate-pulse
      "
    />

    <div
      className="
        absolute
        bottom-0 right-0

        w-32 h-32
        rounded-full

        bg-gray-300/30
        blur-3xl
      "
    />
  </div>

  {/* CONTENT */}
  <div className="relative z-10 flex flex-col items-center">

    <h3
      className="
        text-3xl
        font-black
        mb-3
        tracking-tight

        transition-transform duration-500
        group-hover:scale-[1.03]
      "
    >
      🎉 20% OFF
    </h3>

    <p
      className="
        text-sm text-gray-500
        text-center mb-6
        leading-relaxed
      "
    >
      Get 20% off your first
      purchase in our app.
    </p>

    <Link
      to="/app-offer"
      className="
        relative overflow-hidden

        bg-black text-white
        rounded-full

        px-6 py-3
        text-sm font-semibold

        transition-all duration-300

        hover:bg-gray-800
        hover:scale-[1.04]
      "
    >
      <span className="relative z-10">
        Shop Now
      </span>

      {/* BUTTON SHINE */}
      <span
        className="
          absolute inset-0
          -translate-x-full
          group-hover:translate-x-full

          bg-gradient-to-r
          from-transparent
          via-white/20
          to-transparent

          transition-transform duration-1000
        "
      />
    </Link>

  </div>
</div>

              {/* CATEGORIES */}
              <div className="flex-1 overflow-x-auto justify-between">
                <div
                  className="
                    flex gap-6
                    min-w-max
                    pb-10
                    px-6
                    
                  "
                >
                  {categories.map(
                    (category) => (
                      <Link
                        key={category._id}
                        to={`/products?category=${category.slug}`}
                        className="
                          w-64 flex-shrink-0
                          bg-white
                          rounded-3xl
                          overflow-hidden
                          border border-gray-100
                          shadow-sm
                          hover:shadow-2xl
                          transition-all duration-500
                          group
                        "
                      >
                        {/* IMAGE */}
                        <div
                          className="
                            h-[26vh]
                            overflow-hidden
                            bg-gray-100
                          "
                        >
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
                              w-full h-full
                              object-cover
                              transition-transform duration-700
                              group-hover:scale-110
                            "
                          />
                        </div>

                        {/* CONTENT */}
                        <div className="p-5">
                          <div
                            className="
                              flex items-center
                              justify-between
                            "
                          >
                            <div>
                              <p
                                className="
                                  text-xs uppercase
                                  tracking-[0.25em]
                                  text-gray-400
                                  mb-1
                                "
                              >
                                Category
                              </p>

                              <h4
                                className="
                                  text-lg font-bold
                                  tracking-tight
                                "
                              >
                                {category.name}
                              </h4>
                            </div>

                            <div
                              className="
                                w-10 h-10
                                rounded-full
                                bg-black text-white
                                flex items-center justify-center
                                text-lg
                                transition-transform duration-300
                                group-hover:translate-x-1
                              "
                            >
                              →
                            </div>
                          </div>
                        </div>
                      </Link>
                    )
                  )}
                </div>
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

   overflow-hidden
max-h-[100vh]

    transition-all duration-500 ease-out

    ${
      searchOpen
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

    bg-transparent

    outline-none

    text-[16px]
    md:text-[18px]

    font-light

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

      max-h-[calc(100vh-160px)]

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

          grid-cols-2
          md:grid-cols-3
          lg:grid-cols-5

          gap-6
        "
      >

        {results.map((p) => (

         <Link
  key={p._id}

  to={`/product/${p._id}`}

  onClick={() =>
    setSearchOpen(false)
  }

  className="
    group

    relative

    flex
    flex-col
  "
>

  {/* IMAGE */}
  <div
    className="
      relative

      aspect-[3/4]

      bg-[#f5f5f5]

      overflow-hidden

      rounded-[2px]

      mb-4
    "
  >

    {/* IMAGE */}
    <img
      src={
        p.images?.[0]
        || "/placeholder.png"
      }

      alt={p.title}

      className="
        w-full
        h-full

        object-cover

        transition-transform
        duration-700
        ease-out

        group-hover:scale-[1.04]
      "
    />

    {/* QUICK VIEW */}
    <div
      className="
        absolute
        left-1/2
        bottom-4

        -translate-x-1/2
        translate-y-3

        opacity-0

        group-hover:opacity-100
        group-hover:translate-y-0

        transition-all
        duration-500
      "
    >

      <button
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

    {/* SALE BADGE */}
    {p.onSale && (

      <div
        className="
          absolute
          top-3
          left-3

          bg-red-500
          text-white

          text-[10px]
          font-bold

          tracking-[0.18em]

          px-3
          py-1.5

          rounded-full
        "
      >
        SALE
      </div>

    )}

  </div>

  {/* INFO */}
  <div className="space-y-1">

    {/* TITLE */}
    <h4
      className="
        text-[14px]
        md:text-[15px]

        font-medium

        tracking-tight

        text-black/90

        line-clamp-1

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
          text-[11px]

          uppercase

          tracking-[0.18em]

          text-gray-400
        "
      >
        {p.category.name}
      </p>

    )}

    {/* PRICE */}
    <div
      className="
        flex items-center
        gap-2

        pt-1
      "
    >

      {p.onSale && (

        <span
          className="
        text-xs text-gray-500 line-through
          "
        >
          ₹ 
          {Math.round(
            Number(p.price) / 0.7
          ).toLocaleString()}
        </span>

      )}
      <span
        className="
     text-md font-bold text-red-600
        "
      >
        ₹ {Number(p.price).toLocaleString()}
      </span>


    </div>

    {/* STOCK */}
    {Object.values(
      p.inventory || {}
    ).every(qty => qty === 0) && (

      <p
        className="
          text-[12px]

          text-red-500

          font-medium

          pt-1
        "
      >
        Out of stock
      </p>

    )}

  </div>

</Link>
        ))}

      </div>

    </div>

  )}

</div>

    </header>
  );
}


