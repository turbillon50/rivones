"use client";
import { SignIn } from "@clerk/nextjs";

const appearance = {
  variables: {
    colorPrimary: "#1FD1B8",
    colorBackground: "#0d0d14",
    colorInputBackground: "#1a1a2e",
    colorInputText: "#ffffff",
    colorText: "#ffffff",
    colorTextSecondary: "#9ca3af",
    borderRadius: "12px",
    fontFamily: "system-ui, sans-serif",
  },
  elements: {
    card: "bg-transparent shadow-none border-0",
    headerTitle: "text-white text-2xl font-bold",
    headerSubtitle: "text-gray-400",
    formButtonPrimary: "bg-[#1FD1B8] hover:bg-[#149D90] text-black font-bold rounded-xl",
    formFieldInput: "bg-white/10 border border-white/20 text-white rounded-xl focus:border-[#1FD1B8]",
    formFieldLabel: "text-gray-300",
    footerActionLink: "text-[#1FD1B8] hover:text-[#4FF0D8]",
    dividerLine: "bg-white/20",
    dividerText: "text-gray-500",
    identityPreviewText: "text-white",
    identityPreviewEditButton: "text-[#1FD1B8]",
    rootBox: "w-full",
    card__main: "bg-transparent",
  }
};

export default function SignInPage() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-bg px-4">
      <div className="mb-8 flex flex-col items-center">
        <img
          src="/logo.png"
          alt="Identy-Kit"
          width="180"
          height="180"
          style={{ objectFit:"contain", mixBlendMode:"screen", filter:"drop-shadow(0 0 20px rgba(31,209,184,0.4))" }}
        />
      </div>
      <div className="w-full max-w-sm glass rounded-2xl p-1">
        <SignIn appearance={appearance} />
      </div>
    </main>
  );
}
