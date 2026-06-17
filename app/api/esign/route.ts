import { createClient } from '@/lib/supabase/server'
import { createSignatureRequest, icaFields, msaFields } from '@/lib/esign/docuseal'
import { NextResponse } from 'next/server'
import { z } from 'zod'

const schema = z.object({
  document_type: z.enum(['ica', 'msa', 'nda', 'sow']),
  contractor_id: z.string().uuid().optional(),
  client_id: z.string().uuid().optional(),
  engagement_id: z.string().uuid().optional(),
  signer_name: z.string().min(2),
  signer_email: z.string().email(),
  custom_fields: z.record(z.string(), z.string()).optional(),
})

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    // Only admins can send signature requests
    const { data: profile } = await supabase
      .from('profiles').select('role').eq('id', user.id).single()
    if (profile?.role !== 'admin') {
      return NextResponse.json({ error: 'Only admins can send signature requests' }, { status: 403 })
    }

    const body = await request.json()
    const data = schema.parse(body)

    // Build custom fields based on document type
    let customFields: Record<string, string> = data.custom_fields || {}
    if (data.document_type === 'ica' && data.contractor_id) {
      const { data: contractor } = await supabase
        .from('contractors')
        .select('*, profile:profiles(full_name, email)')
        .eq('id', data.contractor_id)
        .single()

      if (contractor) {
        customFields = Object.assign({}, icaFields({
            contractorName: (contractor.profile as any)?.full_name || data.signer_name,
            contractorEmail: (contractor.profile as any)?.email || data.signer_email,
            contractorType: contractor.engagement_type || '1099',
            role: contractor.primary_role || 'Contract Professional',
            startDate: new Date().toLocaleDateString('en-US'),
            rate: contractor.target_rate?.toString() || 'TBD',
}), customFields) as Record<string, string>
      }
    }

    if (data.document_type === 'msa' && data.client_id) {
      const { data: client } = await supabase
        .from('clients')
        .select('*, profile:profiles(full_name, email)')
        .eq('id', data.client_id)
        .single()

      if (client) {
        customFields = Object.assign({}, msaFields({
            clientName: (client.profile as any)?.full_name || data.signer_name,
            clientEmail: (client.profile as any)?.email || data.signer_email,
            companyName: client.company_name,
}), customFields) as Record<string, string>
      }
    }

    // Create signature request via DocuSeal
    const sigResult = await createSignatureRequest({
      documentType: data.document_type,
      signerName: data.signer_name,
      signerEmail: data.signer_email,
      customFields,
      completionRedirectUrl: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?signed=true`,
    })

    // Save esign request to DB
    const { data: esignRecord, error } = await supabase
      .from('esign_requests')
      .insert([{
        contractor_id: data.contractor_id || null,
        client_id: data.client_id || null,
        engagement_id: data.engagement_id || null,
        document_type: data.document_type,
        status: 'sent',
        docuseal_submission_id: sigResult.submissionId,
        sent_to_email: data.signer_email,
        sent_at: new Date().toISOString(),
        expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      }])
      .select()
      .single()

    if (error) throw error

    // Notify the signer
    if (data.contractor_id) {
      const { data: contractorProfile } = await supabase
        .from('contractors')
        .select('profile_id')
        .eq('id', data.contractor_id)
        .single()

      if (contractorProfile) {
        await supabase.from('notifications').insert([{
          user_id: contractorProfile.profile_id,
          type: 'esign_request',
          title: `Document ready to sign: ${data.document_type.toUpperCase()}`,
          body: `Please check your email to sign your ${data.document_type.toUpperCase()} document.`,
          link: '/contractor/documents',
        }])
      }
    }

    return NextResponse.json({
      success: true,
      esign_request: esignRecord,
      signing_url: sigResult.signingUrl,
    })
  } catch (err: any) {
    console.error('Esign error:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

export async function GET(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { searchParams } = new URL(request.url)
    const contractorId = searchParams.get('contractor_id')
    const clientId = searchParams.get('client_id')

    let query = supabase
      .from('esign_requests')
      .select('*')
      .order('created_at', { ascending: false })

    if (contractorId) query = query.eq('contractor_id', contractorId)
    if (clientId) query = query.eq('client_id', clientId)

    const { data, error } = await query
    if (error) throw error

    return NextResponse.json({ requests: data })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
