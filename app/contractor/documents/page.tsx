'use client'
import { useEffect, useState, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { formatDate, statusColor } from '@/lib/utils'

const DOC_TYPES = [
  { value: 'w9', label: 'IRS Form W-9', desc: 'Required for all 1099 contractors', required: true, accept: '.pdf' },
  { value: 'i9', label: 'IRS Form I-9', desc: 'Required for W-2 employees only', required: false, accept: '.pdf' },
  { value: 'resume', label: 'Resume / CV', desc: 'Current resume for client submissions', required: true, accept: '.pdf,.doc,.docx' },
  { value: 'coi', label: 'Certificate of Liability Insurance', desc: 'General Liability COI — required for C2C', required: false, accept: '.pdf' },
  { value: 'bgc', label: 'Background Check Auth', desc: 'Signed authorization for background screening', required: false, accept: '.pdf' },
  { value: 'other', label: 'Other Document', desc: 'Any additional compliance document', required: false, accept: '.pdf,.jpg,.png' },
]

export default function ContractorDocumentsPage() {
  const [docs, setDocs] = useState<any[]>([])
  const [contractorId, setContractorId] = useState('')
  const [uploading, setUploading] = useState<string | null>(null)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const fileRefs = useRef<Record<string, HTMLInputElement | null>>({})
  const supabase = createClient()

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data: contractor } = await supabase
        .from('contractors').select('id').eq('profile_id', user.id).single()
      if (contractor) {
        setContractorId(contractor.id)
        const res = await fetch(`/api/documents?contractor_id=${contractor.id}`)
        const json = await res.json()
        setDocs(json.documents || [])
      }
    }
    load()
  }, [])

  async function upload(docType: string, file: File) {
    setUploading(docType)
    setError('')
    setSuccess('')

    const formData = new FormData()
    formData.append('file', file)
    formData.append('type', docType)
    formData.append('contractor_id', contractorId)

    const res = await fetch('/api/documents', { method: 'POST', body: formData })
    const json = await res.json()

    if (!res.ok) {
      setError(json.error || 'Upload failed')
    } else {
      setDocs(prev => [json.document, ...prev])
      setSuccess(`${docType.toUpperCase()} uploaded successfully. Our team will review it shortly.`)
    }
    setUploading(null)
  }

  function handleFileChange(docType: string, e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) upload(docType, file)
  }

  const uploadedTypes = new Set(docs.map(d => d.type))

  return (
    <div className="p-8 max-w-3xl">
      <h1 className="text-2xl font-bold text-slate-900 mb-1">My Documents</h1>
      <p className="text-slate-500 text-sm mb-8">
        Upload required documents for compliance. All files are stored securely and reviewed by our team.
      </p>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm mb-4">{error}</div>
      )}
      {success && (
        <div className="bg-green-50 border border-green-200 text-green-700 rounded-lg px-4 py-3 text-sm mb-4">{success}</div>
      )}

      {/* Upload area */}
      <div className="space-y-3 mb-8">
        {DOC_TYPES.map(dt => {
          const existing = docs.filter(d => d.type === dt.value)
          const latest = existing[0]
          return (
            <div key={dt.value} className="bg-white rounded-xl border border-slate-200 p-5">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="font-medium text-slate-900 text-sm">{dt.label}</span>
                    {dt.required && (
                      <span className="text-xs bg-red-100 text-red-700 px-1.5 py-0.5 rounded font-medium">Required</span>
                    )}
                    {latest && (
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusColor(latest.status)}`}>
                        {latest.status}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-500">{dt.desc}</p>
                  {latest && (
                    <p className="text-xs text-slate-400 mt-1">
                      Uploaded {formatDate(latest.created_at)} · {(latest.file_size / 1024).toFixed(0)} KB
                    </p>
                  )}
                </div>
                <div className="flex-shrink-0 flex items-center gap-2">
                  {latest?.file_url && (
                    <a href={latest.file_url} target="_blank" rel="noopener noreferrer"
                      className="text-xs text-blue-600 hover:underline font-medium">
                      View
                    </a>
                  )}
                  <input
                    type="file"
                    accept={dt.accept}
                    ref={el => { fileRefs.current[dt.value] = el }}
                    onChange={e => handleFileChange(dt.value, e)}
                    className="hidden"
                  />
                  <button
                    onClick={() => fileRefs.current[dt.value]?.click()}
                    disabled={uploading === dt.value}
                    className={`text-sm px-4 py-2 rounded-lg font-medium transition-colors ${
                      latest
                        ? 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        : 'bg-blue-600 text-white hover:bg-blue-700'
                    } disabled:opacity-60`}
                  >
                    {uploading === dt.value ? 'Uploading…' : latest ? 'Replace' : 'Upload'}
                  </button>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Document history */}
      {docs.length > 0 && (
        <div className="bg-white rounded-xl border border-slate-200">
          <div className="px-5 py-4 border-b border-slate-100">
            <h2 className="font-semibold text-slate-900 text-sm">Upload History</h2>
          </div>
          <div className="divide-y divide-slate-100">
            {docs.map(doc => (
              <div key={doc.id} className="px-5 py-3 flex items-center justify-between">
                <div>
                  <span className="text-sm font-medium text-slate-800">{doc.name}</span>
                  <span className="text-xs text-slate-400 ml-2">{formatDate(doc.created_at)}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusColor(doc.status)}`}>
                    {doc.status}
                  </span>
                  {doc.file_url && (
                    <a href={doc.file_url} target="_blank" rel="noopener noreferrer"
                      className="text-xs text-blue-600 hover:underline">Download</a>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
