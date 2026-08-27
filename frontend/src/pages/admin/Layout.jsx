// src/pages/admin/Layout.jsx

import { NavLink, Outlet, useLocation } from "react-router-dom";
import { useMemo, useState } from "react";
import {
  Menu,
  LogOut,
  Search,
  Bell,
  LayoutGrid,
  Package,
  PlusSquare,
  Users,
  Tag,
  RefreshCw,
} from "lucide-react";

export default function AdminLayout() {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();

  const sidebarItems = useMemo(
    () => [
      {
        name: "Dashboard",
        href: "/admin",
        icon: LayoutGrid,
      },
      {
        name: "Orders",
        href: "/admin/orders",
        icon: Package,
      },
      {
        name: "Products",
        href: "/admin/products",
        icon: Package,
      },
      {
        name: "Inventory",
        href: "/admin/inventory",
        icon: Package,
      },
      {
        name: "Add Product",
        href: "/admin/new/products",
        icon: PlusSquare,
      },
      {
        name: "Add Bundles",
        href: "/admin/new/bundles",
        icon: Package,
      },
      {
        name: "Bundles",
        href: "/admin/bundles",
        icon: Package,
      },
      {
        name: "Users",
        href: "/admin/users",
        icon: Users,
      },
      {
        name: "Category",
        href: "/admin/category",
        icon: Tag,
      },
      {
        name: "Returns",
        href: "/admin/returnslist",
        icon: RefreshCw,
      },
    ],
    []
  );

  const isActive = (href) =>
    location.pathname === href ||
    (href !== "/admin" &&
      location.pathname.startsWith(`${href}/`));

  return (
    <div className="flex h-screen w-full overflow-hidden bg-gray-50">
      {/* =========================
          SIDEBAR
      ========================= */}
      <aside
        className={`
          flex-shrink-0
          h-full
          bg-black
          text-white
          flex
          flex-col
          transition-all
          duration-300
          ${collapsed ? "w-20" : "w-64"}
        `}
      >
        {/* Logo */}
        <div
          className={`
            h-16
            flex
            items-center
            border-b
            border-gray-800
            ${collapsed ? "justify-center" : "justify-between px-4"}
          `}
        >
          {!collapsed && (
            <span className="text-lg font-bold tracking-tight">
              Admin Panel
            </span>
          )}

          <button
            type="button"
            onClick={() =>
              setCollapsed((value) => !value)
            }
            className="
              h-9
              w-9
              rounded-lg
              flex
              items-center
              justify-center
              text-gray-300
              hover:bg-gray-900
              hover:text-white
              transition
            "
          >
            <Menu className="h-5 w-5" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 min-h-0 overflow-y-auto px-3 py-4">
          <ul className="space-y-1">
            {sidebarItems.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.href);

              return (
                <li key={item.name}>
                  <NavLink
                    to={item.href}
                    title={
                      collapsed
                        ? item.name
                        : undefined
                    }
                    className={`
                      group
                      flex
                      items-center
                      ${collapsed
                        ? "justify-center"
                        : "gap-3"
                      }
                      min-h-10
                      px-3
                      rounded-lg
                      transition-all
                      ${
                        active
                          ? "bg-white text-black"
                          : "text-gray-400 hover:bg-gray-900 hover:text-white"
                      }
                    `}
                  >
                    <Icon
                      className={`
                        h-5
                        w-5
                        flex-shrink-0
                        ${
                          active
                            ? "text-black"
                            : "text-gray-400 group-hover:text-white"
                        }
                      `}
                    />

                    {!collapsed && (
                      <span className="text-sm font-medium">
                        {item.name}
                      </span>
                    )}
                  </NavLink>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Back to Store */}
        <div className="flex-shrink-0 border-t border-gray-800 p-3">
          <NavLink
            to="/"
            title={
              collapsed
                ? "Back to Store"
                : undefined
            }
            className={`
              flex
              items-center
              ${collapsed
                ? "justify-center"
                : "gap-3"
              }
              min-h-10
              px-3
              rounded-lg
              text-gray-400
              hover:bg-gray-900
              hover:text-white
              transition
            `}
          >
            <LogOut className="h-5 w-5 flex-shrink-0" />

            {!collapsed && (
              <span className="text-sm font-medium">
                Back to Store
              </span>
            )}
          </NavLink>
        </div>
      </aside>

      {/* =========================
          RIGHT SIDE
      ========================= */}
      <div className="flex-1 min-w-0 h-full flex flex-col overflow-hidden">
        {/* Header */}
        <header
          className="
            h-16
            flex-shrink-0
            flex
            items-center
            justify-between
            gap-6
            bg-white
            border-b
            border-gray-200
            px-6
          "
        >
          {/* Search */}
          <div className="flex-1 max-w-xl">
            <div
              className="
                h-10
                flex
                items-center
                gap-3
                px-3
                rounded-lg
                bg-gray-50
                border
                border-gray-200
                focus-within:border-gray-400
                transition
              "
            >
              <Search className="h-4 w-4 text-gray-400 flex-shrink-0" />

              <input
                type="search"
                placeholder="Search..."
                className="
                  w-full
                  bg-transparent
                  outline-none
                  border-none
                  text-sm
                  text-gray-800
                  placeholder:text-gray-400
                "
              />
            </div>
          </div>

          {/* Right */}
          <div className="flex items-center gap-5">
            <button
              type="button"
              className="
                relative
                h-9
                w-9
                rounded-lg
                flex
                items-center
                justify-center
                text-gray-500
                hover:bg-gray-100
                hover:text-gray-900
                transition
              "
            >
              <Bell className="h-5 w-5" />

              <span
                className="
                  absolute
                  -top-0.5
                  -right-0.5
                  h-4
                  min-w-4
                  px-1
                  rounded-full
                  bg-red-500
                  text-white
                  text-[10px]
                  font-semibold
                  flex
                  items-center
                  justify-center
                "
              >
                3
              </span>
            </button>

            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-full bg-gray-200" />

              <span className="hidden sm:block text-sm font-medium text-gray-700">
                Admin User
              </span>
            </div>
          </div>
        </header>

        {/* =========================
            PAGE CONTENT
        ========================= */}
        <main
          data-lenis-prevent
          className="
            flex-1
            min-h-0
            overflow-y-auto
            overflow-x-hidden
            bg-gray-50
            p-4
            sm:p-5
            lg:p-6
          "
        >
          <Outlet />
        </main>
      </div>
    </div>
  );
}