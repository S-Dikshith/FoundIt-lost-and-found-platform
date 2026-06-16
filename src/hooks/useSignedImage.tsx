import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

/**
 * Accepts either a full URL (legacy posts) or a storage path inside the
 * `item-images` bucket and returns a renderable URL. Uses signed URLs so it
 * works even when the bucket is private.
 */
export function useSignedImage(value: string | null | undefined): string | null {
  const [url, setUrl] = useState<string | null>(
    value && /^https?:\/\//i.test(value) ? value : null
  );

  useEffect(() => {
    if (!value) { setUrl(null); return; }
    if (/^https?:\/\//i.test(value)) {
      // Legacy: full URL. Try as-is; if private bucket, also try to extract path and sign.
      setUrl(value);
      const match = value.match(/\/item-images\/(.+)$/);
      if (match) {
        supabase.storage.from("item-images").createSignedUrl(match[1], 60 * 60 * 24 * 7)
          .then(({ data }) => { if (data?.signedUrl) setUrl(data.signedUrl); });
      }
      return;
    }
    let cancelled = false;
    supabase.storage.from("item-images").createSignedUrl(value, 60 * 60 * 24 * 7)
      .then(({ data }) => { if (!cancelled && data?.signedUrl) setUrl(data.signedUrl); });
    return () => { cancelled = true; };
  }, [value]);

  return url;
}
