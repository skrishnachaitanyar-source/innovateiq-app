-- ============================================================
-- INNOVATE IQ LLC — SUPABASE DATABASE SCHEMA
-- Run this in Supabase > SQL Editor
-- Idempotent: safe to re-run on an existing database
-- ============================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ─── PROFILES (extends Supabase auth.users) ────────────────
CREATE TABLE IF NOT EXISTS profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT NOT NULL,
  full_name TEXT,
  phone TEXT,
  role TEXT NOT NULL DEFAULT 'contractor' CHECK (role IN ('contractor', 'client', 'admin')),
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── CONTRACTORS ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS contractors (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  profile_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  linkedin_url TEXT,
  primary_role TEXT,
  years_experience TEXT,
  seniority_level TEXT CHECK (seniority_level IN ('junior', 'mid', 'senior', 'principal')),
  engagement_type TEXT CHECK (engagement_type IN ('w2', '1099', 'c2c', 'open')),
  target_rate NUMERIC CHECK (target_rate IS NULL OR target_rate > 0),
  availability TEXT,
  bio TEXT,
  resume_url TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'inactive')),
  skills TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── CLIENTS ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS clients (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  profile_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  company_name TEXT NOT NULL,
  company_size TEXT,
  industry TEXT,
  website TEXT,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'pending')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── JOBS ───────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS jobs (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  seniority_level TEXT CHECK (seniority_level IN ('junior', 'mid', 'senior', 'principal', 'open')),
  engagement_type TEXT CHECK (engagement_type IN ('w2', '1099', 'c2c', 'open')),
  duration TEXT,
  start_date DATE,
  budget_range TEXT,
  skills_required TEXT[] DEFAULT '{}',
  status TEXT DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'filled', 'closed')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── APPLICATIONS ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS applications (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  job_id UUID REFERENCES jobs(id) ON DELETE CASCADE NOT NULL,
  contractor_id UUID REFERENCES contractors(id) ON DELETE CASCADE NOT NULL,
  status TEXT DEFAULT 'submitted' CHECK (status IN ('submitted', 'reviewing', 'shortlisted', 'rejected', 'hired')),
  cover_note TEXT,
  proposed_rate NUMERIC CHECK (proposed_rate IS NULL OR proposed_rate > 0),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(job_id, contractor_id)
);

