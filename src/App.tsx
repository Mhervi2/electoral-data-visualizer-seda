
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/context/AuthContext";
import Layout from "@/components/layout/Layout";
import Index from "./pages/Index";
import Login from "./pages/Login";
import ForgotPassword from "./pages/ForgotPassword";
import Results from "./pages/Results";
import SubmitActa from "./pages/SubmitActa";
import DHondtCalculator from "./pages/DHondtCalculator";
import PoliticalParties from "./pages/PoliticalParties";
import Settings from "./pages/Settings";
import ElectoralComparison from "./pages/ElectoralComparison";
import Terminos from "./pages/Terminos";
import Privacidad from "./pages/Privacidad";
import AdminLayout from "./pages/admin/AdminLayout";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminElections from "./pages/admin/elections/AdminElections";
import AdminElectionsNew from "./pages/admin/elections/AdminElectionsNew";
import AdminElectionsEdit from "./pages/admin/elections/AdminElectionsEdit";
import AdminFiles from "./pages/admin/files/AdminFiles";
import AdminFilesUpload from "./pages/admin/files/AdminFilesUpload";
import AdminElectoralActs from "./pages/admin/AdminElectoralActs";
import ProvincialSeats from "./pages/admin/ProvincialSeats";
import TerritorialCodes from "./pages/admin/TerritorialCodes";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            {/* Auth routes (no layout) */}
            <Route path="/login" element={<Login />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            
            {/* Admin routes */}
            <Route path="/admin" element={<AdminLayout />}>
              <Route index element={<AdminDashboard />} />
              <Route path="elections" element={<AdminElections />} />
              <Route path="elections/new" element={<AdminElectionsNew />} />
              <Route path="elections/:id/edit" element={<AdminElectionsEdit />} />
              <Route path="files" element={<AdminFiles />} />
              <Route path="files/upload" element={<AdminFilesUpload />} />
              <Route path="electoral-acts" element={<AdminElectoralActs />} />
              <Route path="provincial-seats" element={<ProvincialSeats />} />
              <Route path="territorial-codes" element={<TerritorialCodes />} />
            </Route>
            
            {/* Public routes with layout */}
            <Route path="/*" element={
              <Layout>
                <Routes>
                  <Route path="/" element={<Index />} />
                  <Route path="/results" element={<Results />} />
                  <Route path="/submit-acta" element={<SubmitActa />} />
                  <Route path="/dhondt-calculator" element={<DHondtCalculator />} />
                  <Route path="/political-parties" element={<PoliticalParties />} />
                  <Route path="/electoral-comparison" element={<ElectoralComparison />} />
                  <Route path="/settings" element={<Settings />} />
                  <Route path="/terminos" element={<Terminos />} />
                  <Route path="/privacidad" element={<Privacidad />} />
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </Layout>
            } />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
