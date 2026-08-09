-- Storage policies for documentos bucket

-- Ensure bucket exists
INSERT INTO storage.buckets (id, name, public) 
VALUES ('documentos', 'documentos', true)
ON CONFLICT (id) DO NOTHING;

-- Allow all users to select (view) files
CREATE POLICY "documentos_select" ON storage.objects
  FOR SELECT USING (true);

-- Allow all users to insert (upload) files
CREATE POLICY "documentos_insert" ON storage.objects
  FOR INSERT WITH CHECK (true);

-- Allow all users to update files
CREATE POLICY "documentos_update" ON storage.objects
  FOR UPDATE USING (true);

-- Allow all users to delete files
CREATE POLICY "documentos_delete" ON storage.objects
  FOR DELETE USING (true);