-- ─── ENGAGEMENTS ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS engagements (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  application_id UUID REFERENCES applications(id) ON DELETE SET NULL,
  contractor_id UUID REFERENCES contractors(id) ON DELETE CASCADE NOT NULL,
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE NOT NULL,
  job_id UUID REFERENCES jobs(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  engagement_type TEXT CHECK (engagement_type IN ('w2', '1099', 'c2c')),
  agreed_rate NUMERIC CHECK (agreed_rate IS NULL OR agreed_rate > 0),
  start_date DATE,
  end_date DATE,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'completed', 'cancelled')),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── DOCUMENTS ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS documents (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  engagement_id UUID REFERENCES engagements(id) ON DELETE CASCADE,
  contractor_id UUID REFERENCES contractors(id) ON DELETE CASCADE,
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
  uploaded_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('w9','i9','ica','msa','sow','nda','coi','resume','bgc','other')),
  file_url TEXT NOT NULL,
  file_size INTEGER CHECK (file_size > 0),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'expired')),
  expires_at DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── MESSAGES ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS messages (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  from_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  to_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  engagement_id UUID REFERENCES engagements(id) ON DELETE SET NULL,
  subject TEXT,
  body TEXT NOT NULL,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── CONTACT SUBMISSIONS ────────────────────────────────────
CREATE TABLE IF NOT EXISTS contact_submissions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  subject TEXT,
  message TEXT NOT NULL,
  type TEXT DEFAULT 'general' CHECK (type IN ('general', 'contractor', 'client', 'vendor')),
  status TEXT DEFAULT 'new' CHECK (status IN ('new', 'read', 'replied', 'archived')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── ONBOARDING CHECKLIST ───────────────────────────────────
CREATE TABLE IF NOT EXISTS onboarding_checklist (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  contractor_id UUID REFERENCES contractors(id) ON DELETE CASCADE NOT NULL,
  w9_submitted BOOLEAN DEFAULT FALSE,
  i9_submitted BOOLEAN DEFAULT FALSE,
  ica_signed BOOLEAN DEFAULT FALSE,
  id_uploaded BOOLEAN DEFAULT FALSE,
  nda_signed BOOLEAN DEFAULT FALSE,
  coi_submitted BOOLEAN DEFAULT FALSE,
  banking_provided BOOLEAN DEFAULT FALSE,
  completed_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(contractor_id)
);

-- ─── ESIGNATURE REQUESTS ────────────────────────────────────
CREATE TABLE IF NOT EXISTS esign_requests (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  contractor_id UUID REFERENCES contractors(id) ON DELETE CASCADE,
  client_id UUID REFERENCES clients(id) ON DELETE SET NULL,
  engagement_id UUID REFERENCES engagements(id) ON DELETE SET NULL,
  document_type TEXT NOT NULL CHECK (document_type IN ('ica','msa','nda','sow')),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending','sent','signed','declined','expired')),
  docuseal_submission_id TEXT,
  signed_document_url TEXT,
  sent_to_email TEXT NOT NULL,
  sent_at TIMESTAMPTZ,
  signed_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── NOTIFICATIONS ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS notifications (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  body TEXT,
  link TEXT,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── UPDATED_AT TRIGGER FUNCTION ────────────────────────────
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_profiles_updated ON profiles;
CREATE TRIGGER trg_profiles_updated BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS trg_contractors_updated ON contractors;
CREATE TRIGGER trg_contractors_updated BEFORE UPDATE ON contractors FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS trg_clients_updated ON clients;
CREATE TRIGGER trg_clients_updated BEFORE UPDATE ON clients FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS trg_jobs_updated ON jobs;
CREATE TRIGGER trg_jobs_updated BEFORE UPDATE ON jobs FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS trg_applications_updated ON applications;
CREATE TRIGGER trg_applications_updated BEFORE UPDATE ON applications FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS trg_engagements_updated ON engagements;
CREATE TRIGGER trg_engagements_updated BEFORE UPDATE ON engagements FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS trg_documents_updated ON documents;
CREATE TRIGGER trg_documents_updated BEFORE UPDATE ON documents FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS trg_messages_updated ON messages;
CREATE TRIGGER trg_messages_updated BEFORE UPDATE ON messages FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS trg_onboarding_updated ON onboarding_checklist;
CREATE TRIGGER trg_onboarding_updated BEFORE UPDATE ON onboarding_checklist FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS trg_esign_updated ON esign_requests;
CREATE TRIGGER trg_esign_updated BEFORE UPDATE ON esign_requests FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ─── ROW LEVEL SECURITY ─────────────────────────────────────
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE contractors ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE engagements ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE contact_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE onboarding_checklist ENABLE ROW LEVEL SECURITY;
ALTER TABLE esign_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Profiles: users see own, admins see all
DROP POLICY IF EXISTS "profiles_own" ON profiles;
CREATE POLICY "profiles_own" ON profiles FOR ALL USING (auth.uid() = id);

DROP POLICY IF EXISTS "profiles_admin" ON profiles;
CREATE POLICY "profiles_admin" ON profiles FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

-- Contractors: own record + admins
DROP POLICY IF EXISTS "contractors_own" ON contractors;
CREATE POLICY "contractors_own" ON contractors FOR ALL USING (
  profile_id = auth.uid() OR
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

-- Clients: own record + admins
DROP POLICY IF EXISTS "clients_own" ON clients;
CREATE POLICY "clients_own" ON clients FOR ALL USING (
  profile_id = auth.uid() OR
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

-- Jobs: clients manage own, contractors/admins can read open ones
DROP POLICY IF EXISTS "jobs_client_manage" ON jobs;
CREATE POLICY "jobs_client_manage" ON jobs FOR ALL USING (
  EXISTS (SELECT 1 FROM clients WHERE id = client_id AND profile_id = auth.uid()) OR
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

DROP POLICY IF EXISTS "jobs_contractor_read" ON jobs;
CREATE POLICY "jobs_contractor_read" ON jobs FOR SELECT USING (
  status = 'open' AND
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'contractor')
);

-- Applications: contractor owns, client sees for their jobs, admin sees all
DROP POLICY IF EXISTS "applications_access" ON applications;
CREATE POLICY "applications_access" ON applications FOR ALL USING (
  EXISTS (SELECT 1 FROM contractors WHERE id = contractor_id AND profile_id = auth.uid()) OR
  EXISTS (SELECT 1 FROM jobs j JOIN clients c ON j.client_id = c.id WHERE j.id = job_id AND c.profile_id = auth.uid()) OR
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

-- Engagements: parties involved + admin
DROP POLICY IF EXISTS "engagements_access" ON engagements;
CREATE POLICY "engagements_access" ON engagements FOR ALL USING (
  EXISTS (SELECT 1 FROM contractors WHERE id = contractor_id AND profile_id = auth.uid()) OR
  EXISTS (SELECT 1 FROM clients WHERE id = client_id AND profile_id = auth.uid()) OR
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

-- Documents: owner, related parties (contractor/client/engagement), or admin
DROP POLICY IF EXISTS "documents_access" ON documents;
CREATE POLICY "documents_access" ON documents FOR ALL USING (
  uploaded_by = auth.uid() OR
  EXISTS (SELECT 1 FROM contractors WHERE id = contractor_id AND profile_id = auth.uid()) OR
  EXISTS (SELECT 1 FROM clients WHERE id = client_id AND profile_id = auth.uid()) OR
  EXISTS (SELECT 1 FROM engagements e WHERE e.id = engagement_id AND (
    e.contractor_id IN (SELECT id FROM contractors WHERE profile_id = auth.uid()) OR
    e.client_id IN (SELECT id FROM clients WHERE profile_id = auth.uid())
  )) OR
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

-- Messages: sender or recipient or admin
DROP POLICY IF EXISTS "messages_access" ON messages;
CREATE POLICY "messages_access" ON messages FOR ALL USING (
  from_id = auth.uid() OR to_id = auth.uid() OR
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

-- Contact submissions: admin only (with open insert)
DROP POLICY IF EXISTS "contact_admin" ON contact_submissions;
CREATE POLICY "contact_admin" ON contact_submissions FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

DROP POLICY IF EXISTS "contact_insert" ON contact_submissions;
CREATE POLICY "contact_insert" ON contact_submissions FOR INSERT WITH CHECK (true);

-- Onboarding: own + admin
DROP POLICY IF EXISTS "onboarding_access" ON onboarding_checklist;
CREATE POLICY "onboarding_access" ON onboarding_checklist FOR ALL USING (
  EXISTS (SELECT 1 FROM contractors WHERE id = contractor_id AND profile_id = auth.uid()) OR
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

-- Esign requests: contractor, client, or admin
DROP POLICY IF EXISTS "esign_access" ON esign_requests;
CREATE POLICY "esign_access" ON esign_requests FOR ALL USING (
  EXISTS (SELECT 1 FROM contractors WHERE id = contractor_id AND profile_id = auth.uid()) OR
  EXISTS (SELECT 1 FROM clients WHERE id = client_id AND profile_id = auth.uid()) OR
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

-- Notifications: own only
DROP POLICY IF EXISTS "notifications_own" ON notifications;
CREATE POLICY "notifications_own" ON notifications FOR ALL USING (user_id = auth.uid());

-- ─── AUTO CREATE PROFILE ON SIGNUP ──────────────────────────
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, email, full_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'role', 'contractor')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ─── PERFORMANCE INDEXES ───────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_contractors_profile_id ON contractors(profile_id);
CREATE INDEX IF NOT EXISTS idx_contractors_status ON contractors(status);
CREATE INDEX IF NOT EXISTS idx_clients_profile_id ON clients(profile_id);
CREATE INDEX IF NOT EXISTS idx_jobs_client_id ON jobs(client_id);
CREATE INDEX IF NOT EXISTS idx_jobs_status ON jobs(status);
CREATE INDEX IF NOT EXISTS idx_applications_job_id ON applications(job_id);
CREATE INDEX IF NOT EXISTS idx_applications_contractor_id ON applications(contractor_id);
CREATE INDEX IF NOT EXISTS idx_engagements_contractor_id ON engagements(contractor_id);
CREATE INDEX IF NOT EXISTS idx_engagements_client_id ON engagements(client_id);
CREATE INDEX IF NOT EXISTS idx_documents_contractor_id ON documents(contractor_id);
CREATE INDEX IF NOT EXISTS idx_documents_engagement_id ON documents(engagement_id);
CREATE INDEX IF NOT EXISTS idx_documents_status ON documents(status);
CREATE INDEX IF NOT EXISTS idx_messages_from_id ON messages(from_id);
CREATE INDEX IF NOT EXISTS idx_messages_to_id ON messages(to_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_onboarding_contractor_id ON onboarding_checklist(contractor_id);

-- ─── SUPABASE STORAGE SETUP ─────────────────────────────────
-- Run these in Supabase Dashboard > SQL Editor after creating
-- a storage bucket named "documents":

-- INSERT INTO storage.buckets (id, name, public) VALUES ('documents', 'documents', false)
-- ON CONFLICT (id) DO NOTHING;

-- CREATE POLICY "auth_upload" ON storage.objects FOR INSERT
-- WITH CHECK (bucket_id = 'documents' AND auth.role() = 'authenticated');

-- CREATE POLICY "owner_read" ON storage.objects FOR SELECT
-- USING (bucket_id = 'documents' AND auth.uid()::text = (storage.foldername(name))[1])
-- OR (bucket_id = 'documents' AND EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

-- CREATE POLICY "admin_all" ON storage.objects FOR ALL
-- USING (bucket_id = 'documents' AND EXISTS (
--   SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
-- ));
