"use client";
import { SignIn } from "@clerk/nextjs";

export default function SignInPage() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-bg">
      <div className="mb-8 flex flex-col items-center gap-2">
        <svg viewBox="0 0 512 460" className="w-20 h-20" fill="none">
          <defs>
            <linearGradient id="a" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#4FF0D8"/>
              <stop offset="100%" stopColor="#129488"/>
            </linearGradient>
          </defs>
          <path d="M256 38 L378 76 V206 C378 298 322 358 256 392 C190 358 134 298 134 206 V76 Z"
            fill="#0b0b10" stroke="url(#a)" strokeWidth="12" strokeLinejoin="round"/>
          <path d="M150 260 h40 l14-32 l20 52 l16-78 l16 58 h106"
            fill="none" stroke="#F3FFFC" strokeWidth="9" strokeLinecap="round"/>
        </svg>
        <p className="text-xl font-bold text-accent tracking-widest">IDENTY-KIT</p>
        <p className="text-sm text-gray-400">Tu identidad, segura en un QR</p>
      </div>
      <SignIn />
    </main>
  );
}
