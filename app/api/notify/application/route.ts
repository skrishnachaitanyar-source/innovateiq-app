import { createClient } from '@/lib/supabase/server'
import { sendApplicationNotification } from '@/lib/email'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const { job_id, contractor_id, cover_note } = await request.json()
    const supabase = await createClient()

    const { data: job } = await supabase
      .from('jobs')
      .select('title, client:clients(company_name, profile:profiles(email, full_name))')
      .eq('id', job_id).single()

    const { data: contractor } = await supabase
      .from('contractors')
      .select('profile:profiles(full_name, email)')
      .eq('id', contractor_id).single()

    if (job && contractor) {
      const cProfile = contractor.profile as any
      const jobClient = job.client as any
      await sendApplicationNotification({
        contractorName: cProfile?.full_name || 'Contractor',
        contractorEmail: cProfile?.email || '',
        jobTitle: job.title,
        clientEmail: jobClient?.profile?.email || '',
        clientName: jobClient?.company_name || 'Client',
        coverNote: cover_note,
      })
    }

    return NextResponse.json({ success: true })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
