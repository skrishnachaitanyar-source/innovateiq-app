import { createClient } from '@/lib/supabase/server'
import { sendDocumentNotification } from '@/lib/email'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const formData = await request.formData()
    const file = formData.get('file') as File
    const docType = formData.get('type') as string
    const contractorId = formData.get('contractor_id') as string | null
    const clientId = formData.get('client_id') as string | null
    const engagementId = formData.get('engagement_id') as string | null

    if (!file || !docType) {
      return NextResponse.json({ error: 'File and type are required' }, { status: 400 })
    }

    // Validate file size (10MB max)
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json({ error: 'File too large. Max 10MB.' }, { status: 400 })
    }

    // Validate file type
    const allowed = ['application/pdf', 'image/jpeg', 'image/png', 'image/webp']
    if (!allowed.includes(file.type)) {
      return NextResponse.json({ error: 'Only PDF, JPG, PNG files allowed.' }, { status: 400 })
    }

    // Build storage path: userId/docType/timestamp-filename
    const ext = file.name.split('.').pop()
    const fileName = `${Date.now()}-${docType}.${ext}`
    const storagePath = `${user.id}/${docType}/${fileName}`

    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    // Upload to Supabase Storage
    const { error: uploadError } = await supabase.storage
      .from('documents')
      .upload(storagePath, buffer, {
        contentType: file.type,
        upsert: false,
      })

    if (uploadError) throw uploadError

    // Get signed URL (valid 1 year)
    const { data: signedUrl } = await supabase.storage
      .from('documents')
      .createSignedUrl(storagePath, 60 * 60 * 24 * 365)

    // Save document record to DB
    const { data: doc, error: dbError } = await supabase
      .from('documents')
      .insert([{
        contractor_id: contractorId || null,
        client_id: clientId || null,
        engagement_id: engagementId || null,
        uploaded_by: user.id,
        name: file.name,
        type: docType,
        file_url: signedUrl?.signedUrl || storagePath,
        file_size: file.size,
        status: 'pending',
      }])
      .select()
      .single()

    if (dbError) throw dbError

    // Get uploader name for notification
    const { data: profile } = await supabase
      .from('profiles')
      .select('full_name')
      .eq('id', user.id)
      .single()

    // Notify admin via email
    await sendDocumentNotification({
      uploaderName: profile?.full_name || user.email || 'User',
      docType,
    })

    // Create in-app notification for admin
    const { data: adminProfiles } = await supabase
      .from('profiles')
      .select('id')
      .eq('role', 'admin')

    if (adminProfiles?.length) {
      await supabase.from('notifications').insert(
        adminProfiles.map(a => ({
          user_id: a.id,
          type: 'document_upload',
          title: 'New document uploaded',
          body: `${profile?.full_name || 'A user'} uploaded a ${docType.toUpperCase()} document`,
          link: '/admin/documents',
        }))
      )
    }

    return NextResponse.json({ success: true, document: doc })
  } catch (err: any) {
    console.error('Upload error:', err)
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

    let query = supabase.from('documents').select('*').order('created_at', { ascending: false })

    if (contractorId) query = query.eq('contractor_id', contractorId)
    if (clientId) query = query.eq('client_id', clientId)

    const { data, error } = await query
    if (error) throw error

    return NextResponse.json({ documents: data })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
