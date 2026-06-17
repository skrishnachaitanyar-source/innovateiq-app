import { createClient } from '@/lib/supabase/server'
import { formatDate, statusColor } from '@/lib/utils'
import DocActions from './DocActions'
import SendEsignButton from './SendEsignButton'

export default async function AdminDocumentsPage() {
  const supabase = await createClient()

  const { data: docs } = await supabase
    .from('documents')
    .select(`
      *,
      uploader:profiles!uploaded_by(full_name, email),
      contractor:contractors(id, primary_role, profile:profiles(full_name, email))
    `)
    .order('created_at', { ascending: false })

  const { data: esignReqs } = await supabase
    .from('esign_requests')
    .select('*, contractor:contractors(profile:profiles(full_name, email))')
    .order('created_at', { ascending: false })
    .limit(20)

  const { data: contractors } = await supabase
    .from('contractors')
    .select('id, primary_role, profile:profiles(full_name, email)')
    .eq('status', 'approved')

  const pending = docs?.filter(d => d.status === 'pending') || []

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">Documents</h1>
        <p className="text-slate-500 text-sm mt-1">
          {pending.length} pending review · {docs?.length || 0} total
        </p>
      </div>

      {/* Send E-signature */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 mb-6">
        <h2 className="font-semibold text-slate-900 mb-4">Send Document for Signature</h2>
        <SendEsignButton contractors={contractors || []} />
      </div>

      {/* E-signature requests */}
      {esignReqs && esignReqs.length > 0 && (
        <div className="bg-white rounded-xl border border-slate-200 mb-6">
          <div className="px-6 py-4 border-b border-slate-100">
            <h2 className="font-semibold text-slate-900">E-Signature Requests</h2>
          </div>
          <div className="divide-y divide-slate-100">
            {esignReqs.map(req => {
              const c = (req.contractor as any)?.profile
              return (
                <div key={req.id} className="px-6 py-4 flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-slate-900 text-sm">{req.document_type.toUpperCase()}</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusColor(req.status)}`}>{req.status}</span>
                    </div>
                    <div className="text-xs text-slate-400 mt-0.5">
                      Sent to {req.sent_to_email} · {formatDate(req.created_at)}
                      {req.signed_at && ` · Signed ${formatDate(req.signed_at)}`}
                    </div>
                  </div>
                  {req.signed_document_url && (
                    <a href={req.signed_document_url} target="_blank" rel="noopener noreferrer"
                      className="text-xs text-blue-600 hover:underline font-medium">
                      Download Signed
                    </a>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Documents list */}
      <div className="bg-white rounded-xl border border-slate-200">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <h2 className="font-semibold text-slate-900">Uploaded Documents</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="text-left px-6 py-3 font-medium text-slate-500">Document</th>
                <th className="text-left px-6 py-3 font-medium text-slate-500">Uploaded by</th>
                <th className="text-left px-6 py-3 font-medium text-slate-500">Type</th>
                <th className="text-left px-6 py-3 font-medium text-slate-500">Size</th>
                <th className="text-left px-6 py-3 font-medium text-slate-500">Date</th>
                <th className="text-left px-6 py-3 font-medium text-slate-500">Status</th>
                <th className="px-6 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {docs?.map(doc => {
                const uploader = doc.uploader as any
                const contractor = doc.contractor as any
                return (
                  <tr key={doc.id} className={`hover:bg-slate-50 ${doc.status === 'pending' ? 'bg-amber-50/30' : ''}`}>
                    <td className="px-6 py-4">
                      <div className="font-medium text-slate-900 max-w-[200px] truncate">{doc.name}</div>
                    </td>
                    <td className="px-6 py-4 text-slate-600">
                      {uploader?.full_name || '—'}
                      <div className="text-xs text-slate-400">{uploader?.email}</div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-xs bg-slate-100 text-slate-600 px-2 py-1 rounded-md uppercase font-medium">{doc.type}</span>
                    </td>
                    <td className="px-6 py-4 text-slate-400 text-xs">
                      {doc.file_size ? `${(doc.file_size / 1024).toFixed(0)} KB` : '—'}
                    </td>
                    <td className="px-6 py-4 text-slate-400 text-xs">{formatDate(doc.created_at)}</td>
                    <td className="px-6 py-4">
                      <span className={`text-xs px-2 py-1 rounded-full font-medium ${statusColor(doc.status)}`}>{doc.status}</span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        {doc.file_url && (
                          <a href={doc.file_url} target="_blank" rel="noopener noreferrer"
                            className="text-xs text-blue-600 hover:underline">View</a>
                        )}
                        {doc.status === 'pending' && (
                          <DocActions
                            docId={doc.id}
                            uploaderName={uploader?.full_name || ''}
                            uploaderEmail={uploader?.email || ''}
                            docType={doc.type}
                          />
                        )}
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
          {(!docs || docs.length === 0) && (
            <div className="px-6 py-12 text-center text-slate-400 text-sm">No documents uploaded yet.</div>
          )}
        </div>
      </div>
    </div>
  )
}
