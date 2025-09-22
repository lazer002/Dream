import { useEffect, useState } from 'react'
import { useAuth } from '../../state/AuthContext.jsx'

export default function Users() {
  const { api } = useAuth()
  const [users, setUsers] = useState([])

  async function load() {
    const { data } = await api.get('/admin')
    setUsers(data.items)
  }
  useEffect(() => { load() }, [])

  async function setRole(id, role) {
    await api.patch(`/admin/${id}`, { role })
    await load()
  }

  async function remove(id) {
    await api.delete(`/admin/${id}`)
    await load()
  }

  return (
    <div>
      <h1 className="text-2xl font-semibold mb-6">Users</h1>
      <div className="border rounded-lg divide-y">
        {users.map(u => (
          <div key={u._id} className="p-4 flex items-center gap-4">
            <div className="flex-1">
              <div className="font-medium">{u.name}</div>
              <div className="text-sm text-gray-600">{u.email}</div>
            </div>
            <select className="rounded-md" value={u.role} onChange={(e) => setRole(u._id, e.target.value)}>
              <option value="user">user</option>
              <option value="admin">admin</option>
            </select>
            <button onClick={() => remove(u._id)} className="text-red-600 text-sm">Delete</button>
          </div>
        ))}
      </div>
    </div>
  )
}


