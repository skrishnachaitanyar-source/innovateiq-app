// DocuSeal integration for ICA, MSA, NDA, SOW e-signatures
// Self-host DocuSeal on Railway (free tier) or use DocuSeal Cloud

const DOCUSEAL_URL = process.env.DOCUSEAL_URL || 'https://api.docuseal.com'
const DOCUSEAL_TOKEN = process.env.DOCUSEAL_API_TOKEN || ''

// Template IDs — set these after creating templates in your DocuSeal instance
const TEMPLATES = {
  ica: process.env.DOCUSEAL_ICA_TEMPLATE_ID || '',
  msa: process.env.DOCUSEAL_MSA_TEMPLATE_ID || '',
  nda: process.env.DOCUSEAL_NDA_TEMPLATE_ID || '',
  sow: process.env.DOCUSEAL_SOW_TEMPLATE_ID || '',
}

export interface SignatureRequest {
  documentType: 'ica' | 'msa' | 'nda' | 'sow'
  signerName: string
  signerEmail: string
  customFields?: Record<string, string>
  completionRedirectUrl?: string
}

export interface SignatureResponse {
  submissionId: string
  signingUrl: string
  status: string
}

export async function createSignatureRequest(req: SignatureRequest): Promise<SignatureResponse> {
  const templateId = TEMPLATES[req.documentType]

  if (!templateId) {
    throw new Error(`No template configured for document type: ${req.documentType}. Add DOCUSEAL_${req.documentType.toUpperCase()}_TEMPLATE_ID to your env vars.`)
  }

  if (!DOCUSEAL_TOKEN) {
    throw new Error('DOCUSEAL_API_TOKEN is not configured.')
  }

  const payload = {
    template_id: parseInt(templateId),
    send_email: true,
    submitters: [
      {
        role: 'First Party',
        name: req.signerName,
        email: req.signerEmail,
        fields: req.customFields
          ? Object.entries(req.customFields).map(([name, default_value]) => ({ name, default_value }))
          : [],
        ...(req.completionRedirectUrl && { completed_redirect_url: req.completionRedirectUrl }),
      },
    ],
  }

  const response = await fetch(`${DOCUSEAL_URL}/submissions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Auth-Token': DOCUSEAL_TOKEN,
    },
    body: JSON.stringify(payload),
  })

  if (!response.ok) {
    const err = await response.text()
    throw new Error(`DocuSeal API error: ${err}`)
  }

  const data = await response.json()
  const submitter = data[0]

  return {
    submissionId: submitter.submission_id?.toString() || data.id?.toString(),
    signingUrl: submitter.embed_src || submitter.signing_url || '',
    status: submitter.status || 'pending',
  }
}

export async function getSubmissionStatus(submissionId: string) {
  if (!DOCUSEAL_TOKEN) throw new Error('DOCUSEAL_API_TOKEN not configured')

  const response = await fetch(`${DOCUSEAL_URL}/submissions/${submissionId}`, {
    headers: { 'X-Auth-Token': DOCUSEAL_TOKEN },
  })

  if (!response.ok) throw new Error('Failed to fetch submission status')
  return response.json()
}

export async function getSignedDocumentUrl(submissionId: string): Promise<string | null> {
  try {
    const data = await getSubmissionStatus(submissionId)
    return data.documents?.[0]?.url || null
  } catch {
    return null
  }
}

// Generate ICA field values from contractor/engagement data
export function icaFields(data: {
  contractorName: string
  contractorEmail: string
  contractorType: string
  role: string
  startDate: string
  rate: string
  clientName?: string
}): Record<string, string> {
  return {
    'Contractor Name': data.contractorName,
    'Contractor Email': data.contractorEmail,
    'Engagement Type': data.contractorType.toUpperCase(),
    'Role / Position': data.role,
    'Start Date': data.startDate,
    'Agreed Rate': `$${data.rate}/hr`,
    'Client Name': data.clientName || 'To be determined',
    'Company Name': 'Innovate IQ LLC',
    'Effective Date': new Date().toLocaleDateString('en-US'),
  }
}

// Generate MSA field values from client data
export function msaFields(data: {
  clientName: string
  clientEmail: string
  companyName: string
}): Record<string, string> {
  return {
    'Client Name': data.clientName,
    'Client Email': data.clientEmail,
    'Company Name': data.companyName,
    'Staffing Company': 'Innovate IQ LLC',
    'Effective Date': new Date().toLocaleDateString('en-US'),
  }
}
