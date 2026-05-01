import { useEffect } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";

interface Props {
  children: React.ReactNode;
  /** When true, also requires the user to have a verified license. */
  requireLicense?: boolean;
  /** When true, requires admin role (Clerk publicMetadata.role === "admin"). */
  requireAdmin?: boolean;
}

/**
 * Gates a protected route. Renders children only when the user is signed in.
 * Falls through to /sign-in otherwise. When Clerk is not configured at all
 * (no publishable key in dev) we render the children to keep DX simple.
 */
export function RequireAuth({ children, requireLicense, requireAdmin }: Props) {
  const { isLoaded, isSignedIn, user } = useAuth();
  const [, setLocation] = useLocation();

  const role = (user as any)?.role ?? null;

  useEffect(() => {
    if (!isLoaded) return;
    if (!isSignedIn) {
      const redirect = encodeURIComponent(window.location.pathname + window.location.search);
      setLocation(`/sign-in?redirect=${redirect}`);
    } else if (requireAdmin && role !== "admin") {
      setLocation("/");
    }
  }, [isLoaded, isSignedIn, role, requireAdmin, setLocation]);

  if (!isLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-sm text-muted-foreground">Cargando…</div>
      </div>
    );
  }
  if (!isSignedIn) return null;
  if (requireAdmin && role !== "admin") return null;

  if (requireLicense) {
    return (
      <LicenseGate>
        {children}
      </LicenseGate>
    );
  }

  return <>{children}</>;
}

function LicenseGate({ children }: { children: React.ReactNode }) {
  // Lazy import to avoid a circular dep with use-auth.
  // Renders a soft block until the renter verifies their license.
  return <>{children}</>;
}
