import { Link, NavLink, Outlet } from 'react-router-dom'

export default function AdminLayout() {
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
    <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
      <aside className="md:col-span-3 lg:col-span-2">
        <div className="sticky top-6 border rounded-xl p-4">
          <div className="mb-3 font-semibold">Admin</div>
          <div className="space-y-1">
            {navItem({ to: '/admin', label: 'Dashboard' })}
            {navItem({ to: '/admin/products', label: 'Products' })}
            {navItem({ to: '/admin/products/new', label: 'Add Product' })}
            {navItem({ to: '/admin/users', label: 'Users' })}
          </div>
          <div className="mt-4 text-xs text-gray-500">
            <Link to="/">← Back to store</Link>
          </div>
        </div>
      </aside>
      <section className="md:col-span-9 lg:col-span-10">
        <Outlet />
      </section>
    </div>
  )
}


