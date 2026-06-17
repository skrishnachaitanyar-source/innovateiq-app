'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

export default function JobActions({ jobId, currentStatus }: { jobId: string; currentStatus: string }) {
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  async function updateStatus(status: string) {
    setLoading(true)
    await supabase.from('jobs').update({ status }).eq('id', jobId)
    router.refresh()
    setLoading(false)
  }

  const next: Record<string, { label: string; status: string; color: string }> = {
    open: { label: 'Mark In Progress', status: 'in_progress', color: 'bg-blue-600 text-white' },
    in_progress: { label: 'Mark Filled', status: 'filled', color: 'bg-green-600 text-white' },
    filled: { label: 'Re-open', status: 'open', color: 'bg-slate-100 text-slate-700' },
    closed: { label: 'Re-open', status: 'open', color: 'bg-slate-100 text-slate-700' },
  }

  const action = next[currentStatus]
  if (!action) return null

  return (
    <button onClick={() => updateStatus(action.status)} disabled={loading}
      className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-colors disabled:opacity-60 ${action.color}`}>
      {loading ? '…' : action.label}
    </button>
  )
}
