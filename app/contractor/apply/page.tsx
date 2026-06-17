import { createClient } from '@/lib/supabase/server'
import { formatDate, seniorityLabel, engagementLabel, statusColor } from '@/lib/utils'
import ApplyButton from './ApplyButton'

export default async function BrowseJobsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: jobs } = await supabase
    .from('jobs')
    .select('*, client:clients(company_name)')
    .eq('status', 'open')
    .order('created_at', { ascending: false })

  const { data: contractor } = await supabase.from('contractors').select('id').eq('profile_id', user!.id).single()
  const { data: applications } = await supabase.from('applications').select('job_id').eq('contractor_id', contractor?.id || '')
  const appliedJobIds = new Set(applications?.map(a => a.job_id))

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">Open Roles</h1>
        <p className="text-slate-500 text-sm mt-1">{jobs?.length || 0} positions available</p>
      </div>

      {jobs?.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
          <p className="text-slate-400">No open roles right now. Check back soon.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {jobs?.map(job => (
            <div key={job.id} className="bg-white rounded-xl border border-slate-200 p-6">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h2 className="text-base font-semibold text-slate-900">{job.title}</h2>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusColor(job.status)}`}>{job.status}</span>
                  </div>
                  <p className="text-sm text-slate-500 mb-3">{(job.client as any)?.company_name} · Posted {formatDate(job.created_at)}</p>
                  <p className="text-sm text-slate-600 mb-4 line-clamp-2">{job.description}</p>
                  <div className="flex flex-wrap gap-2">
                    {job.seniority_level && (
                      <span className="text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded-md font-medium">{seniorityLabel(job.seniority_level)}</span>
                    )}
                    {job.engagement_type && (
                      <span className="text-xs bg-purple-50 text-purple-700 px-2 py-1 rounded-md font-medium">{engagementLabel(job.engagement_type)}</span>
                    )}
                    {job.duration && (
                      <span className="text-xs bg-slate-100 text-slate-600 px-2 py-1 rounded-md">{job.duration}</span>
                    )}
                    {job.skills_required?.map((s: string) => (
                      <span key={s} className="text-xs bg-slate-100 text-slate-600 px-2 py-1 rounded-md">{s}</span>
                    ))}
                  </div>
                </div>
                <div className="flex-shrink-0">
                  {appliedJobIds.has(job.id) ? (
                    <span className="text-xs bg-green-50 text-green-700 px-3 py-2 rounded-lg font-medium border border-green-200">Applied ✓</span>
                  ) : (
                    <ApplyButton jobId={job.id} contractorId={contractor?.id} />
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
