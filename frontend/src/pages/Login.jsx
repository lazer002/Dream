import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../state/AuthContext.jsx'

export default function Login() {
  const { login } = useAuth()
  const nav = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')

  const onSubmit = async (e) => {
    e.preventDefault()
    try {
      await login(email, password)
      nav('/')
    } catch (e) {
      setError('Invalid credentials')
    }
  }

  return (
    <div className="max-w-md mx-auto">
      <h1 className="text-2xl font-semibold mb-6">Sign in</h1>
      <form onSubmit={onSubmit} className="space-y-4">
        {error && <div className="text-red-600 text-sm">{error}</div>}
        <div>
          <label className="block text-sm mb-1">Email</label>
          <input className="w-full rounded-md" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </div>
        <div>
          <label className="block text-sm mb-1">Password</label>
          <input className="w-full rounded-md" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
        </div>
        <button className="w-full px-4 py-2 bg-brand-600 text-white rounded-md">Sign in</button>
        <div className="text-sm text-gray-600">No account? <Link to="/register" className="text-brand-600">Sign up</Link></div>
      </form>
    </div>
  )
}


