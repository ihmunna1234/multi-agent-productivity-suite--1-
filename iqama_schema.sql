-- Supabase Schema for Iqama Data Extractor

CREATE TABLE IF NOT EXISTS iqama_records (
  id TEXT PRIMARY KEY,
  iqama_no TEXT UNIQUE,
  name TEXT,
  name_arabic TEXT,
  expiry_date TEXT,
  dob TEXT,
  nationality TEXT,
  nationality_arabic TEXT,
  occupation TEXT,
  supplier_name TEXT,
  establishment_name TEXT,
  establishment_no TEXT,
  category TEXT,
  extracted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for fast lookup by Iqama number and Category
CREATE INDEX IF NOT EXISTS idx_iqama_records_no ON iqama_records(iqama_no);
CREATE INDEX IF NOT EXISTS idx_iqama_records_category ON iqama_records(category);
