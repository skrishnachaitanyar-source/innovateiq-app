import { createClient } from '@/lib/supabase/server'
import { formatDate, statusColor, seniorityLabel } from '@/lib/utils'
import ApproveButton from './ApproveButton'

export default async function AdminContractorsPage() {
  const supabase = await createClient()
  const { data: contractors } = await supabase
    .from('contractors')
    .select('*, profile:profiles(full_name, email, phone)')
    .order('created_at', { ascending: false })

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Contractors</h1>
          <p className="text-slate-500 text-sm mt-1">{contractors?.length || 0} registered</p>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="text-left px-6 py-3 font-medium text-slate-500">Name</th>
              <th className="text-left px-6 py-3 font-medium text-slate-500">Role</th>
              <th className="text-left px-6 py-3 font-medium text-slate-500">Level</th>
              <th className="text-left px-6 py-3 font-medium text-slate-500">Type</th>
              <th className="text-left px-6 py-3 font-medium text-slate-500">Status</th>
              <th className="text-left px-6 py-3 font-medium text-slate-500">Joined</th>
              <th className="px-6 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {contractors?.map(c => (
              <tr key={c.id} className="hover:bg-slate-50">
                <td className="px-6 py-4">
                  <div className="font-medium text-slate-900">{(c.profile as any)?.full_name || '—'}</div>
                  <div className="text-xs text-slate-400">{(c.profile as any)?.email}</div>
                </td>
                <td className="px-6 py-4 text-slate-600">{c.primary_role || '—'}</td>
                <td className="px-6 py-4 text-slate-600">
                  {c.seniority_level ? seniorityLabel(c.seniority_level).split(' ')[0] : '—'}
                </td>
                <td className="px-6 py-4 text-slate-600 uppercase text-xs">{c.engagement_type || '—'}</td>
                <td className="px-6 py-4">
                  <span className={`text-xs px-2 py-1 rounded-full font-medium ${statusColor(c.status)}`}>{c.status}</span>
                </td>
                <td className="px-6 py-4 text-slate-400">{formatDate(c.created_at)}</td>
                <td className="px-6 py-4">
                  <ApproveButton contractorId={c.id} currentStatus={c.status} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {(!contractors || contractors.length === 0) && (
          <div className="px-6 py-12 text-center text-slate-400 text-sm">No contractors registered yet.</div>
        )}
      </div>
    </div>
  )
}
