import type { Appearance } from "@clerk/types";

const isDark = () => document.documentElement.classList.contains("dark");

export function getClerkAppearance(): Appearance {
  const dark = isDark();
  return {
    variables: {
      colorPrimary: "#00b8d9",
      colorBackground: dark ? "#0f1629" : "#ffffff",
      colorInputBackground: dark ? "#1a2744" : "#f8fafc",
      colorInputText: dark ? "#e2e8f0" : "#0f172a",
      colorText: dark ? "#f1f5f9" : "#0f172a",
      colorTextSecondary: dark ? "#94a3b8" : "#64748b",
      colorDanger: "#ef4444",
      borderRadius: "0.75rem",
      fontFamily: "'Inter', 'SF Pro Display', system-ui, sans-serif",
      fontSize: "15px",
    },
    elements: {
      card: {
        boxShadow: dark
          ? "0 4px 24px 0 rgba(0,0,0,0.3)"
          : "0 4px 24px 0 rgba(0,184,217,0.06), 0 1px 4px 0 rgba(0,0,0,0.06)",
        border: dark ? "1px solid rgba(255,255,255,0.08)" : "1px solid rgba(0,184,217,0.12)",
        borderRadius: "1.25rem",
        padding: "2rem 1.75rem",
        backgroundColor: dark ? "#0f1629" : "#ffffff",
      },
      headerTitle: {
        fontSize: "1.375rem",
        fontWeight: "700",
        letterSpacing: "-0.02em",
      },
      headerSubtitle: {
        fontSize: "0.9rem",
      },
      socialButtonsBlockButton: {
        border: dark ? "1.5px solid rgba(255,255,255,0.12)" : "1.5px solid #e2e8f0",
        borderRadius: "0.75rem",
        fontWeight: "500",
        height: "2.75rem",
        backgroundColor: dark ? "#1a2744" : "transparent",
        transition: "all 0.15s ease",
        "&:hover": {
          borderColor: "#00b8d9",
          backgroundColor: dark ? "#1e2e4a" : "#f0fbff",
        },
      },
      socialButtonsBlockButtonText: {
        fontWeight: "500",
      },
      dividerLine: {
        backgroundColor: dark ? "rgba(255,255,255,0.08)" : "#f1f5f9",
      },
      dividerText: {
        color: "#94a3b8",
        fontSize: "0.8rem",
      },
      formFieldLabel: {
        fontSize: "0.8rem",
        fontWeight: "600",
        textTransform: "uppercase",
        letterSpacing: "0.04em",
      },
      formFieldInput: {
        border: dark ? "1.5px solid rgba(255,255,255,0.12)" : "1.5px solid #e2e8f0",
        borderRadius: "0.75rem",
        height: "2.75rem",
        fontSize: "0.95rem",
        backgroundColor: dark ? "#1a2744" : "#f8fafc",
        color: dark ? "#e2e8f0" : "#0f172a",
        transition: "all 0.15s ease",
        "&:focus": {
          borderColor: "#00b8d9",
          boxShadow: "0 0 0 3px rgba(0,184,217,0.12)",
        },
      },
      formButtonPrimary: {
        background: "linear-gradient(135deg, #00b8d9 0%, #00d4ff 100%)",
        borderRadius: "0.75rem",
        height: "2.875rem",
        fontSize: "0.95rem",
        fontWeight: "600",
        letterSpacing: "0.01em",
        color: "#0f1629",
        boxShadow: "0 4px 12px rgba(0,184,217,0.3)",
        transition: "all 0.2s ease",
        "&:hover": {
          transform: "translateY(-1px)",
          boxShadow: "0 6px 20px rgba(0,184,217,0.4)",
        },
        "&:active": {
          transform: "translateY(0)",
        },
      },
      footerActionLink: {
        color: "#00b8d9",
        fontWeight: "600",
      },
      identityPreviewEditButton: {
        color: "#00b8d9",
      },
      formResendCodeLink: {
        color: "#00b8d9",
      },
      otpCodeFieldInput: {
        border: dark ? "1.5px solid rgba(255,255,255,0.12)" : "1.5px solid #e2e8f0",
        borderRadius: "0.625rem",
        backgroundColor: dark ? "#1a2744" : "#f8fafc",
        "&:focus": {
          borderColor: "#00b8d9",
          boxShadow: "0 0 0 3px rgba(0,184,217,0.12)",
        },
      },
      alertText: {
        fontSize: "0.875rem",
      },
      logoBox: {
        display: "none",
      },
      logoImage: {
        display: "none",
      },
      footer: {
        "& a": {
          color: "#00b8d9",
        },
      },
    },
  };
}

export const clerkAppearance = getClerkAppearance();
