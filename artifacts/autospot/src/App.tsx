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
import KycPage from "@/pages/kyc";
import BookingChat from "@/pages/booking-chat";
import TripPickup from "@/pages/trip-pickup";
import TripReturn from "@/pages/trip-return";
import ReviewPage from "@/pages/review";
import HostCalendar from "@/pages/host-calendar";

import { RequireAuth } from "@/components/auth/RequireAuth";
import { ClerkAuthBridge } from "@/components/auth/ClerkAuthBridge";
import { CookieConsent } from "@/components/legal/CookieConsent";

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
      <Route path="/booking/:carId">
        {(params) => <RequireAuth><Booking /></RequireAuth>}
      </Route>
      <Route path="/booking/:bookingId/chat">
        {(params) => <RequireAuth><BookingChat /></RequireAuth>}
      </Route>
      <Route path="/booking/:bookingId/pickup">
        {(params) => <RequireAuth><TripPickup /></RequireAuth>}
      </Route>
      <Route path="/booking/:bookingId/return">
        {(params) => <RequireAuth><TripReturn /></RequireAuth>}
      </Route>
      <Route path="/booking/:bookingId/review">
        {(params) => <RequireAuth><ReviewPage /></RequireAuth>}
      </Route>
      <Route path="/upload">
        {() => <RequireAuth><Upload /></RequireAuth>}
      </Route>
      <Route path="/notifications">
        {() => <RequireAuth><Notifications /></RequireAuth>}
      </Route>
      <Route path="/profile">
        {() => <RequireAuth><Profile /></RequireAuth>}
      </Route>
      <Route path="/kyc">
        {() => <RequireAuth><KycPage /></RequireAuth>}
      </Route>
      <Route path="/host/calendar/:carId">
        {() => <RequireAuth><HostCalendar /></RequireAuth>}
      </Route>
      <Route path="/admin" component={AdminDashboard} />
      <Route path="/sign-in" component={SignInPage} />
      <Route path="/sign-up" component={SignUpPage} />
      <Route path="/onboarding">
        {() => <RequireAuth><Onboarding /></RequireAuth>}
      </Route>
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
      <ClerkAuthBridge />
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <Router />
        </WouterRouter>
        <Toaster />
        <CookieConsent />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
