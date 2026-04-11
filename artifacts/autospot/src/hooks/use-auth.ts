import { useUser, useClerk, useSignIn, useSignUp } from "@clerk/clerk-react";

export function useAuth() {
  try {
    const { user, isLoaded, isSignedIn } = useUser();
    const { signOut } = useClerk();

    return {
      isLoaded,
      isSignedIn: isSignedIn ?? false,
      user: user
        ? {
            id: user.id,
            name: user.fullName ?? user.firstName ?? "Usuario",
            email: user.primaryEmailAddress?.emailAddress ?? "",
            avatar: user.imageUrl ?? null,
            memberSince: user.createdAt?.toISOString() ?? new Date().toISOString(),
          }
        : null,
      signOut: () => signOut(),
    };
  } catch {
    return {
      isLoaded: true,
      isSignedIn: false,
      user: null,
      signOut: async () => {},
    };
  }
}
