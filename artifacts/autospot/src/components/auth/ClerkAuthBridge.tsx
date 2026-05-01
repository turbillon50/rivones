import { useEffect } from "react";
import { useAuth } from "@clerk/clerk-react";
import { setApiTokenGetter } from "@/lib/api";
import { setUploadAuthHeadersGetter } from "@workspace/object-storage-web";

/**
 * Wires Clerk's getToken() into apiFetch + use-upload so every request to /api
 * includes a Bearer JWT when the user is signed in. Mounted once at the app root.
 */
export function ClerkAuthBridge() {
  let getToken: (() => Promise<string | null>) | null = null;
  try {
    const auth = useAuth();
    getToken = () => auth.getToken();
  } catch {
    // Clerk provider not mounted (publishable key missing in dev). API calls
    // remain unauthenticated, matching the previous behaviour.
    getToken = null;
  }

  useEffect(() => {
    setApiTokenGetter(getToken);
    setUploadAuthHeadersGetter(getToken
      ? async () => {
          const t = await getToken!();
          const headers: Record<string, string> = {};
          if (t) headers.Authorization = `Bearer ${t}`;
          return headers;
        }
      : null);
    return () => {
      setApiTokenGetter(null);
      setUploadAuthHeadersGetter(null);
    };
  }, [getToken]);

  return null;
}
