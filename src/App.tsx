import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
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

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <CompanionProvider>
        <JoyEventsProvider>
          <CelebrationProvider>
            <BrowserRouter>
              <Routes>
                <Route path="/" element={<Welcome />} />
                <Route path="/home" element={<Home />} />
                <Route path="/auth" element={<Auth />} />
                <Route path="/park" element={<InPark />} />
                <Route path="/edit-itinerary" element={<EditItinerary />} />
                <Route path="/upgrades" element={<Upgrades />} />
                <Route path="/joy-report" element={<JoyReport />} />
                <Route path="/plan-wizard" element={<PlanWizard />} />
                <Route path="/settings" element={<Settings />} />
                <Route path="/book-ll" element={<BookLightningLane />} />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </BrowserRouter>
          </CelebrationProvider>
        </JoyEventsProvider>
      </CompanionProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
