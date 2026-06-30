"use client";
import { SignUp } from "@clerk/nextjs";

const appearance = {
  variables: {
    colorPrimary: "#0D47A1",
    colorBackground: "#ffffff",
    colorText: "#1a1a2e",
    colorTextSecondary: "#6b7280",
    borderRadius: "12px",
    fontFamily: "system-ui, -apple-system, sans-serif",
    fontSize: "16px",
  },
  elements: {
    rootBox: { width: "100%" },
    card: { boxShadow: "0 4px 24px rgba(0,0,0,0.08)", border: "1px solid #e5e7eb", borderRadius: "16px" },
    headerTitle: { color: "#0D47A1", fontSize: "22px", fontWeight: "700" },
    headerSubtitle: { color: "#6b7280" },
    formButtonPrimary: { backgroundColor: "#0D47A1", borderRadius: "10px", fontWeight: "600", fontSize: "16px" },
    formFieldInput: { borderRadius: "10px", borderColor: "#d1d5db", fontSize: "16px" },
    formFieldLabel: { color: "#374151", fontWeight: "500" },
    footerActionLink: { color: "#0D47A1", fontWeight: "600" },
  }
};

export default function SignUpPage() {
  return (
    <main style={{ minHeight:"100vh", background:"#f0f4ff", display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", padding:"24px" }}>
      <div style={{ marginBottom:"32px", display:"flex", flexDirection:"column", alignItems:"center", gap:"8px" }}>
        <img src="/logo.png" alt="Identy-Kit" style={{ width:"160px", height:"160px", objectFit:"contain" }} />
        <p style={{ color:"#0D47A1", fontSize:"13px", letterSpacing:"2px", fontWeight:"500", textAlign:"center" }}>TU IDENTIDAD, SEGURA EN UN QR</p>
      </div>
      <div style={{ width:"100%", maxWidth:"400px" }}>
        <SignUp appearance={appearance} />
      </div>
    </main>
  );
}
