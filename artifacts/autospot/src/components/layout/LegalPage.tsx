import { useLocation } from "wouter";
import { IconArrowLeft } from "@/components/ui/icons";

interface LegalPageProps {
  title: string;
  lastUpdated: string;
  children: React.ReactNode;
}

export function LegalPage({ title, lastUpdated, children }: LegalPageProps) {
  const [, setLocation] = useLocation();

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-40 bg-background/95 backdrop-blur-xl border-b border-border">
        <div className="flex items-center gap-3 px-4 h-14">
          <button
            onClick={() => setLocation("/profile")}
            className="flex items-center justify-center w-9 h-9 rounded-full hover:bg-secondary transition-colors"
          >
            <IconArrowLeft size={20} />
          </button>
          <h1 className="font-bold text-base leading-tight line-clamp-1">{title}</h1>
        </div>
      </header>

      <main className="px-4 py-6 max-w-2xl mx-auto pb-12">
        <p className="text-xs text-muted-foreground mb-6">Última actualización: {lastUpdated}</p>
        <div className="prose prose-sm dark:prose-invert max-w-none space-y-6">
          {children}
        </div>
      </main>
    </div>
  );
}

export function LegalSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="text-base font-bold text-foreground mb-2">{title}</h2>
      <div className="text-sm text-muted-foreground space-y-2 leading-relaxed">{children}</div>
    </section>
  );
}
