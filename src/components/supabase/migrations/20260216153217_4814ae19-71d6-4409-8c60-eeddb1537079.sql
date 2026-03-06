
-- Allow anonymous users to upload via shared link
CREATE POLICY "Anonymous can upload invoice attachments"
  ON storage.objects FOR INSERT TO anon
  WITH CHECK (bucket_id = 'invoice-attachments');
