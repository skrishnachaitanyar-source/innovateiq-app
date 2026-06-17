'use client'
import { useState } from 'react'

export default function SendEsignButton({ contractors }: { contractors: any[] }) {
  const [form, setForm] = useState({
    document_type: 'ica', contractor_id: '', signer_name: '', signer_email: ''
  })
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState('')

  function selectContractor(id: string) {
    const c = contractors.find(x => x.id === id)
    if (c) {
      const p = c.profile as any
      setForm(f => ({
        ...f,
        contractor_id: id,
        signer_name: p?.full_name || '',
        signer_email: p?.email || '',
      }))
    } else {
      setForm(f => ({ ...f, contractor_id: id, signer_name: '', signer_email: '' }))
    }
  }

  async function send(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setResult('')
    const res = await fetch('/api/esign', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })
    const json = await res.json()
    if (res.ok) {
      setResult('✓ Signature request sent! The signer will receive an email.')
      setForm({ document_type: 'ica', contractor_id: '', signer_name: '', signer_email: '' })
    } else {
      setResult(`Error: ${json.error}`)
    }
    setLoading(false)
  }

  return (
    <form onSubmit={send} className="grid grid-cols-2 gap-4 max-w-2xl">
      {result && (
        <div className={`col-span-2 text-sm px-4 py-3 rounded-lg ${result.startsWith('✓')
          ? 'bg-green-50 border border-green-200 text-green-700'
          : 'bg-red-50 border border-red-200 text-red-700'}`}>
          {result}
        </div>
      )}
      <div>
        <label className="block text-xs font-medium text-slate-600 mb-1">Document Type</label>
        <select value={form.document_type} onChange={e => setForm(f => ({ ...f, document_type: e.target.value }))}
          className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500">
          <option value="ica">ICA — Independent Contractor Agreement</option>
          <option value="msa">MSA — Master Services Agreement</option>
          <option value="nda">NDA — Non-Disclosure Agreement</option>
          <option value="sow">SOW — Statement of Work</option>
        </select>
      </div>
      <div>
        <label className="block text-xs font-medium text-slate-600 mb-1">Contractor (optional auto-fill)</label>
        <select value={form.contractor_id} onChange={e => selectContractor(e.target.value)}
          className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500">
          <option value="">Select contractor…</option>
          {contractors.map(c => {
            const p = c.profile as any
            return <option key={c.id} value={c.id}>{p?.full_name} — {c.primary_role || 'No role'}</option>
          })}
        </select>
      </div>
      <div>
        <label className="block text-xs font-medium text-slate-600 mb-1">Signer Name *</label>
        <input type="text" value={form.signer_name} onChange={e => setForm(f => ({ ...f, signer_name: e.target.value }))}
          placeholder="Full name" required
          className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
      </div>
      <div>
        <label className="block text-xs font-medium text-slate-600 mb-1">Signer Email *</label>
        <input type="email" value={form.signer_email} onChange={e => setForm(f => ({ ...f, signer_email: e.target.value }))}
          placeholder="email@example.com" required
          className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
      </div>
      <div className="col-span-2">
        <button type="submit" disabled={loading}
          className="bg-blue-600 text-white px-5 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors disabled:opacity-60">
          {loading ? 'Sending…' : 'Send for Signature'}
        </button>
        <p className="text-xs text-slate-400 mt-2">
          Requires DocuSeal to be configured. See README for setup instructions.
        </p>
      </div>
    </form>
  )
}
