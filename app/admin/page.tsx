'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'

export default function AdminLogin() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      })
      const data = await res.json()
      if (data.ok) {
        router.push('/admin/dashboard')
      } else {
        setError(data.error || 'Login gagal')
      }
    } catch {
      setError('Terjadi kesalahan')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="admin-login">
      <form className="glass-card admin-login-card" onSubmit={handleLogin}>
        <Image src="/assets/Screenshot 2026-09-28 234611.png" alt="Logo" width={64} height={64} style={{ margin: '0 auto 16px', display: 'block' }} />
        <h1>Admin Login</h1>
        <p>栞 Shiori — Panel Admin</p>
        {error && <p style={{ color: 'var(--accent-red)', fontSize: 13, marginBottom: 12 }}>{error}</p>}
        <div className="form-group">
          <label>Username</label>
          <input className="input" value={username} onChange={e => setUsername(e.target.value)} placeholder="Username" />
        </div>
        <div className="form-group">
          <label>Password</label>
          <input className="input" type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Password" />
        </div>
        <button className="btn btn-primary" style={{ width: '100%', marginTop: 16 }} disabled={loading}>
          {loading ? 'Masuk...' : 'Masuk'}
        </button>
      </form>
    </div>
  )
}
