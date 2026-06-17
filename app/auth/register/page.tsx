'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function RegisterPage() {
  const [form, setForm] = useState({ full_name: '', email: '', password: '', role: 'contractor' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  function update(k: string, v: string) { setForm(f => ({ ...f, [k]: v })) }

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    const { error } = await supabase.auth.signUp({
      email: form.email,
      password: form.password,
      options: { data: { full_name: form.full_name, role: form.role } }
    })
    if (error) { setError(error.message); setLoading(false); return }
    // Send welcome email notification
    fetch('/api/auth/register-notify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: form.full_name, email: form.email, role: form.role })
    }).catch(() => {})
    router.push('/dashboard')
    router.refresh()
  }

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 bg-blue-600 rounded-xl text-white font-bold text-xl mb-4">IQ</div>
          <h1 className="text-2xl font-bold text-slate-900">Create your account</h1>
          <p className="text-slate-500 mt-1">Join Innovate IQ LLC</p>
        </div>
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8">
          <form onSubmit={handleRegister} className="space-y-4">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm">{error}</div>
            )}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">I am a…</label>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { value: 'contractor', label: 'Contractor', sub: 'Looking for work' },
                  { value: 'client', label: 'Client', sub: 'Hiring talent' },
                ].map(opt => (
                  <button
                    key={opt.value} type="button"
                    onClick={() => update('role', opt.value)}
                    className={`p-3 rounded-lg border text-left transition-all ${
                      form.role === opt.value
                        ? 'border-blue-600 bg-blue-50 ring-1 ring-blue-600'
                        : 'border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div className="text-sm font-medium text-slate-900">{opt.label}</div>
                    <div className="text-xs text-slate-500">{opt.sub}</div>
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Full Name</label>
              <input
                type="text" value={form.full_name} onChange={e => update('full_name', e.target.value)}
                placeholder="Jane Smith" required
                className="w-full px-3 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
              <input
                type="email" value={form.email} onChange={e => update('email', e.target.value)}
                placeholder="you@email.com" required
                className="w-full px-3 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Password</label>
              <input
                type="password" value={form.password} onChange={e => update('password', e.target.value)}
                placeholder="Min. 8 characters" required minLength={8}
                className="w-full px-3 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <button
              type="submit" disabled={loading}
              className="w-full bg-blue-600 text-white py-2.5 rounded-lg font-medium text-sm hover:bg-blue-700 transition-colors disabled:opacity-60"
            >
              {loading ? 'Creating account…' : 'Create Account'}
            </button>
            <p className="text-xs text-slate-400 text-center">
              By registering you agree to our Terms of Service and Privacy Policy.
            </p>
          </form>
          <p className="text-center text-sm text-slate-500 mt-4">
            Already have an account?{' '}
            <Link href="/auth/login" className="text-blue-600 font-medium hover:underline">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
