-- Migration: Add financial_data column to leads table for pre-approval applications
-- This allows storing detailed financial information as JSON

-- Add financial_data column (TEXT to store JSON)
ALTER TABLE leads ADD COLUMN financial_data TEXT;

-- Add index for faster querying of pre-approval leads
CREATE INDEX IF NOT EXISTS idx_leads_inquiry_type ON leads(inquiry_type);

-- Update existing pre-approval leads (if any) to have proper type
UPDATE leads SET inquiry_type = 'pre-approval' WHERE inquiry_type = 'financing';
