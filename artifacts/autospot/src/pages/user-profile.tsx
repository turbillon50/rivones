import { UserProfile } from "@clerk/clerk-react";
import { useLocation } from "wouter";
import { clerkAppearance } from "@/lib/clerk-appearance";

export default function UserProfilePage() {
  const [, setLocation] = useLocation();

  return (
    <div className="min-h-screen bg-background">
      <div className="sticky top-0 z-30 bg-background/80 backdrop-blur-xl border-b border-border px-4 py-3 flex items-center gap-3">
        <button onClick={() => setLocation("/profile")} className="text-foreground">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 12H5M12 19l-7-7 7-7"/>
          </svg>
        </button>
        <h1 className="text-base font-semibold">Seguridad y cuenta</h1>
      </div>

      <div className="flex justify-center py-6 px-4">
        <UserProfile
          appearance={{
            ...clerkAppearance,
            elements: {
              ...clerkAppearance.elements,
              rootBox: "w-full max-w-lg",
              cardBox: "shadow-none border-none w-full",
              navbar: "hidden",
              pageScrollBox: "p-0",
            },
          }}
        />
      </div>
    </div>
  );
}
