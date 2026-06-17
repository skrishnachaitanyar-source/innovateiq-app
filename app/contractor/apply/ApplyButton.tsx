'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function ApplyButton({ jobId, contractorId }: { jobId: string; contractorId?: string }) {
  const [loading, setLoading] = useState(false)
  const [applied, setApplied] = useState(false)
  const [note, setNote] = useState('')
  const [showNote, setShowNote] = useState(false)

  async function apply() {
    if (!contractorId) { alert('Please complete your profile first.'); return }
    setLoading(true)
    const supabase = createClient()
    const { error } = await supabase.from('applications').insert([{
      job_id: jobId, contractor_id: contractorId, cover_note: note || null
    }])
    if (!error) {
      setApplied(true)
      // Notify via API (email sent server-side)
      fetch('/api/notify/application', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ job_id: jobId, contractor_id: contractorId, cover_note: note })
      }).catch(() => {})
    }
    setLoading(false)
  }

  if (applied) return <span className="text-xs bg-green-50 text-green-700 px-3 py-2 rounded-lg font-medium border border-green-200">Applied ✓</span>

  return (
    <div className="text-right">
      {showNote && (
        <textarea value={note} onChange={e => setNote(e.target.value)}
          placeholder="Optional note to Innovate IQ…" rows={3}
          className="w-56 mb-2 px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none block"
        />
      )}
      <div className="flex gap-2 justify-end">
        <button onClick={() => setShowNote(v => !v)}
          className="text-xs text-slate-500 hover:text-slate-700 px-2 py-1"
        >+ Note</button>
        <button onClick={apply} disabled={loading}
          className="text-sm bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-60"
        >{loading ? '…' : 'Apply'}</button>
      </div>
    </div>
  )
}
