'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

export default function ApproveButton({ contractorId, currentStatus }: { contractorId: string; currentStatus: string }) {
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  async function setStatus(status: string) {
    setLoading(true)
    await supabase.from('contractors').update({ status }).eq('id', contractorId)
    router.refresh()
    setLoading(false)
  }

  if (currentStatus === 'approved') {
    return (
      <button onClick={() => setStatus('inactive')} disabled={loading}
        className="text-xs text-slate-500 hover:text-red-600 transition-colors">
        Deactivate
      </button>
    )
  }

  return (
    <div className="flex gap-2">
      <button onClick={() => setStatus('approved')} disabled={loading}
        className="text-xs bg-green-600 text-white px-3 py-1.5 rounded-lg hover:bg-green-700 transition-colors disabled:opacity-60">
        {loading ? '…' : 'Approve'}
      </button>
      {currentStatus !== 'rejected' && (
        <button onClick={() => setStatus('rejected')} disabled={loading}
          className="text-xs text-red-500 hover:text-red-700 transition-colors">
          Reject
        </button>
      )}
    </div>
  )
}
