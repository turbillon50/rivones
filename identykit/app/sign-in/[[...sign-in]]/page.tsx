"use client";
import { SignIn } from "@clerk/nextjs";
import Image from "next/image";

export default function SignInPage() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-bg">
      <div className="mb-6 flex flex-col items-center gap-1">
        <Image
          src="/logo.png"
          alt="Identy-Kit"
          width={200}
          height={200}
          priority
          style={{ objectFit: "contain" }}
        />
        <p className="text-sm text-gray-400 tracking-widest mt-1">TU IDENTIDAD, SEGURA EN UN QR</p>
      </div>
      <SignIn />
    </main>
  );
}
