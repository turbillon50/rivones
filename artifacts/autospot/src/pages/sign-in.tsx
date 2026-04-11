import { SignIn } from "@clerk/clerk-react";
import { Link } from "wouter";
import { getClerkAppearance } from "@/lib/clerk-appearance";

export default function SignInPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#f0f4f8] via-white to-[#e8eef5] dark:from-[#0f1629] dark:via-[#131b30] dark:to-[#0f1629] flex flex-col">
      <div className="flex-1 flex flex-col items-center justify-center px-4 py-10">
        <div className="mb-8 text-center">
          <img src="/rivones-logo-nobg.png" alt="Rivones" className="h-16 w-auto mx-auto mb-4 drop-shadow-[0_0_20px_rgba(0,212,255,0.12)]" />
          <p className="text-sm text-muted-foreground mt-1">Renta autos en todo México</p>
        </div>

        <SignIn
          appearance={getClerkAppearance()}
          signUpUrl="/sign-up"
          fallbackRedirectUrl="/explore"
        />
      </div>

      <div className="pb-8 px-6 text-center space-y-3 border-t border-border/40 pt-5">
        <p className="text-xs text-muted-foreground">
          Al iniciar sesión aceptas nuestros{" "}
          <Link href="/terminos" className="underline underline-offset-2 hover:text-primary transition-colors">
            Términos y Condiciones
          </Link>{" "}
          y{" "}
          <Link href="/privacidad" className="underline underline-offset-2 hover:text-primary transition-colors">
            Política de Privacidad
          </Link>
        </p>
        <div className="flex flex-wrap justify-center gap-x-4 gap-y-1 text-[11px] text-muted-foreground/60">
          <Link href="/cancelaciones" className="hover:text-primary transition-colors">Cancelaciones</Link>
          <Link href="/soporte" className="hover:text-primary transition-colors">Soporte</Link>
          <Link href="/eliminar-cuenta" className="hover:text-primary transition-colors">Eliminar cuenta</Link>
        </div>
        <p className="text-[11px] text-muted-foreground/40">© 2025 Rivones · rentamerapido.autos</p>
      </div>
    </div>
  );
}
