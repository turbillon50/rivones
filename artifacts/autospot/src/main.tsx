import { createRoot } from "react-dom/client";
import { ClerkProvider } from "@clerk/clerk-react";
import { esMX } from "@clerk/localizations";
import { setBaseUrl } from "@workspace/api-client-react";
import App from "./App";
import "./index.css";

const isProduction = window.location.hostname === "rentamerapido.autos" || window.location.hostname.endsWith(".rentamerapido.autos");
const PUBLISHABLE_KEY = (isProduction
  ? import.meta.env.VITE_CLERK_LIVE_PUBLISHABLE_KEY
  : import.meta.env.VITE_CLERK_PUBLISHABLE_KEY
) as string | undefined;

const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

// Wire api-client-react to the backend api-server. When VITE_API_URL is set,
// use it; otherwise fall back to same-origin (dev / co-deployed scenarios).
const API_URL = (import.meta.env.VITE_API_URL as string | undefined)?.replace(/\/+$/, "");
if (API_URL) {
  setBaseUrl(API_URL);
}

function Root() {
  if (!PUBLISHABLE_KEY) {
    return <App />;
  }
  return (
    <ClerkProvider
      publishableKey={PUBLISHABLE_KEY}
      localization={esMX}
      signInUrl={`${BASE}/sign-in`}
      signUpUrl={`${BASE}/sign-up`}
      afterSignOutUrl={`${BASE}/`}
    >
      <App />
    </ClerkProvider>
  );
}

createRoot(document.getElementById("root")!).render(<Root />);
