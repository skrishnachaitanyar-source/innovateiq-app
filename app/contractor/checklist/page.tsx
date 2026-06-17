'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

const ITEMS = [
  { key: 'w9_submitted', label: 'IRS Form W-9 Submitted', desc: 'Required before first payment for 1099 contractors.', required: true },
  { key: 'i9_submitted', label: 'IRS Form I-9 (W-2 only)', desc: 'Required for W-2 employees — must be done within 3 business days of start.', required: false },
  { key: 'ica_signed', label: 'Independent Contractor Agreement (ICA) Signed', desc: 'Core legal document governing your engagement.', required: true },
  { key: 'id_uploaded', label: 'Government-Issued ID Uploaded', desc: 'Required if client mandates background screening.', required: false },
  { key: 'nda_signed', label: 'NDA Signed (if required)', desc: 'Client-specific NDA depending on project sensitivity.', required: false },
  { key: 'coi_submitted', label: 'Certificate of Liability Insurance (C2C/Senior)', desc: 'General Liability COI for C2C engagements.', required: false },
  { key: 'banking_provided', label: 'Banking / Payment Info Provided', desc: 'Required to process your first payment.', required: true },
]

export default function ChecklistPage() {
  const [checklist, setChecklist] = useState<Record<string, boolean>>({})
  const [contractorId, setContractorId] = useState('')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data: contractor } = await supabase.from('contractors').select('id').eq('profile_id', user.id).single()
      if (!contractor) return
      setContractorId(contractor.id)
      const { data } = await supabase.from('onboarding_checklist').select('*').eq('contractor_id', contractor.id).single()
      if (data) {
        const state: Record<string, boolean> = {}
        ITEMS.forEach(item => { state[item.key] = (data as any)[item.key] || false })
        setChecklist(state)
      }
    }
    load()
  }, [])

  function toggle(key: string) {
    setChecklist(c => ({ ...c, [key]: !c[key] }))
  }

  async function save() {
    if (!contractorId) return
    setSaving(true)
    const { data: existing } = await supabase.from('onboarding_checklist').select('id').eq('contractor_id', contractorId).single()
    const payload = { contractor_id: contractorId, ...checklist }

    if (existing) {
      await supabase.from('onboarding_checklist').update(payload).eq('contractor_id', contractorId)
    } else {
      await supabase.from('onboarding_checklist').insert([payload])
    }
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
  }

  const completed = ITEMS.filter(i => checklist[i.key]).length

  return (
    <div className="p-8 max-w-2xl">
      <h1 className="text-2xl font-bold text-slate-900 mb-1">Onboarding Checklist</h1>
      <p className="text-slate-500 text-sm mb-6">Complete all required items before your first placement can begin.</p>

      {/* Progress bar */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 mb-6">
        <div className="flex justify-between text-sm mb-2">
          <span className="font-medium text-slate-700">Progress</span>
          <span className="text-slate-500">{completed} / {ITEMS.length} items</span>
        </div>
        <div className="w-full bg-slate-100 rounded-full h-2">
          <div className="bg-blue-600 h-2 rounded-full transition-all" style={{ width: `${(completed / ITEMS.length) * 100}%` }} />
        </div>
      </div>

      {saved && <div className="bg-green-50 border border-green-200 text-green-700 rounded-lg px-4 py-3 text-sm mb-4">Checklist saved! Our team has been notified.</div>}

      <div className="space-y-3 mb-6">
        {ITEMS.map(item => (
          <div key={item.key}
            onClick={() => toggle(item.key)}
            className={`bg-white rounded-xl border p-4 flex items-start gap-4 cursor-pointer transition-all hover:shadow-sm ${
              checklist[item.key] ? 'border-green-300 bg-green-50' : 'border-slate-200'
            }`}
          >
            <div className={`w-5 h-5 rounded border-2 flex-shrink-0 mt-0.5 flex items-center justify-center transition-all ${
              checklist[item.key] ? 'bg-green-500 border-green-500' : 'border-slate-300'
            }`}>
              {checklist[item.key] && <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7"/></svg>}
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className={`text-sm font-medium ${checklist[item.key] ? 'text-green-800 line-through' : 'text-slate-900'}`}>{item.label}</span>
                {item.required && <span className="text-xs bg-red-100 text-red-700 px-1.5 py-0.5 rounded font-medium">Required</span>}
              </div>
              <p className="text-xs text-slate-500 mt-0.5">{item.desc}</p>
            </div>
          </div>
        ))}
      </div>

      <button onClick={save} disabled={saving}
        className="bg-blue-600 text-white px-6 py-2.5 rounded-lg font-medium text-sm hover:bg-blue-700 transition-colors disabled:opacity-60">
        {saving ? 'Saving…' : 'Save & Notify Team'}
      </button>
    </div>
  )
}
