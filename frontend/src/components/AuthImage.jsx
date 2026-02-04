import { useState, useEffect, useRef } from 'react';
import { BASE, getToken } from '../api/client';

/** URL path for serving an upload file (same as backend route). */
const UPLOAD_FILE_PATH = '/api/uploads';

/**
 * Renders an image from a protected upload URL (uses Bearer token).
 */
export function AuthImage({ uploadId, alt = '', className }) {
  const [src, setSrc] = useState(null);
  const [error, setError] = useState(false);
  const objectUrlRef = useRef(null);

  useEffect(() => {
    let cancelled = false;
    const token = getToken();
    fetch(`${BASE}${UPLOAD_FILE_PATH}/${uploadId}/file`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    })
      .then((res) => {
        if (!res.ok) throw new Error('Failed to load image');
        return res.blob();
      })
      .then((blob) => {
        if (cancelled) return;
        if (objectUrlRef.current) URL.revokeObjectURL(objectUrlRef.current);
        objectUrlRef.current = URL.createObjectURL(blob);
        setSrc(objectUrlRef.current);
      })
      .catch(() => {
        if (!cancelled) setError(true);
      });
    return () => {
      cancelled = true;
      if (objectUrlRef.current) {
        URL.revokeObjectURL(objectUrlRef.current);
        objectUrlRef.current = null;
      }
    };
  }, [uploadId]);

  if (error) return <span className="auth-image-error">Image unavailable</span>;
  if (!src) return <span className="auth-image-loading">Loading…</span>;
  return <img src={src} alt={alt} className={className} />;
}
