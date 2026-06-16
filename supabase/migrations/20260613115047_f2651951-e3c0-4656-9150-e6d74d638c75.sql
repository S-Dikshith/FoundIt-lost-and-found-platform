
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='storage' AND tablename='objects' AND policyname='Item images readable') THEN
    CREATE POLICY "Item images readable" ON storage.objects FOR SELECT USING (bucket_id = 'item-images');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='storage' AND tablename='objects' AND policyname='Item images upload own') THEN
    CREATE POLICY "Item images upload own" ON storage.objects FOR INSERT TO authenticated
      WITH CHECK (bucket_id = 'item-images' AND auth.uid()::text = (storage.foldername(name))[1]);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='storage' AND tablename='objects' AND policyname='Item images delete own') THEN
    CREATE POLICY "Item images delete own" ON storage.objects FOR DELETE TO authenticated
      USING (bucket_id = 'item-images' AND auth.uid()::text = (storage.foldername(name))[1]);
  END IF;
END $$;
