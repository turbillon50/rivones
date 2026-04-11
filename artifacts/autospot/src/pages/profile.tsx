import { useState, useEffect } from "react";
import { useGetUserFavorites } from "@workspace/api-client-react";
import { useAuth } from "@/hooks/use-auth";
import { BottomNav } from "@/components/layout/BottomNav";
import { CarCard, CarCardSkeleton } from "@/components/cars/CarCard";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  IconMoon, IconSun, IconChevronRight, IconFileText, IconUpload,
  IconUser, IconAlertCircle, IconLogOut,
} from "@/components/ui/icons";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Link, useLocation } from "wouter";

export default function Profile() {
  const { user, signOut } = useAuth();
  const { data: favorites, isLoading: favLoading } = useGetUserFavorites();

  const [isDark, setIsDark] = useState(false);
  const [, setLocation] = useLocation();

  useEffect(() => {
    setIsDark(document.documentElement.classList.contains("dark"));
  }, []);

  const toggleTheme = (checked: boolean) => {
    setIsDark(checked);
    if (checked) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("autospot-theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("autospot-theme", "light");
    }
  };

  const handleSignOut = async () => {
    await signOut();
    localStorage.removeItem("autospot-role");
    setLocation("/");
  };

  const memberYear = user?.memberSince
    ? new Date(user.memberSince).getFullYear().toString()
    : "";

  return (
    <div className="min-h-[100dvh] bg-background pb-24">
      <div className="bg-card border-b border-card-border pt-safe">
        <div className="px-4 py-6 flex items-center gap-4">
          <div className="w-20 h-20 rounded-full bg-secondary overflow-hidden shrink-0 border-2 border-primary/20">
            {user?.avatar ? (
              <img src={user.avatar} alt="Perfil" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-primary/10 text-primary">
                <IconUser size={32} />
              </div>
            )}
          </div>
          <div className="flex-1">
            <h1 className="text-2xl font-bold">{user?.name ?? "Mi cuenta"}</h1>
            <p className="text-sm text-muted-foreground mb-1">{user?.email ?? ""}</p>
            <div className="flex gap-2 flex-wrap">
              {memberYear && (
                <span className="text-xs font-medium px-2 py-0.5 bg-secondary rounded-full">
                  Miembro desde {memberYear}
                </span>
              )}
            </div>
          </div>
          <Button variant="ghost" size="icon" className="shrink-0 self-start" onClick={handleSignOut}>
            <IconLogOut size={20} className="text-muted-foreground" />
          </Button>
        </div>
      </div>

      <main className="px-4 py-5 space-y-5">
        {user && (
          <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-2xl p-4 flex items-start gap-3">
            <IconAlertCircle size={18} className="text-amber-600 shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-bold text-amber-800 dark:text-amber-200">Completa tu perfil</p>
              <p className="text-xs text-amber-700 dark:text-amber-300 mt-0.5">Sube tu licencia y documentos para poder hacer reservas</p>
            </div>
            <button
              onClick={() => setLocation("/soporte")}
              className="bg-amber-600 text-white text-xs font-bold px-3 py-1.5 rounded-full hover:bg-amber-700 transition-colors whitespace-nowrap"
            >
              Subir ahora
            </button>
          </div>
        )}

        <div className="bg-card border border-card-border rounded-2xl p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {isDark ? <IconMoon size={20} className="text-primary" /> : <IconSun size={20} className="text-amber-500" />}
            <div>
              <p className="font-semibold text-sm">Tema</p>
              <p className="text-xs text-muted-foreground">{isDark ? "Modo oscuro" : "Modo claro"}</p>
            </div>
          </div>
          <Switch checked={isDark} onCheckedChange={toggleTheme} />
        </div>

        <Tabs defaultValue="favorites">
          <TabsList className="w-full rounded-xl h-11">
            <TabsTrigger value="favorites" className="flex-1 rounded-lg">Guardados</TabsTrigger>
            <TabsTrigger value="account" className="flex-1 rounded-lg">Cuenta</TabsTrigger>
          </TabsList>

          <TabsContent value="favorites" className="mt-4">
            {favLoading ? (
              <div className="space-y-3">
                {Array(2).fill(0).map((_, i) => <CarCardSkeleton key={i} horizontal />)}
              </div>
            ) : favorites && favorites.length > 0 ? (
              <div className="space-y-3">
                {favorites.map((car) => <CarCard key={car.id} car={car} horizontal />)}
              </div>
            ) : (
              <div className="text-center py-10 text-muted-foreground">
                <p className="text-base font-semibold mb-1">Sin favoritos</p>
                <p className="text-sm">Guarda autos para verlos aquí</p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="account" className="mt-4 space-y-2">
            <div className="bg-card border border-border rounded-2xl px-4 py-3 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <IconFileText size={16} className="text-muted-foreground shrink-0" />
                <div>
                  <p className="font-medium text-[13px]">Licencia de conducir</p>
                  <p className="text-[11px] text-muted-foreground">Pendiente de verificación</p>
                </div>
              </div>
              <button onClick={() => setLocation("/soporte")} className="text-primary text-[12px] font-semibold shrink-0">
                Subir
              </button>
            </div>

            <div className="bg-card border border-border rounded-2xl px-4 py-3 flex items-center justify-between" onClick={() => setLocation("/soporte")}>
              <div className="flex items-center gap-3">
                <IconUpload size={16} className="text-muted-foreground shrink-0" />
                <div>
                  <p className="font-medium text-[13px]">Documentos e identidad</p>
                  <p className="text-[11px] text-muted-foreground">Agrega tu INE o pasaporte</p>
                </div>
              </div>
              <IconChevronRight size={16} className="text-muted-foreground" />
            </div>

            <Link href="/user">
              <div className="bg-card border border-border rounded-2xl px-4 py-3 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-muted-foreground shrink-0">
                    <path d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4"/>
                  </svg>
                  <div>
                    <p className="font-medium text-[13px]">Seguridad y passkeys</p>
                    <p className="text-[11px] text-muted-foreground">Contraseña, biometría y llaves</p>
                  </div>
                </div>
                <IconChevronRight size={16} className="text-muted-foreground" />
              </div>
            </Link>

            <div className="bg-card border border-border rounded-2xl px-4 py-3 flex items-center justify-between">
              <div>
                <p className="font-medium text-[13px]">Método de pago</p>
                <p className="text-[11px] text-muted-foreground">Agrega una tarjeta</p>
              </div>
              <IconChevronRight size={16} className="text-muted-foreground" />
            </div>

            <div className="pt-2 pb-1">
              <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider px-1 mb-2">Legal y privacidad</p>
              {[
                { label: "Términos y Condiciones", href: "/terminos" },
                { label: "Política de Privacidad", href: "/privacidad" },
                { label: "Política de Cancelaciones", href: "/cancelaciones" },
                { label: "Soporte y Ayuda", href: "/soporte" },
              ].map((item) => (
                <Link key={item.href} href={item.href}>
                  <div className="flex items-center justify-between px-4 py-3 border-b border-border last:border-none">
                    <p className="text-[13px] font-medium">{item.label}</p>
                    <IconChevronRight size={15} className="text-muted-foreground" />
                  </div>
                </Link>
              ))}
            </div>

            <button
              onClick={handleSignOut}
              className="w-full bg-card border border-red-200 dark:border-red-900 rounded-2xl px-4 py-3 flex items-center justify-center gap-2 mt-1 text-red-600 dark:text-red-400"
            >
              <IconLogOut size={16} />
              <p className="text-[13px] font-semibold">Cerrar sesión</p>
            </button>
          </TabsContent>
        </Tabs>
      </main>

      <BottomNav />
    </div>
  );
}
