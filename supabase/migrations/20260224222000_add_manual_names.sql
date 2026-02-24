-- Add manual name columns to quotations
ALTER TABLE public.quotations ADD COLUMN client_name TEXT;
ALTER TABLE public.quotations ADD COLUMN event_name TEXT;

-- Add manual name columns to invoices
ALTER TABLE public.invoices ADD COLUMN client_name TEXT;
ALTER TABLE public.invoices ADD COLUMN event_name TEXT;

-- Comments for clarity
COMMENT ON COLUMN public.quotations.client_name IS 'Manual text entry for client name';
COMMENT ON COLUMN public.quotations.event_name IS 'Manual text entry for event name';
COMMENT ON COLUMN public.invoices.client_name IS 'Manual text entry for client name';
COMMENT ON COLUMN public.invoices.event_name IS 'Manual text entry for event name';
