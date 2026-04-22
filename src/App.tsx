import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, useLocation } from "react-router-dom";
import { AnimatePresence } from "framer-motion";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Welcome from "./pages/Welcome";
import Home from "./pages/Home";
import Auth from "./pages/Auth";
import InPark from "./pages/InPark";
import EditItinerary from "./pages/EditItinerary";
import Upgrades from "./pages/Upgrades";
import JoyReport from "./pages/JoyReport";
import PlanWizard from "./pages/PlanWizard";
import Settings from "./pages/Settings";
import NotFound from "./pages/NotFound";
import BookLightningLane from "./pages/BookLightningLane";
import { CompanionProvider } from "./contexts/CompanionContext";
import { JoyEventsProvider } from "./contexts/JoyEventsContext";
import { CelebrationProvider } from "./contexts/CelebrationContext";
import RouteTransition from "./components/layout/RouteTransition";

const queryClient = new QueryClient();

/**
 * Routes wrapped in AnimatePresence so each navigation gets a soft cross-fade
 * instead of a hard cut. Keyed on `location.pathname` so framer can reconcile
 * exit/enter cleanly.
 */
const AnimatedRoutes = () => {
  const location = useLocation();
  return (
    <AnimatePresence mode="wait" initial={false}>
      <Routes location={location} key={location.pathname}>
        <Route path="/" element={<RouteTransition><Welcome /></RouteTransition>} />
        <Route path="/home" element={<RouteTransition><Home /></RouteTransition>} />
        <Route path="/auth" element={<RouteTransition><Auth /></RouteTransition>} />
        <Route path="/park" element={<RouteTransition><InPark /></RouteTransition>} />
        <Route path="/edit-itinerary" element={<RouteTransition><EditItinerary /></RouteTransition>} />
        <Route path="/upgrades" element={<RouteTransition><Upgrades /></RouteTransition>} />
        <Route path="/joy-report" element={<RouteTransition><JoyReport /></RouteTransition>} />
        <Route path="/plan-wizard" element={<RouteTransition><PlanWizard /></RouteTransition>} />
        <Route path="/settings" element={<RouteTransition><Settings /></RouteTransition>} />
        <Route path="/book-ll" element={<RouteTransition><BookLightningLane /></RouteTransition>} />
        <Route path="*" element={<RouteTransition><NotFound /></RouteTransition>} />
      </Routes>
    </AnimatePresence>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <CompanionProvider>
        <JoyEventsProvider>
          <CelebrationProvider>
            <BrowserRouter>
              <AnimatedRoutes />
            </BrowserRouter>
          </CelebrationProvider>
        </JoyEventsProvider>
      </CompanionProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
