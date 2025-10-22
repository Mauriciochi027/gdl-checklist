-- Create storage bucket for checklist photos
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'checklist-photos',
  'checklist-photos',
  false,
  5242880, -- 5MB limit
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
);

-- Create storage policies for checklist photos
CREATE POLICY "Authenticated users can upload checklist photos"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'checklist-photos' AND
  auth.uid() IS NOT NULL
);

CREATE POLICY "Authenticated users can view checklist photos"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'checklist-photos' AND
  auth.uid() IS NOT NULL
);

CREATE POLICY "Admins can delete checklist photos"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'checklist-photos' AND
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.profile = 'admin'
  )
);

-- Add index for better query performance on large datasets
CREATE INDEX IF NOT EXISTS idx_checklist_records_created_at_desc 
ON checklist_records(created_at DESC);

-- Add index for operator filtering
CREATE INDEX IF NOT EXISTS idx_checklist_records_operator_id 
ON checklist_records(operator_id, created_at DESC);