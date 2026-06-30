"use client";
import { SignUp } from "@clerk/nextjs";

export default function SignUpPage() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-bg">
      <div className="mb-6 flex flex-col items-center gap-1">
        <img src="/logo.png" alt="Identy-Kit" width="200" height="200" style={{objectFit:"contain"}} />
        <p className="text-sm text-gray-400 tracking-widest mt-1">TU IDENTIDAD, SEGURA EN UN QR</p>
      </div>
      <SignUp />
    </main>
  );
}
