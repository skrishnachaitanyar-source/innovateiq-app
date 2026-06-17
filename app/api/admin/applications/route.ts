import { createClient } from '@/lib/supabase/server'
import { sendApplicationStatusEmail, sendEngagementStartEmail } from '@/lib/email'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { data: profile } = await supabase
      .from('profiles').select('role').eq('id', user.id).single()
    if (profile?.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Handle both JSON and FormData
    let body: Record<string, string>
    const contentType = request.headers.get('content-type') || ''
    if (contentType.includes('multipart/form-data') || contentType.includes('application/x-www-form-urlencoded')) {
      const fd = await request.formData()
      body = Object.fromEntries(fd.entries()) as Record<string, string>
    } else {
      body = await request.json()
    }

    const { application_id, status, contractor_id, client_id, job_id,
            contractor_email, contractor_name, job_title } = body

    // Update application status
    await supabase.from('applications')
      .update({ status })
      .eq('id', application_id)

    // Notify contractor via email
    if (contractor_email && contractor_name && job_title) {
      await sendApplicationStatusEmail({
        contractorName: contractor_name,
        contractorEmail: contractor_email,
        jobTitle: job_title,
        status,
      }).catch(console.error)
    }

    // If hired — auto-create engagement
    if (status === 'hired' && contractor_id && client_id && job_id) {
      const { data: job } = await supabase
        .from('jobs').select('*').eq('id', job_id).single()
      const { data: contractor } = await supabase
        .from('contractors').select('*, profile:profiles(full_name, email)').eq('id', contractor_id).single()
      const { data: client } = await supabase
        .from('clients').select('company_name').eq('id', client_id).single()

      if (job && contractor) {
        // Create engagement
        const { data: engagement } = await supabase.from('engagements').insert([{
          application_id,
          contractor_id,
          client_id,
          job_id,
          title: job.title,
          engagement_type: job.engagement_type || contractor.engagement_type,
          agreed_rate: contractor.target_rate,
          start_date: job.start_date || null,
          status: 'pending',
          notes: `Created from job application on ${new Date().toLocaleDateString()}`,
        }]).select().single()

        // Mark job as filled
        await supabase.from('jobs').update({ status: 'filled' }).eq('id', job_id)

        // Notify contractor of engagement
        const cProfile = contractor.profile as any
        if (cProfile?.email) {
          await sendEngagementStartEmail({
            contractorName: cProfile.full_name || 'Contractor',
            contractorEmail: cProfile.email,
            clientName: client?.company_name || 'Client',
            role: job.title,
            startDate: job.start_date || 'TBD',
            rate: contractor.target_rate?.toString() || 'TBD',
            engagementType: job.engagement_type || contractor.engagement_type || 'TBD',
          }).catch(console.error)
        }

        // Notify contractor in-app
        await supabase.from('notifications').insert([{
          user_id: contractor.profile_id,
          type: 'engagement_created',
          title: `Engagement created: ${job.title}`,
          body: `You have been placed for ${job.title} at ${client?.company_name}. Check your email for details.`,
          link: '/dashboard',
        }])

        return NextResponse.json({ success: true, engagement })
      }
    }

    // Redirect back for form submissions
    if (request.headers.get('content-type')?.includes('form')) {
      return NextResponse.redirect(new URL('/admin/jobs', request.url), 303)
    }

    return NextResponse.json({ success: true })
  } catch (err: any) {
    console.error('Application action error:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
