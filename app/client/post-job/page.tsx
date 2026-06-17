'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

const SKILLS = ['JavaScript', 'Python', 'React', 'Node.js', 'AWS', 'SQL', 'Java', 'TypeScript', 'DevOps', 'Project Management', 'Data Analysis', 'Salesforce', 'SAP', 'Azure', 'GCP']

export default function PostJobPage() {
  const [form, setForm] = useState({
    title: '', description: '', seniority_level: '', engagement_type: '',
    duration: '', budget_range: '', skills_required: [] as string[], start_date: ''
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()
  const supabase = createClient()

  function update(k: string, v: string) { setForm(f => ({ ...f, [k]: v })) }
  function toggleSkill(s: string) {
    setForm(f => ({
      ...f,
      skills_required: f.skills_required.includes(s)
        ? f.skills_required.filter(x => x !== s)
        : [...f.skills_required, s]
    }))
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError('')
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data: client } = await supabase.from('clients').select('id').eq('profile_id', user.id).single()
    if (!client) {
      // Create client record if doesn't exist
      const { data: profile } = await supabase.from('profiles').select('full_name').eq('id', user.id).single()
      const { data: newClient } = await supabase.from('clients').insert([{
        profile_id: user.id, company_name: profile?.full_name || 'My Company'
      }]).select('id').single()
      if (!newClient) { setError('Please complete your profile first.'); setSaving(false); return }
    }

    const clientId = client?.id
    const { error: jobError } = await supabase.from('jobs').insert([{
      ...form,
      client_id: clientId,
      start_date: form.start_date || null,
    }])

    if (jobError) { setError(jobError.message); setSaving(false); return }
    router.push('/client/dashboard')
  }

  return (
    <div className="p-8 max-w-3xl">
      <h1 className="text-2xl font-bold text-slate-900 mb-1">Post a Contract Role</h1>
      <p className="text-slate-500 text-sm mb-8">Fill in the details and our team will source qualified contractors for you.</p>

      <form onSubmit={submit} className="space-y-6">
        {error && <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm">{error}</div>}

        <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-4">
          <h2 className="font-semibold text-slate-900">Role Details</h2>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Job Title *</label>
            <input type="text" value={form.title} onChange={e => update('title', e.target.value)} placeholder="e.g. Senior Java Developer" required
              className="w-full px-3 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Description *</label>
            <textarea value={form.description} onChange={e => update('description', e.target.value)} rows={5}
              placeholder="Describe the responsibilities, deliverables, and work environment…" required
              className="w-full px-3 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Seniority Level</label>
              <select value={form.seniority_level} onChange={e => update('seniority_level', e.target.value)}
                className="w-full px-3 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white">
                <option value="">Select…</option>
                <option value="junior">Junior (0–2 yrs)</option>
                <option value="mid">Mid-Level (2–5 yrs)</option>
                <option value="senior">Senior (5–10 yrs)</option>
                <option value="principal">Principal / Lead (10+ yrs)</option>
                <option value="open">Open / Flexible</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Engagement Type</label>
              <select value={form.engagement_type} onChange={e => update('engagement_type', e.target.value)}
                className="w-full px-3 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white">
                <option value="">Select…</option>
                <option value="1099">1099 Independent Contractor</option>
                <option value="w2">W-2 via Agency</option>
                <option value="c2c">Corp-to-Corp (C2C)</option>
                <option value="open">Open / Flexible</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Contract Duration</label>
              <select value={form.duration} onChange={e => update('duration', e.target.value)}
                className="w-full px-3 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white">
                <option value="">Select…</option>
                <option value="1-3 months">1–3 months</option>
                <option value="3-6 months">3–6 months</option>
                <option value="6-12 months">6–12 months</option>
                <option value="ongoing">Ongoing</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Start Date</label>
              <input type="date" value={form.start_date} onChange={e => update('start_date', e.target.value)}
                className="w-full px-3 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Budget Range ($/hr)</label>
            <input type="text" value={form.budget_range} onChange={e => update('budget_range', e.target.value)} placeholder="e.g. $80–$110/hr or contact for rates"
              className="w-full px-3 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <h2 className="font-semibold text-slate-900 mb-4">Required Skills</h2>
          <div className="flex flex-wrap gap-2">
            {SKILLS.map(s => (
              <button key={s} type="button" onClick={() => toggleSkill(s)}
                className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all border ${
                  form.skills_required.includes(s)
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'
                }`}>{s}</button>
            ))}
          </div>
        </div>

        <button type="submit" disabled={saving}
          className="bg-blue-600 text-white px-6 py-2.5 rounded-lg font-medium text-sm hover:bg-blue-700 transition-colors disabled:opacity-60">
          {saving ? 'Posting…' : 'Post Role'}
        </button>
      </form>
    </div>
  )
}
