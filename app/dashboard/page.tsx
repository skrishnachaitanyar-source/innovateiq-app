import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { formatDate, statusColor } from '@/lib/utils'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single()
  const role = profile?.role

  // Fetch role-specific stats
  let stats: { label: string; value: string | number; color: string }[] = []
  let recentItems: any[] = []

  if (role === 'contractor') {
    const { data: contractor } = await supabase.from('contractors').select('*').eq('profile_id', user.id).single()
    const { data: applications } = await supabase.from('applications').select('*, job:jobs(title, status)').eq('contractor_id', contractor?.id || '').order('created_at', { ascending: false }).limit(5)
    const { data: docs } = await supabase.from('documents').select('*').eq('contractor_id', contractor?.id || '')
    const { data: engagements } = await supabase.from('engagements').select('*').eq('contractor_id', contractor?.id || '').eq('status', 'active')

    stats = [
      { label: 'Profile Status', value: contractor?.status || 'Not set up', color: 'blue' },
      { label: 'Applications', value: applications?.length || 0, color: 'purple' },
      { label: 'Active Engagements', value: engagements?.length || 0, color: 'green' },
      { label: 'Documents on File', value: docs?.length || 0, color: 'amber' },
    ]
    recentItems = applications || []
  }

  if (role === 'client') {
    const { data: client } = await supabase.from('clients').select('*').eq('profile_id', user.id).single()
    const { data: jobs } = await supabase.from('jobs').select('*').eq('client_id', client?.id || '').order('created_at', { ascending: false }).limit(5)
    const { data: openJobs } = await supabase.from('jobs').select('*').eq('client_id', client?.id || '').eq('status', 'open')
    const { data: engagements } = await supabase.from('engagements').select('*').eq('client_id', client?.id || '').eq('status', 'active')

    stats = [
      { label: 'Company', value: client?.company_name || 'Not set up', color: 'blue' },
      { label: 'Open Roles', value: openJobs?.length || 0, color: 'green' },
      { label: 'Active Engagements', value: engagements?.length || 0, color: 'purple' },
      { label: 'Total Jobs Posted', value: jobs?.length || 0, color: 'amber' },
    ]
    recentItems = jobs || []
  }

  if (role === 'admin') {
    const { count: contractorCount } = await supabase.from('contractors').select('*', { count: 'exact', head: true })
    const { count: clientCount } = await supabase.from('clients').select('*', { count: 'exact', head: true })
    const { count: openJobs } = await supabase.from('jobs').select('*', { count: 'exact', head: true }).eq('status', 'open')
    const { count: newContacts } = await supabase.from('contact_submissions').select('*', { count: 'exact', head: true }).eq('status', 'new')
    const { data: recentContacts } = await supabase.from('contact_submissions').select('*').order('created_at', { ascending: false }).limit(5)
    const { count: pendingDocs } = await supabase.from('documents').select('*', { count: 'exact', head: true }).eq('status', 'pending')

    stats = [
      { label: 'Total Contractors', value: contractorCount || 0, color: 'blue' },
      { label: 'Total Clients', value: clientCount || 0, color: 'purple' },
      { label: 'Open Jobs', value: openJobs || 0, color: 'green' },
      { label: 'New Contact Forms', value: newContacts || 0, color: 'amber' },
      { label: 'Pending Documents', value: pendingDocs || 0, color: 'red' },
    ]
    recentItems = recentContacts || []
  }

  const colorMap: Record<string, string> = {
    blue: 'bg-blue-50 text-blue-700',
    purple: 'bg-purple-50 text-purple-700',
    green: 'bg-green-50 text-green-700',
    amber: 'bg-amber-50 text-amber-700',
    red: 'bg-red-50 text-red-700',
  }

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">
          Welcome back, {profile?.full_name?.split(' ')[0] || 'there'} 👋
        </h1>
        <p className="text-slate-500 mt-1 text-sm capitalize">{role} Dashboard · Innovate IQ LLC</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {stats.map((stat, i) => (
          <div key={i} className="bg-white rounded-xl border border-slate-200 p-5">
            <div className={`inline-flex px-2 py-1 rounded-md text-xs font-medium mb-2 ${colorMap[stat.color]}`}>
              {stat.label}
            </div>
            <div className="text-2xl font-bold text-slate-900">{stat.value}</div>
          </div>
        ))}
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-xl border border-slate-200">
        <div className="px-6 py-4 border-b border-slate-100">
          <h2 className="font-semibold text-slate-900">
            {role === 'contractor' ? 'Recent Applications' : role === 'client' ? 'Recent Job Postings' : 'Recent Contact Submissions'}
          </h2>
        </div>
        {recentItems.length === 0 ? (
          <div className="px-6 py-12 text-center">
            <p className="text-slate-400 text-sm">
              {role === 'contractor' ? 'No applications yet. Browse open jobs to get started.' :
               role === 'client' ? 'No jobs posted yet. Post your first role.' :
               'No contact submissions yet.'}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {recentItems.map((item: any) => (
              <div key={item.id} className="px-6 py-4 flex items-center justify-between">
                <div>
                  <div className="text-sm font-medium text-slate-900">
                    {item.title || item.subject || item.name || item.job?.title || 'Item'}
                  </div>
                  <div className="text-xs text-slate-400 mt-0.5">{formatDate(item.created_at)}</div>
                </div>
                <span className={`text-xs font-medium px-2 py-1 rounded-full ${statusColor(item.status)}`}>
                  {item.status}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Quick actions */}
      <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-4">
        {role === 'contractor' && (
          <>
            <a href="/contractor/profile" className="bg-blue-600 text-white rounded-xl p-4 text-sm font-medium hover:bg-blue-700 transition-colors text-center">Complete Profile →</a>
            <a href="/contractor/apply" className="bg-white border border-slate-200 text-slate-700 rounded-xl p-4 text-sm font-medium hover:bg-slate-50 transition-colors text-center">Browse Open Jobs →</a>
            <a href="/contractor/checklist" className="bg-white border border-slate-200 text-slate-700 rounded-xl p-4 text-sm font-medium hover:bg-slate-50 transition-colors text-center">Onboarding Checklist →</a>
          </>
        )}
        {role === 'client' && (
          <>
            <a href="/client/post-job" className="bg-blue-600 text-white rounded-xl p-4 text-sm font-medium hover:bg-blue-700 transition-colors text-center">Post a New Role →</a>
            <a href="/client/dashboard" className="bg-white border border-slate-200 text-slate-700 rounded-xl p-4 text-sm font-medium hover:bg-slate-50 transition-colors text-center">View All Roles →</a>
            <a href="/client/documents" className="bg-white border border-slate-200 text-slate-700 rounded-xl p-4 text-sm font-medium hover:bg-slate-50 transition-colors text-center">Manage Documents →</a>
          </>
        )}
        {role === 'admin' && (
          <>
            <a href="/admin/contractors" className="bg-blue-600 text-white rounded-xl p-4 text-sm font-medium hover:bg-blue-700 transition-colors text-center">Review Contractors →</a>
            <a href="/admin/contacts" className="bg-white border border-slate-200 text-slate-700 rounded-xl p-4 text-sm font-medium hover:bg-slate-50 transition-colors text-center">View Contact Forms →</a>
            <a href="/admin/documents" className="bg-white border border-slate-200 text-slate-700 rounded-xl p-4 text-sm font-medium hover:bg-slate-50 transition-colors text-center">Approve Documents →</a>
          </>
        )}
      </div>
    </div>
  )
}
