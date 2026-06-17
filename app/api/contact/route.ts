import { createClient } from '@/lib/supabase/server'
import { sendContactEmail } from '@/lib/email'
import { NextResponse } from 'next/server'
import { z } from 'zod'

const schema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  subject: z.string().optional(),
  message: z.string().min(10),
  type: z.enum(['general', 'contractor', 'client', 'vendor']).default('general'),
})

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const data = schema.parse(body)
    const supabase = await createClient()

    const { error } = await supabase.from('contact_submissions').insert([data])
    if (error) throw error

    await sendContactEmail(data)

    return NextResponse.json({ success: true })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 })
  }
}
