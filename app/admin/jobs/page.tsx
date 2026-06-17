import { createClient } from '@/lib/supabase/server'
import { formatDate, statusColor, seniorityLabel, engagementLabel } from '@/lib/utils'
import JobActions from './JobActions'

export default async function AdminJobsPage() {
  const supabase = await createClient()

  const { data: jobs } = await supabase
    .from('jobs')
    .select(`
      *,
      client:clients(company_name, profile:profiles(full_name, email)),
      applications(
        id, status, proposed_rate, cover_note, created_at,
        contractor:contractors(
          id, primary_role, target_rate, seniority_level,
          profile:profiles(full_name, email, phone)
        )
      )
    `)
    .order('created_at', { ascending: false })

  const totalOpen = jobs?.filter(j => j.status === 'open').length || 0
  const totalApps = jobs?.reduce((acc, j) => acc + ((j.applications as any[])?.length || 0), 0) || 0

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Jobs & Applications</h1>
          <p className="text-slate-500 text-sm mt-1">
            {jobs?.length || 0} total jobs · {totalOpen} open · {totalApps} applications
          </p>
        </div>
      </div>

      <div className="space-y-4">
        {jobs?.map(job => {
          const apps = (job.applications as any[]) || []
          const client = job.client as any
          return (
            <div key={job.id} className="bg-white rounded-xl border border-slate-200 overflow-hidden">
              {/* Job header */}
              <div className="px-6 py-4 flex items-start justify-between gap-4 border-b border-slate-100">
                <div className="flex-1">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <h2 className="font-semibold text-slate-900">{job.title}</h2>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusColor(job.status)}`}>{job.status}</span>
                    {job.seniority_level && (
                      <span className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded-md">{seniorityLabel(job.seniority_level).split(' ')[0]}</span>
                    )}
                    {job.engagement_type && (
                      <span className="text-xs bg-purple-50 text-purple-700 px-2 py-0.5 rounded-md uppercase">{job.engagement_type}</span>
                    )}
                  </div>
                  <p className="text-xs text-slate-500">
                    {client?.company_name || 'Unknown client'} · Posted {formatDate(job.created_at)}
                    {job.duration && ` · ${job.duration}`}
                  </p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <span className="text-sm text-slate-500 font-medium">
                    {apps.length} applicant{apps.length !== 1 ? 's' : ''}
                  </span>
                  <JobActions jobId={job.id} currentStatus={job.status} />
                </div>
              </div>

              {/* Applications */}
              {apps.length > 0 && (
                <div className="divide-y divide-slate-50">
                  {apps.map((app: any) => {
                    const contractor = app.contractor
                    const cProfile = contractor?.profile
                    return (
                      <div key={app.id} className="px-6 py-4 flex items-start justify-between gap-4 hover:bg-slate-50 transition-colors">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-0.5">
                            <span className="font-medium text-slate-900 text-sm">{cProfile?.full_name || 'Unknown'}</span>
                            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusColor(app.status)}`}>{app.status}</span>
                            {contractor?.seniority_level && (
                              <span className="text-xs text-slate-400">{seniorityLabel(contractor.seniority_level).split(' ')[0]}</span>
                            )}
                          </div>
                          <div className="text-xs text-slate-400">
                            {cProfile?.email}
                            {contractor?.target_rate && ` · Asking $${contractor.target_rate}/hr`}
                            {app.proposed_rate && ` · Proposed $${app.proposed_rate}/hr`}
                            · Applied {formatDate(app.created_at)}
                          </div>
                          {app.cover_note && (
                            <p className="text-xs text-slate-500 mt-1 italic">"{app.cover_note}"</p>
                          )}
                        </div>
                        <ApplicationActions
                          applicationId={app.id}
                          contractorId={contractor?.id}
                          jobId={job.id}
                          clientId={job.client_id}
                          currentStatus={app.status}
                          contractorEmail={cProfile?.email}
                          contractorName={cProfile?.full_name}
                          jobTitle={job.title}
                        />
                      </div>
                    )
                  })}
                </div>
              )}

              {apps.length === 0 && (
                <div className="px-6 py-3 text-xs text-slate-400">No applications yet.</div>
              )}
            </div>
          )
        })}
        {(!jobs || jobs.length === 0) && (
          <div className="bg-white rounded-xl border border-slate-200 p-12 text-center text-slate-400 text-sm">
            No jobs posted yet.
          </div>
        )}
      </div>
    </div>
  )
}

// Inline client component for application actions
function ApplicationActions({ applicationId, contractorId, jobId, clientId, currentStatus, contractorEmail, contractorName, jobTitle }: any) {
  return (
    <div className="flex gap-2 flex-shrink-0">
      {currentStatus === 'submitted' && (
        <>
          <form action={`/api/admin/applications`} method="POST" className="inline">
            <input type="hidden" name="application_id" value={applicationId} />
            <input type="hidden" name="status" value="shortlisted" />
            <input type="hidden" name="contractor_email" value={contractorEmail} />
            <input type="hidden" name="contractor_name" value={contractorName} />
            <input type="hidden" name="job_title" value={jobTitle} />
            <button type="submit" className="text-xs bg-purple-600 text-white px-3 py-1.5 rounded-lg hover:bg-purple-700 transition-colors">
              Shortlist
            </button>
          </form>
          <form action={`/api/admin/applications`} method="POST" className="inline">
            <input type="hidden" name="application_id" value={applicationId} />
            <input type="hidden" name="status" value="rejected" />
            <input type="hidden" name="contractor_email" value={contractorEmail} />
            <input type="hidden" name="contractor_name" value={contractorName} />
            <input type="hidden" name="job_title" value={jobTitle} />
            <button type="submit" className="text-xs text-red-500 hover:text-red-700 px-2 py-1.5 transition-colors">
              Reject
            </button>
          </form>
        </>
      )}
      {currentStatus === 'shortlisted' && (
        <form action={`/api/admin/applications`} method="POST" className="inline">
          <input type="hidden" name="application_id" value={applicationId} />
          <input type="hidden" name="status" value="hired" />
          <input type="hidden" name="contractor_id" value={contractorId} />
          <input type="hidden" name="client_id" value={clientId} />
          <input type="hidden" name="job_id" value={jobId} />
          <input type="hidden" name="contractor_email" value={contractorEmail} />
          <input type="hidden" name="contractor_name" value={contractorName} />
          <input type="hidden" name="job_title" value={jobTitle} />
          <button type="submit" className="text-xs bg-green-600 text-white px-3 py-1.5 rounded-lg hover:bg-green-700 transition-colors">
            Hire → Create Engagement
          </button>
        </form>
      )}
    </div>
  )
}
