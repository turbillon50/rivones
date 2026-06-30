"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function Splash() {
  const router = useRouter();
  useEffect(() => {
    const t = setTimeout(() => router.replace("/"), 2000);
    return () => clearTimeout(t);
  }, [router]);

  return (
    <main style={{ minHeight:"100vh", background:"#ffffff", display:"flex", alignItems:"center", justifyContent:"center" }}>
      <style>{`
        @keyframes splashAnim {
          0% { transform: scale(1.2); opacity: 0; }
          20% { opacity: 1; }
          80% { transform: scale(1); opacity: 1; }
          100% { transform: scale(0.95); opacity: 0; }
        }
        .splash-logo { animation: splashAnim 2s ease-in-out forwards; }
      `}</style>
      <img src="/logo.png" alt="Identy-Kit" className="splash-logo" style={{ width:"220px", height:"220px", objectFit:"contain" }} />
    </main>
  );
}
