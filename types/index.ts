export type Role = 'contractor' | 'client' | 'admin'
export type SeniorityLevel = 'junior' | 'mid' | 'senior' | 'principal'
export type EngagementType = 'w2' | '1099' | 'c2c' | 'open'
export type DocumentType = 'w9' | 'i9' | 'ica' | 'msa' | 'sow' | 'nda' | 'coi' | 'resume' | 'bgc' | 'other'

export interface Profile {
  id: string
  email: string
  full_name: string | null
  phone: string | null
  role: Role
  avatar_url: string | null
  created_at: string
  updated_at: string
}

export interface Contractor {
  id: string
  profile_id: string
  linkedin_url: string | null
  primary_role: string | null
  years_experience: string | null
  seniority_level: SeniorityLevel | null
  engagement_type: EngagementType | null
  target_rate: number | null
  availability: string | null
  bio: string | null
  resume_url: string | null
  status: 'pending' | 'approved' | 'rejected' | 'inactive'
  skills: string[]
  created_at: string
  updated_at: string
  profile?: Profile
}

export interface Client {
  id: string
  profile_id: string
  company_name: string
  company_size: string | null
  industry: string | null
  website: string | null
  status: 'active' | 'inactive' | 'pending'
  created_at: string
  updated_at: string
  profile?: Profile
}

export interface Job {
  id: string
  client_id: string
  title: string
  description: string
  seniority_level: SeniorityLevel | 'open' | null
  engagement_type: EngagementType | null
  duration: string | null
  start_date: string | null
  budget_range: string | null
  skills_required: string[]
  status: 'open' | 'in_progress' | 'filled' | 'closed'
  created_at: string
  updated_at: string
  client?: Client
}

export interface Application {
  id: string
  job_id: string
  contractor_id: string
  status: 'submitted' | 'reviewing' | 'shortlisted' | 'rejected' | 'hired'
  cover_note: string | null
  proposed_rate: number | null
  created_at: string
  updated_at: string
  job?: Job
  contractor?: Contractor
}

export interface Engagement {
  id: string
  application_id: string | null
  contractor_id: string
  client_id: string
  job_id: string | null
  title: string
  engagement_type: Omit<EngagementType, 'open'> | null
  agreed_rate: number | null
  start_date: string | null
  end_date: string | null
  status: 'pending' | 'active' | 'completed' | 'cancelled'
  notes: string | null
  created_at: string
  updated_at: string
  contractor?: Contractor
  client?: Client
}

export interface Document {
  id: string
  engagement_id: string | null
  contractor_id: string | null
  client_id: string | null
  uploaded_by: string | null
  name: string
  type: DocumentType
  file_url: string
  file_size: number | null
  status: 'pending' | 'approved' | 'rejected' | 'expired'
  expires_at: string | null
  created_at: string
}

export interface Message {
  id: string
  from_id: string
  to_id: string | null
  engagement_id: string | null
  subject: string | null
  body: string
  is_read: boolean
  created_at: string
  from_profile?: Profile
}

export interface ContactSubmission {
  id: string
  name: string
  email: string
  subject: string | null
  message: string
  type: 'general' | 'contractor' | 'client' | 'vendor'
  status: 'new' | 'read' | 'replied' | 'archived'
  created_at: string
}

export interface OnboardingChecklist {
  id: string
  contractor_id: string
  w9_submitted: boolean
  i9_submitted: boolean
  ica_signed: boolean
  id_uploaded: boolean
  nda_signed: boolean
  coi_submitted: boolean
  banking_provided: boolean
  completed_at: string | null
  updated_at: string
}
