import { createClient } from '@/lib/supabase/server'
import { formatDate, statusColor, seniorityLabel } from '@/lib/utils'

export default async function ClientDashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: client } = await supabase.from('clients').select('*').eq('profile_id', user!.id).single()
  const { data: jobs } = await supabase
    .from('jobs')
    .select('*, applications(id, status, contractor:contractors(primary_role, profile:profiles(full_name)))')
    .eq('client_id', client?.id || '')
    .order('created_at', { ascending: false })

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">My Roles</h1>
          <p className="text-slate-500 text-sm mt-1">{jobs?.length || 0} total postings</p>
        </div>
        <a href="/client/post-job" className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors">
          + Post New Role
        </a>
      </div>

      {(!jobs || jobs.length === 0) ? (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
          <p className="text-slate-400 text-sm mb-4">No roles posted yet.</p>
          <a href="/client/post-job" className="text-blue-600 text-sm font-medium hover:underline">Post your first role →</a>
        </div>
      ) : (
        <div className="space-y-4">
          {jobs?.map(job => {
            const apps = (job.applications as any[]) || []
            return (
              <div key={job.id} className="bg-white rounded-xl border border-slate-200 p-6">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="font-semibold text-slate-900">{job.title}</h2>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusColor(job.status)}`}>{job.status}</span>
                    </div>
                    <p className="text-xs text-slate-400 mt-0.5">Posted {formatDate(job.created_at)}</p>
                  </div>
                  <div className="text-sm text-slate-500">
                    <span className="font-semibold text-slate-900">{apps.length}</span> application{apps.length !== 1 ? 's' : ''}
                  </div>
                </div>
                <p className="text-sm text-slate-600 mb-4 line-clamp-2">{job.description}</p>
                <div className="flex gap-2 flex-wrap mb-3">
                  {job.seniority_level && <span className="text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded-md">{seniorityLabel(job.seniority_level)}</span>}
                  {job.duration && <span className="text-xs bg-slate-100 text-slate-600 px-2 py-1 rounded-md">{job.duration}</span>}
                  {job.engagement_type && <span className="text-xs bg-purple-50 text-purple-700 px-2 py-1 rounded-md uppercase">{job.engagement_type}</span>}
                </div>
                {apps.length > 0 && (
                  <div className="border-t border-slate-100 pt-3 mt-3">
                    <p className="text-xs font-medium text-slate-500 mb-2">APPLICANTS</p>
                    <div className="space-y-2">
                      {apps.slice(0, 3).map((app: any) => (
                        <div key={app.id} className="flex items-center justify-between text-sm">
                          <span className="text-slate-700">{app.contractor?.profile?.full_name || 'Contractor'}</span>
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusColor(app.status)}`}>{app.status}</span>
                        </div>
                      ))}
                      {apps.length > 3 && <p className="text-xs text-slate-400">+{apps.length - 3} more</p>}
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
