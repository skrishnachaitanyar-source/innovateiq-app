'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { sendDocumentStatusEmail } from '@/lib/email'

export default function DocActions({ docId, uploaderName, uploaderEmail, docType }: {
  docId: string; uploaderName: string; uploaderEmail: string; docType: string
}) {
  const [loading, setLoading] = useState<string | null>(null)
  const router = useRouter()

  async function updateStatus(status: 'approved' | 'rejected') {
    setLoading(status)
    const res = await fetch(`/api/documents/${docId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    })
    if (res.ok && uploaderEmail) {
      await fetch('/api/notify/document-status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ recipientName: uploaderName, recipientEmail: uploaderEmail, docType, status }),
      }).catch(() => {})
    }
    setLoading(null)
    router.refresh()
  }

  return (
    <div className="flex gap-1">
      <button onClick={() => updateStatus('approved')} disabled={!!loading}
        className="text-xs bg-green-600 text-white px-2 py-1 rounded hover:bg-green-700 transition-colors disabled:opacity-60">
        {loading === 'approved' ? '…' : 'Approve'}
      </button>
      <button onClick={() => updateStatus('rejected')} disabled={!!loading}
        className="text-xs text-red-500 hover:text-red-700 px-1 transition-colors disabled:opacity-60">
        {loading === 'rejected' ? '…' : 'Reject'}
      </button>
    </div>
  )
}
