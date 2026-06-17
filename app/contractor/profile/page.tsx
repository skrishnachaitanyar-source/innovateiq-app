'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { seniorityLabel, engagementLabel } from '@/lib/utils'

const SKILLS_SUGGESTIONS = ['JavaScript', 'Python', 'React', 'Node.js', 'AWS', 'SQL', 'Java', 'TypeScript', 'DevOps', 'Project Management', 'Data Analysis', 'Salesforce', 'SAP']

export default function ContractorProfilePage() {
  const supabase = createClient()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState('')
  const [form, setForm] = useState({
    full_name: '', phone: '', linkedin_url: '', primary_role: '',
    years_experience: '', seniority_level: '', engagement_type: '',
    target_rate: '', availability: '', bio: '', skills: [] as string[],
  })

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single()
      const { data: contractor } = await supabase.from('contractors').select('*').eq('profile_id', user.id).single()
      setForm({
        full_name: profile?.full_name || '',
        phone: profile?.phone || '',
        linkedin_url: contractor?.linkedin_url || '',
        primary_role: contractor?.primary_role || '',
        years_experience: contractor?.years_experience || '',
        seniority_level: contractor?.seniority_level || '',
        engagement_type: contractor?.engagement_type || '',
        target_rate: contractor?.target_rate?.toString() || '',
        availability: contractor?.availability || '',
        bio: contractor?.bio || '',
        skills: contractor?.skills || [],
      })
      setLoading(false)
    }
    load()
  }, [])

  function update(k: string, v: string) { setForm(f => ({ ...f, [k]: v })) }
  function toggleSkill(s: string) {
    setForm(f => ({
      ...f,
      skills: f.skills.includes(s) ? f.skills.filter(x => x !== s) : [...f.skills, s]
    }))
  }

  async function save(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setMsg('')
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    await supabase.from('profiles').update({ full_name: form.full_name, phone: form.phone }).eq('id', user.id)

    const contractorData = {
      profile_id: user.id,
      linkedin_url: form.linkedin_url,
      primary_role: form.primary_role,
      years_experience: form.years_experience,
      seniority_level: form.seniority_level,
      engagement_type: form.engagement_type,
      target_rate: form.target_rate ? parseFloat(form.target_rate) : null,
      availability: form.availability,
      bio: form.bio,
      skills: form.skills,
    }

    const { data: existing } = await supabase.from('contractors').select('id').eq('profile_id', user.id).single()
    if (existing) {
      await supabase.from('contractors').update(contractorData).eq('profile_id', user.id)
    } else {
      await supabase.from('contractors').insert([contractorData])
    }

    setMsg('Profile saved successfully!')
    setSaving(false)
    setTimeout(() => setMsg(''), 3000)
  }

  if (loading) return <div className="p-8 text-slate-400">Loading…</div>

  return (
    <div className="p-8 max-w-3xl">
      <h1 className="text-2xl font-bold text-slate-900 mb-1">My Profile</h1>
      <p className="text-slate-500 text-sm mb-8">Keep your profile complete to improve your chances of placement.</p>

      <form onSubmit={save} className="space-y-6">
        {msg && <div className="bg-green-50 border border-green-200 text-green-700 rounded-lg px-4 py-3 text-sm">{msg}</div>}

        {/* Personal */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-4">
          <h2 className="font-semibold text-slate-900">Personal Information</h2>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Full Name" value={form.full_name} onChange={v => update('full_name', v)} placeholder="Jane Smith" />
            <Field label="Phone" value={form.phone} onChange={v => update('phone', v)} placeholder="(555) 000-0000" />
          </div>
          <Field label="LinkedIn URL" value={form.linkedin_url} onChange={v => update('linkedin_url', v)} placeholder="https://linkedin.com/in/..." />
        </div>

        {/* Professional */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-4">
          <h2 className="font-semibold text-slate-900">Professional Details</h2>
          <Field label="Primary Role / Title" value={form.primary_role} onChange={v => update('primary_role', v)} placeholder="e.g. Senior DevOps Engineer" />
          <div className="grid grid-cols-2 gap-4">
            <SelectField label="Seniority Level" value={form.seniority_level} onChange={v => update('seniority_level', v)}
              options={[
                { value: 'junior', label: 'Junior (0–2 yrs)' },
                { value: 'mid', label: 'Mid-Level (2–5 yrs)' },
                { value: 'senior', label: 'Senior (5–10 yrs)' },
                { value: 'principal', label: 'Principal / Lead (10+ yrs)' },
              ]}
            />
            <SelectField label="Engagement Type" value={form.engagement_type} onChange={v => update('engagement_type', v)}
              options={[
                { value: 'w2', label: 'W-2 via Agency' },
                { value: '1099', label: '1099 Independent' },
                { value: 'c2c', label: 'Corp-to-Corp (C2C)' },
                { value: 'open', label: 'Open to any' },
              ]}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Target Rate ($/hr)" value={form.target_rate} onChange={v => update('target_rate', v)} placeholder="e.g. 95" type="number" />
            <SelectField label="Availability" value={form.availability} onChange={v => update('availability', v)}
              options={[
                { value: 'immediate', label: 'Immediate' },
                { value: '2_weeks', label: 'Within 2 weeks' },
                { value: '1_month', label: 'Within 1 month' },
                { value: 'exploring', label: 'Just exploring' },
              ]}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Bio / Summary</label>
            <textarea
              value={form.bio} onChange={e => update('bio', e.target.value)}
              rows={4} placeholder="Tell us about your background and what you're looking for…"
              className="w-full px-3 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            />
          </div>
        </div>

        {/* Skills */}
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <h2 className="font-semibold text-slate-900 mb-4">Skills</h2>
          <div className="flex flex-wrap gap-2">
            {SKILLS_SUGGESTIONS.map(s => (
              <button key={s} type="button" onClick={() => toggleSkill(s)}
                className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all border ${
                  form.skills.includes(s)
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'
                }`}
              >{s}</button>
            ))}
          </div>
        </div>

        <button type="submit" disabled={saving}
          className="bg-blue-600 text-white px-6 py-2.5 rounded-lg font-medium text-sm hover:bg-blue-700 transition-colors disabled:opacity-60">
          {saving ? 'Saving…' : 'Save Profile'}
        </button>
      </form>
    </div>
  )
}

function Field({ label, value, onChange, placeholder, type = "text" }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string; type?: string }) {
  return (
    <div>
      <label className="block text-sm font-medium text-slate-700 mb-1">{label}</label>
      <input type={type} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder}
        className="w-full px-3 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
    </div>
  )
}

function SelectField({ label, value, onChange, options }: { label: string; value: string; onChange: (v: string) => void; options: { value: string; label: string }[] }) {
  return (
    <div>
      <label className="block text-sm font-medium text-slate-700 mb-1">{label}</label>
      <select value={value} onChange={(e) => onChange(e.target.value)}
        className="w-full px-3 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white">
        <option value="">Select…</option>
        {options.map((o: any) => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </div>
  )
}
