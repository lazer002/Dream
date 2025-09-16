import { Link } from 'react-router-dom'

export default function AdminDashboard() {
  return (
    <div>
      <h1 className="text-2xl font-semibold mb-6">Admin</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Link to="/admin/products" className="border rounded-lg p-6 hover:shadow">
          <div className="font-medium">Manage products</div>
          <div className="text-sm text-gray-600">Create, update, and delete products</div>
        </Link>
        <Link to="/admin/users" className="border rounded-lg p-6 hover:shadow">
          <div className="font-medium">Manage users</div>
          <div className="text-sm text-gray-600">Promote to admin, remove users</div>
        </Link>
      </div>
    </div>
  )
}


