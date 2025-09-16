import { Link, NavLink, Outlet, useLocation } from 'react-router-dom'
import { useMemo, useState } from 'react'
import { Menu, LogOut, Search, Bell, LayoutGrid, Package, PlusSquare, Users } from 'lucide-react'

export default function AdminLayout() {
  const [collapsed, setCollapsed] = useState(false)
  const { pathname } = useLocation()
  const sidebarItems = useMemo(() => ([
    { name: 'Dashboard', href: '/admin', icon: LayoutGrid },
    { name: 'Products', href: '/admin/products', icon: Package },
    { name: 'Add Product', href: '/admin/products/new', icon: PlusSquare },
    { name: 'Users', href: '/admin/users', icon: Users }
  ]), [])
  const navItem = ({ to, label }) => (
    <NavLink
      to={to}
      className={({ isActive }) =>
        `block rounded-md px-3 py-2 text-sm ${isActive ? 'bg-gray-900 text-white' : 'text-gray-700 hover:bg-gray-100'}`
      }
    >
      {label}
    </NavLink>
  )

  return (
    <div className="flex h-screen bg-gray-50">
      <aside className={`bg-gray-900 text-gray-100 flex flex-col transition-all duration-300 ${collapsed ? 'w-20' : 'w-64'}`}>
        <div className="flex items-center justify-between p-4 border-b border-gray-800">
          {!collapsed && <span className="font-bold text-xl">Admin Panel</span>}
          <button onClick={() => setCollapsed(!collapsed)} className="text-gray-400 hover:text-white">
            <Menu className="h-6 w-6" />
          </button>
        </div>
        <nav className="flex-1 overflow-y-auto">
          <ul className="space-y-1 p-2">
            {sidebarItems.map((item) => {
              const Icon = item.icon
              const active = pathname === item.href || (item.href !== '/admin' && pathname.startsWith(item.href))
              return (
                <li key={item.name}>
                  <NavLink to={item.href} className={`flex items-center gap-3 px-4 py-2 rounded-lg transition-colors ${active ? 'bg-gray-800 text-white' : 'text-gray-400 hover:bg-gray-800 hover:text-white'}`}>
                    <Icon className="h-5 w-5" />
                    {!collapsed && <span>{item.name}</span>}
                  </NavLink>
                </li>
              )
            })}
          </ul>
        </nav>
        <div className="p-4 border-t border-gray-800">
          <Link to="/" className="flex items-center gap-3 w-full text-gray-400 hover:text-white">
            <LogOut className="h-5 w-5" />
            {!collapsed && <span>Back to store</span>}
          </Link>
        </div>
      </aside>
      <div className="flex-1 flex flex-col">
        <header className="flex items-center justify-between bg-white shadow px-6 py-4">
          <div className="flex items-center gap-3 w-full max-w-xl">
            <Search className="h-5 w-5 text-gray-500" />
            <input type="text" placeholder="Search..." className="flex-1 border-none outline-none bg-transparent text-sm text-gray-700" />
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
        <main className="flex-1 overflow-y-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}


