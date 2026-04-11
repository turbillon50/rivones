import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useEffect } from "react";
import { useLocation } from "wouter";

import Splash from "@/pages/splash";
import Explore from "@/pages/explore";
import MapView from "@/pages/map";
import CarDetail from "@/pages/car-detail";
import Booking from "@/pages/booking";
import Upload from "@/pages/upload";
import Notifications from "@/pages/notifications";
import Profile from "@/pages/profile";
import AdminDashboard from "@/pages/admin";
import Terminos from "@/pages/terminos";
import Privacidad from "@/pages/privacidad";
import Cancelaciones from "@/pages/cancelaciones";
import Soporte from "@/pages/soporte";
import EliminarCuenta from "@/pages/eliminar-cuenta";
import SignInPage from "@/pages/sign-in";
import SignUpPage from "@/pages/sign-up";
import Onboarding from "@/pages/onboarding";
import Guia from "@/pages/guia";
import GuiaRegistro from "@/pages/guia-registro";
import RoutePlanner from "@/pages/route-planner";
import UserProfilePage from "@/pages/user-profile";
import NotFound from "@/pages/not-found";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      staleTime: 1000 * 60 * 5,
    }
  }
});

function SplashRedirector() {
  const [_, setLocation] = useLocation();

  useEffect(() => {
    const timer = setTimeout(() => {
      setLocation("/explore");
    }, 2500);
    return () => clearTimeout(timer);
  }, [setLocation]);

  return <Splash />;
}

function Router() {
  return (
    <Switch>
      <Route path="/" component={SplashRedirector} />
      <Route path="/explore" component={Explore} />
      <Route path="/map" component={MapView} />
      <Route path="/car/:id" component={CarDetail} />
      <Route path="/booking/:carId" component={Booking} />
      <Route path="/upload" component={Upload} />
      <Route path="/notifications" component={Notifications} />
      <Route path="/profile" component={Profile} />
      <Route path="/admin" component={AdminDashboard} />
      <Route path="/sign-in" component={SignInPage} />
      <Route path="/sign-up" component={SignUpPage} />
      <Route path="/onboarding" component={Onboarding} />
      <Route path="/terminos" component={Terminos} />
      <Route path="/privacidad" component={Privacidad} />
      <Route path="/cancelaciones" component={Cancelaciones} />
      <Route path="/soporte" component={Soporte} />
      <Route path="/eliminar-cuenta" component={EliminarCuenta} />
      <Route path="/guia" component={Guia} />
      <Route path="/guia/registro" component={GuiaRegistro} />
      <Route path="/planear-ruta" component={RoutePlanner} />
      <Route path="/user" component={UserProfilePage} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  useEffect(() => {
    const saved = localStorage.getItem("autospot-theme");
    if (saved === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <Router />
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
