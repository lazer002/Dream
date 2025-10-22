// src/pages/admin/Layout.jsx
import {  NavLink, Outlet, useLocation } from 'react-router-dom'
import { useMemo, useState } from 'react'
import { Menu, LogOut, Search, Bell, LayoutGrid, Package, PlusSquare, Users, Tag } from 'lucide-react'

export default function AdminLayout() {
  const [collapsed, setCollapsed] = useState(false)
  const location  = useLocation()

  const sidebarItems = useMemo(() => ([
    { name: 'Dashboard', href: '/admin', icon: LayoutGrid },
    { name: 'Products', href: '/admin/products', icon: Package },
    { name: 'Add Product', href: '/admin/products/new', icon: PlusSquare },
    { name: 'Users', href: '/admin/users', icon: Users },
    { name: 'Category', href: '/admin/category', icon: Tag },
  ]), [])

 const isActive = (href) => location.pathname === href;
  return (
    <div className="flex h-screen overflow-hidden">
      {/* Sidebar */}
<aside className={`flex-shrink-0 ${collapsed ? "w-20" : "w-64"} bg-black text-white flex flex-col`}>
  {/* Header */}
  <div className="flex items-center justify-between p-4 border-b border-gray-800">
    {!collapsed && <span className="font-bold text-xl">Admin Panel</span>}
    <button onClick={() => setCollapsed(!collapsed)} className="text-gray-300 hover:text-white">
      <Menu className="h-6 w-6" />
    </button>
  </div>

  {/* Navigation */}
  <nav className="flex-1 overflow-y-auto mt-2 px-3">
    <ul className="space-y-1">
      {sidebarItems.map((item) => {
        const Icon = item.icon;
        const active = isActive(item.href);

        return (
          <li key={item.name}>
            <NavLink
              to={item.href}
              className={`
                group
                flex items-center gap-3 px-4 py-2 rounded-lg transition-colors
                ${active 
                  ? "bg-white text-black shadow-md" 
                  : "text-gray-300 hover:bg-gray-900 hover:text-white"
                }
              `}
            >
              <Icon
                className={`h-5 w-5 transition-colors ${
                  active ? "text-black" : "text-gray-300 group-hover:text-white"
                }`}
              />
              {!collapsed && <span className="font-medium">{item.name}</span>}
            </NavLink>
          </li>
        );
      })}
    </ul>
  </nav>

  {/* Footer */}
  <div className="p-4 border-t border-gray-800">
    <NavLink to="/" className="flex items-center gap-3 text-gray-300 hover:text-white">
      <LogOut className="h-5 w-5" />
      {!collapsed && <span>Back to Store</span>}
    </NavLink>
  </div>
</aside>



      {/* Right content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="sticky top-0 z-10 flex items-center justify-between bg-white shadow px-6 py-4 flex-shrink-0">
          <div className="flex items-center gap-3 w-full max-w-xl bg-gray-100 rounded-lg px-3 py-1">
            <Search className="h-5 w-5 text-gray-500" />
            <input
              type="text"
              placeholder="Search..."
              className="flex-1 border-none outline-none bg-transparent text-sm text-gray-700"
            />
          </div>
          <div className="flex items-center gap-6">
            <button className="relative text-gray-600 hover:text-gray-900">
              <Bell className="h-6 w-6" />
              <span className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full h-4 w-4 flex items-center justify-center text-xs">3</span>
            </button>
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-full bg-gray-300" />
              <span className="text-sm font-medium text-gray-700">Admin User</span>
            </div>
          </div>
        </header>

        {/* Scrollable Outlet */}
        <main className="flex-1 overflow-y-auto p-6 bg-gray-50">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
