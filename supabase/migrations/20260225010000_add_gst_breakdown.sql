-- Migration script to split GST into CGST, SGST, and IGST components

-- Add new columns to quotations table
ALTER TABLE public.quotations 
  ADD COLUMN IF NOT EXISTS cgst_percentage numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS sgst_percentage numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS igst_percentage numeric DEFAULT 0;

-- Update existing records to map the old gst_percentage to cgst and sgst assuming a 50/50 split for backward compatibility (optional but safe)
UPDATE public.quotations 
SET 
  cgst_percentage = gst_percentage / 2,
  sgst_percentage = gst_percentage / 2
WHERE gst_percentage > 0;

-- Add new columns to invoices table
ALTER TABLE public.invoices 
  ADD COLUMN IF NOT EXISTS cgst_percentage numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS sgst_percentage numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS igst_percentage numeric DEFAULT 0;

-- Update existing records for invoices
UPDATE public.invoices 
SET 
  cgst_percentage = gst_percentage / 2,
  sgst_percentage = gst_percentage / 2
WHERE gst_percentage > 0;
