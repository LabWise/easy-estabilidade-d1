import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Routes, Route } from "react-router-dom";
import { Suspense, lazy } from "react";
import { ProtectedRoute } from "@/components/Auth/ProtectedRoute";
import { ProtectedPageRoute } from "@/components/Auth/ProtectedPageRoute";

// Lazy loading de páginas para redução do bundle inicial
const Dashboard = lazy(() => import("./pages/Dashboard"));
const EntradaAmostras = lazy(() => import("./pages/EntradaAmostras"));
const GestaoAmostras = lazy(() => import("./pages/GestaoAmostras"));
const RetiradaAmostras = lazy(() => import("./pages/RetiradaAmostras"));
const RelatorioAmostras = lazy(() => import("./pages/RelatorioAmostras"));
const AnalisesLaboratoriais = lazy(() => import("./pages/AnalisesLaboratoriais"));
const ProximasRetiradas = lazy(() => import("./pages/ProximasRetiradas"));
const Configuracoes = lazy(() => import("./pages/Configuracoes"));
const AuditTrail = lazy(() => import("./pages/AuditTrail"));
const NotFound = lazy(() => import("./pages/NotFound"));
const SetPassword = lazy(() => import("./pages/SetPassword"));

// Loading component para páginas
const PageLoader = () => (
  <div className="flex h-screen items-center justify-center">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
  </div>
);

const App = () => (
  <TooltipProvider>
    <Toaster />
    <Sonner />
    <Suspense fallback={<PageLoader />}>
      <Routes>
        {/* Rota pública para definir senha após convite */}
        <Route path="/set-password" element={<SetPassword />} />
        
        {/* Rotas protegidas */}
        <Route path="/*" element={
          <ProtectedRoute>
            <Suspense fallback={<PageLoader />}>
              <Routes>
                <Route path="/" element={<Dashboard />} />
                <Route 
                  path="/entrada" 
                  element={
                    <ProtectedPageRoute page="entrada">
                      <EntradaAmostras />
                    </ProtectedPageRoute>
                  } 
                />
                <Route 
                  path="/gestao" 
                  element={
                    <ProtectedPageRoute page="gestao">
                      <GestaoAmostras />
                    </ProtectedPageRoute>
                  } 
                />
                <Route 
                  path="/retirada" 
                  element={
                    <ProtectedPageRoute page="retirada">
                      <RetiradaAmostras />
                    </ProtectedPageRoute>
                  } 
                />
                <Route 
                  path="/analises" 
                  element={
                    <ProtectedPageRoute page="analises">
                      <AnalisesLaboratoriais />
                    </ProtectedPageRoute>
                  } 
                />
                <Route path="/relatorios" element={<RelatorioAmostras />} />
                <Route path="/proximas-retiradas" element={<ProximasRetiradas />} />
                <Route 
                  path="/audit-trail" 
                  element={
                    <ProtectedPageRoute page="audit-trail" requireAuditTrail={true}>
                      <AuditTrail />
                    </ProtectedPageRoute>
                  } 
                />
                <Route 
                  path="/configuracoes" 
                  element={
                    <ProtectedPageRoute page="configuracoes">
                      <Configuracoes />
                    </ProtectedPageRoute>
                  } 
                />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </Suspense>
          </ProtectedRoute>
        } />
      </Routes>
    </Suspense>
  </TooltipProvider>
);

export default App;