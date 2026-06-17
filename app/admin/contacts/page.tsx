import { createClient } from '@/lib/supabase/server'
import { formatDate, statusColor } from '@/lib/utils'

export default async function AdminContactsPage() {
  const supabase = await createClient()
  const { data: contacts } = await supabase
    .from('contact_submissions')
    .select('*')
    .order('created_at', { ascending: false })

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold text-slate-900 mb-1">Contact Submissions</h1>
      <p className="text-slate-500 text-sm mb-8">{contacts?.filter(c => c.status === 'new').length || 0} new</p>

      <div className="space-y-4">
        {contacts?.map(c => (
          <div key={c.id} className="bg-white rounded-xl border border-slate-200 p-6">
            <div className="flex items-start justify-between gap-4 mb-3">
              <div>
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="font-semibold text-slate-900">{c.name}</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusColor(c.status)}`}>{c.status}</span>
                  <span className="text-xs bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full capitalize">{c.type}</span>
                </div>
                <div className="text-sm text-slate-500">{c.email} · {formatDate(c.created_at)}</div>
              </div>
            </div>
            {c.subject && <div className="text-sm font-medium text-slate-700 mb-1">{c.subject}</div>}
            <p className="text-sm text-slate-600 whitespace-pre-wrap">{c.message}</p>
            <div className="mt-3">
              <a href={`mailto:${c.email}?subject=Re: ${c.subject || 'Your inquiry'}`}
                className="text-sm text-blue-600 hover:underline font-medium">
                Reply via email →
              </a>
            </div>
          </div>
        ))}
        {(!contacts || contacts.length === 0) && (
          <div className="bg-white rounded-xl border border-slate-200 p-12 text-center text-slate-400 text-sm">
            No contact submissions yet.
          </div>
        )}
      </div>
    </div>
  )
}
