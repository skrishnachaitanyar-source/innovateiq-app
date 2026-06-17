import { createAdminClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

// DocuSeal sends webhooks when documents are signed
// Configure webhook URL in DocuSeal: https://yourdomain.com/api/esign/webhook
export async function POST(request: Request) {
  try {
    const payload = await request.json()
    const { event_type, data } = payload

    if (event_type !== 'submission.completed') {
      return NextResponse.json({ received: true })
    }

    const submissionId = data?.submission?.id?.toString()
    if (!submissionId) return NextResponse.json({ error: 'No submission ID' }, { status: 400 })

    const supabase = await createAdminClient()

    // Find the esign request
    const { data: esignReq } = await supabase
      .from('esign_requests')
      .select('*')
      .eq('docuseal_submission_id', submissionId)
      .single()

    if (!esignReq) return NextResponse.json({ error: 'Request not found' }, { status: 404 })

    // Get signed document URL from webhook payload
    const signedUrl = data?.documents?.[0]?.url || null

    // Update esign request
    await supabase.from('esign_requests').update({
      status: 'signed',
      signed_at: new Date().toISOString(),
      signed_document_url: signedUrl,
    }).eq('id', esignReq.id)

    // Save signed document to documents table
    if (signedUrl) {
      await supabase.from('documents').insert([{
        contractor_id: esignReq.contractor_id,
        client_id: esignReq.client_id,
        engagement_id: esignReq.engagement_id,
        name: `Signed ${esignReq.document_type.toUpperCase()} - ${new Date().toLocaleDateString()}`,
        type: esignReq.document_type,
        file_url: signedUrl,
        status: 'approved',
      }])
    }

    // Notify admin
    const { data: admins } = await supabase
      .from('profiles').select('id').eq('role', 'admin')

    if (admins?.length) {
      await supabase.from('notifications').insert(
        admins.map(a => ({
          user_id: a.id,
          type: 'document_signed',
          title: `${esignReq.document_type.toUpperCase()} signed`,
          body: `${esignReq.sent_to_email} signed the ${esignReq.document_type.toUpperCase()} document.`,
          link: '/admin/documents',
        }))
      )
    }

    // Notify the signer
    if (esignReq.contractor_id) {
      const { data: c } = await supabase
        .from('contractors').select('profile_id').eq('id', esignReq.contractor_id).single()
      if (c) {
        await supabase.from('notifications').insert([{
          user_id: c.profile_id,
          type: 'document_signed',
          title: `${esignReq.document_type.toUpperCase()} signed successfully`,
          body: 'Your signed document is now available in your document vault.',
          link: '/contractor/documents',
        }])
      }
    }

    return NextResponse.json({ success: true })
  } catch (err: any) {
    console.error('Webhook error:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
