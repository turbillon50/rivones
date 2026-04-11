import { Link } from "wouter";

export default function NotFound() {
  return (
    <div className="min-h-[100dvh] bg-background flex flex-col items-center justify-center p-6 text-center">
      <div className="w-20 h-20 rounded-full bg-secondary flex items-center justify-center mb-5">
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-muted-foreground">
          <circle cx="12" cy="12" r="10" />
          <path d="M16 16s-1.5-2-4-2-4 2-4 2" />
          <line x1="9" y1="9" x2="9.01" y2="9" />
          <line x1="15" y1="9" x2="15.01" y2="9" />
        </svg>
      </div>
      <h1 className="text-2xl font-black text-foreground mb-2">Página no encontrada</h1>
      <p className="text-sm text-muted-foreground mb-6">La página que buscas no existe o fue movida.</p>
      <Link href="/explore">
        <button className="h-11 px-6 rounded-full bg-primary text-white font-bold text-sm shadow-lg shadow-primary/25">
          Explorar autos
        </button>
      </Link>
    </div>
  );
}
