import { Link } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { useAuth } from '../../state/AuthContext.jsx'

export default function AdminDashboard() {
  const { api } = useAuth()
  const [stats, setStats] = useState({ users: 0, products: 0, orders: 0, revenue: 0, lastOrders: [] })
  useEffect(() => {
    api.get('/admin/stats').then(({ data }) => setStats(data)).catch(() => {})
  }, [])

  const Card = ({ title, value }) => (
    <div className="border rounded-lg p-6">
      <div className="text-sm text-gray-600">{title}</div>
      <div className="text-2xl font-semibold">{value}</div>
    </div>
  )

  return (
    <div>
      <h1 className="text-2xl font-semibold mb-6">Dashboard</h1>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <Card title="Users" value={stats.users} />
        <Card title="Products" value={stats.products} />
        <Card title="Orders" value={stats.orders} />
        <Card title="Revenue" value={`$${stats.revenue.toFixed(2)}`} />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="border rounded-lg p-4">
          <div className="font-medium mb-3">Quick links</div>
          <div className="grid grid-cols-2 gap-3">
            <Link to="/admin/products" className="rounded-md border p-3 hover:bg-gray-50">Manage products</Link>
            <Link to="/admin/products/new" className="rounded-md border p-3 hover:bg-gray-50">Add product</Link>
            <Link to="/admin/users" className="rounded-md border p-3 hover:bg-gray-50">Manage users</Link>
          </div>
        </div>
        <div className="border rounded-lg p-4">
          <div className="font-medium mb-3">Recent orders</div>
          <div className="divide-y">
            {stats.lastOrders.map(o => (
              <div key={o._id} className="py-2 text-sm flex items-center justify-between">
                <div>
                  <div className="font-medium">{o.items?.[0]?.title || 'Order'}</div>
                  <div className="text-gray-600">{new Date(o.createdAt).toLocaleString()}</div>
                </div>
                <div className="font-semibold">${o.subtotal?.toFixed(2)}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}


