import { useEffect } from "react";
import { useAuth } from "@clerk/clerk-react";
import { setApiTokenGetter } from "@/lib/api";
import { setUploadAuthHeadersGetter } from "@workspace/object-storage-web";
import { setBaseUrl, setAuthTokenGetter } from "@workspace/api-client-react";

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL as string | undefined)?.replace(/\/$/, "") ?? null;

/**
 * Wires Clerk's getToken() into apiFetch + use-upload + the generated Orval
 * client so every /api request includes a Bearer JWT when the user is signed
 * in. Mounted once at the app root.
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
    setBaseUrl(API_BASE_URL);
    setApiTokenGetter(getToken);
    setAuthTokenGetter(getToken);
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
      setAuthTokenGetter(null);
      setUploadAuthHeadersGetter(null);
    };
  }, [getToken]);

  return null;
}
