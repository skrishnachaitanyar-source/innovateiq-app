-- ============================================================
-- INNOVATE IQ LLC — SUPABASE DATABASE SCHEMA
-- Run this in Supabase > SQL Editor
-- ============================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ─── PROFILES (extends Supabase auth.users) ────────────────
CREATE TABLE profiles (
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
CREATE TABLE contractors (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  profile_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  linkedin_url TEXT,
  primary_role TEXT,
  years_experience TEXT,
  seniority_level TEXT CHECK (seniority_level IN ('junior', 'mid', 'senior', 'principal')),
  engagement_type TEXT CHECK (engagement_type IN ('w2', '1099', 'c2c', 'open')),
  target_rate NUMERIC,
  availability TEXT,
  bio TEXT,
  resume_url TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'inactive')),
  skills TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── CLIENTS ────────────────────────────────────────────────
CREATE TABLE clients (
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
CREATE TABLE jobs (
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
CREATE TABLE applications (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  job_id UUID REFERENCES jobs(id) ON DELETE CASCADE NOT NULL,
  contractor_id UUID REFERENCES contractors(id) ON DELETE CASCADE NOT NULL,
  status TEXT DEFAULT 'submitted' CHECK (status IN ('submitted', 'reviewing', 'shortlisted', 'rejected', 'hired')),
  cover_note TEXT,
  proposed_rate NUMERIC,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(job_id, contractor_id)
);

-- ─── ENGAGEMENTS ────────────────────────────────────────────
CREATE TABLE engagements (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  application_id UUID REFERENCES applications(id) ON DELETE SET NULL,
  contractor_id UUID REFERENCES contractors(id) ON DELETE CASCADE NOT NULL,
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE NOT NULL,
  job_id UUID REFERENCES jobs(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  engagement_type TEXT CHECK (engagement_type IN ('w2', '1099', 'c2c')),
  agreed_rate NUMERIC,
  start_date DATE,
  end_date DATE,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'completed', 'cancelled')),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── DOCUMENTS ──────────────────────────────────────────────
CREATE TABLE documents (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  engagement_id UUID REFERENCES engagements(id) ON DELETE SET NULL,
  contractor_id UUID REFERENCES contractors(id) ON DELETE SET NULL,
  client_id UUID REFERENCES clients(id) ON DELETE SET NULL,
  uploaded_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('w9','i9','ica','msa','sow','nda','coi','resume','bgc','other')),
  file_url TEXT NOT NULL,
  file_size INTEGER,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'expired')),
  expires_at DATE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── MESSAGES ───────────────────────────────────────────────
CREATE TABLE messages (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  from_id UUID REFERENCES profiles(id) ON DELETE SET NULL NOT NULL,
  to_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  engagement_id UUID REFERENCES engagements(id) ON DELETE SET NULL,
  subject TEXT,
  body TEXT NOT NULL,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── CONTACT SUBMISSIONS ────────────────────────────────────
CREATE TABLE contact_submissions (
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
CREATE TABLE onboarding_checklist (
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

-- ─── UPDATED_AT TRIGGER ─────────────────────────────────────
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_profiles_updated BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_contractors_updated BEFORE UPDATE ON contractors FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_clients_updated BEFORE UPDATE ON clients FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_jobs_updated BEFORE UPDATE ON jobs FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_applications_updated BEFORE UPDATE ON applications FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_engagements_updated BEFORE UPDATE ON engagements FOR EACH ROW EXECUTE FUNCTION update_updated_at();

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

-- Profiles: users see own, admins see all
CREATE POLICY "profiles_own" ON profiles FOR ALL USING (auth.uid() = id);
CREATE POLICY "profiles_admin" ON profiles FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

-- Contractors: own record + admins
CREATE POLICY "contractors_own" ON contractors FOR ALL USING (
  profile_id = auth.uid() OR
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

-- Clients: own record + admins
CREATE POLICY "clients_own" ON clients FOR ALL USING (
  profile_id = auth.uid() OR
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

-- Jobs: clients manage own, contractors/admins can read open ones
CREATE POLICY "jobs_client_manage" ON jobs FOR ALL USING (
  EXISTS (SELECT 1 FROM clients WHERE id = client_id AND profile_id = auth.uid()) OR
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);
CREATE POLICY "jobs_contractor_read" ON jobs FOR SELECT USING (
  status = 'open' AND
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'contractor')
);

-- Applications: contractor owns, client sees for their jobs, admin sees all
CREATE POLICY "applications_access" ON applications FOR ALL USING (
  EXISTS (SELECT 1 FROM contractors WHERE id = contractor_id AND profile_id = auth.uid()) OR
  EXISTS (SELECT 1 FROM jobs j JOIN clients c ON j.client_id = c.id WHERE j.id = job_id AND c.profile_id = auth.uid()) OR
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

-- Engagements: parties involved + admin
CREATE POLICY "engagements_access" ON engagements FOR ALL USING (
  EXISTS (SELECT 1 FROM contractors WHERE id = contractor_id AND profile_id = auth.uid()) OR
  EXISTS (SELECT 1 FROM clients WHERE id = client_id AND profile_id = auth.uid()) OR
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

-- Documents: owner or related party or admin
CREATE POLICY "documents_access" ON documents FOR ALL USING (
  uploaded_by = auth.uid() OR
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

-- Messages: sender or recipient or admin
CREATE POLICY "messages_access" ON messages FOR ALL USING (
  from_id = auth.uid() OR to_id = auth.uid() OR
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

-- Contact submissions: admin only
CREATE POLICY "contact_admin" ON contact_submissions FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);
CREATE POLICY "contact_insert" ON contact_submissions FOR INSERT WITH CHECK (true);

-- Onboarding: own + admin
CREATE POLICY "onboarding_access" ON onboarding_checklist FOR ALL USING (
  EXISTS (SELECT 1 FROM contractors WHERE id = contractor_id AND profile_id = auth.uid()) OR
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

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

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ============================================================
-- PHASE 1 ADDITIONS
-- ============================================================

-- Storage bucket policy (run in Supabase Dashboard > Storage)
-- Create bucket named "documents" with public: false

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
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE esign_requests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "esign_access" ON esign_requests FOR ALL USING (
  EXISTS (SELECT 1 FROM contractors WHERE id = contractor_id AND profile_id = auth.uid()) OR
  EXISTS (SELECT 1 FROM clients WHERE id = client_id AND profile_id = auth.uid()) OR
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
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

ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "notifications_own" ON notifications FOR ALL USING (user_id = auth.uid());

-- ─── SUPABASE STORAGE SETUP ─────────────────────────────────
-- Run these in Supabase Dashboard > SQL Editor after creating
-- a storage bucket named "documents":

-- INSERT INTO storage.buckets (id, name, public) VALUES ('documents', 'documents', false);

-- CREATE POLICY "auth_upload" ON storage.objects FOR INSERT
-- WITH CHECK (bucket_id = 'documents' AND auth.role() = 'authenticated');

-- CREATE POLICY "owner_read" ON storage.objects FOR SELECT
-- USING (bucket_id = 'documents' AND (
--   auth.uid()::text = (storage.foldername(name))[1]
--   OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
-- ));

-- CREATE POLICY "admin_all" ON storage.objects FOR ALL
-- USING (bucket_id = 'documents' AND EXISTS (
--   SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
-- ));
