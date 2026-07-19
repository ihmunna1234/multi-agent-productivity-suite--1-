-- Supabase Schema for Manpower ERP Tool

-- 1. Projects Table
CREATE TABLE IF NOT EXISTS erp_projects (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  client_name TEXT,
  location TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Workers Table
CREATE TABLE IF NOT EXISTS erp_workers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  iqama_no TEXT UNIQUE,
  full_name TEXT NOT NULL,
  arabic_name TEXT,
  nationality TEXT,
  hourly_rate NUMERIC NOT NULL,
  status TEXT DEFAULT 'ACTIVE',
  trade TEXT,
  project_id UUID REFERENCES erp_projects(id) ON DELETE SET NULL,
  bank_name TEXT,
  iban TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Monthly Hours (Timesheets)
CREATE TABLE IF NOT EXISTS erp_monthly_hours (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  worker_id UUID REFERENCES erp_workers(id) ON DELETE CASCADE,
  project_id UUID REFERENCES erp_projects(id) ON DELETE SET NULL,
  year INT NOT NULL,
  month INT NOT NULL,
  total_hours NUMERIC NOT NULL DEFAULT 0,
  overtime_hours NUMERIC NOT NULL DEFAULT 0,
  hourly_rate NUMERIC NOT NULL,
  earned_salary NUMERIC NOT NULL DEFAULT 0,
  allowances NUMERIC DEFAULT 0,
  advance NUMERIC DEFAULT 0,
  deductions NUMERIC DEFAULT 0,
  net_payable NUMERIC NOT NULL DEFAULT 0,
  is_fully_paid BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(worker_id, month, year)
);

-- 4. Payments (Ledger)
CREATE TABLE IF NOT EXISTS erp_payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  worker_id UUID REFERENCES erp_workers(id) ON DELETE CASCADE,
  amount NUMERIC NOT NULL,
  payment_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Documents
CREATE TABLE IF NOT EXISTS erp_documents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  worker_id UUID REFERENCES erp_workers(id) ON DELETE CASCADE,
  doc_type TEXT,
  file_url TEXT,
  expiry_date DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
