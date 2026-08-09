-- Storage policies for documentos-rh bucket (usado pelo onboarding)
INSERT INTO storage.buckets (id, name, public)
VALUES ('documentos-rh', 'documentos-rh', true)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "documentos_rh_select" ON storage.objects;
CREATE POLICY "documentos_rh_select" ON storage.objects
  FOR SELECT USING (bucket_id = 'documentos-rh');

DROP POLICY IF EXISTS "documentos_rh_insert" ON storage.objects;
CREATE POLICY "documentos_rh_insert" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'documentos-rh');

DROP POLICY IF EXISTS "documentos_rh_update" ON storage.objects;
CREATE POLICY "documentos_rh_update" ON storage.objects
  FOR UPDATE USING (bucket_id = 'documentos-rh');

DROP POLICY IF EXISTS "documentos_rh_delete" ON storage.objects;
CREATE POLICY "documentos_rh_delete" ON storage.objects
  FOR DELETE USING (bucket_id = 'documentos-rh');
