import { createRoot } from "react-dom/client";
import { ClerkProvider } from "@clerk/clerk-react";
import { esMX } from "@clerk/localizations";
import App from "./App";
import "./index.css";

// Production detection: explicit env wins; falls back to MODE === "production".
// Set VITE_PRODUCTION_HOST in Vercel for the production build to pick the
// live Clerk publishable key.
const productionHost = import.meta.env.VITE_PRODUCTION_HOST as string | undefined;
const isProduction =
  (productionHost && (window.location.hostname === productionHost || window.location.hostname.endsWith(`.${productionHost}`)))
  || (!productionHost && import.meta.env.PROD);

const PUBLISHABLE_KEY = (isProduction
  ? import.meta.env.VITE_CLERK_LIVE_PUBLISHABLE_KEY
  : import.meta.env.VITE_CLERK_PUBLISHABLE_KEY
) as string | undefined;

const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

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
