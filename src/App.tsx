import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { Layout } from "@/components/Layout";
import { type UserRole } from "@/types";
import Landing from "./pages/Landing";
import SignIn from "./pages/SignIn";
import SignUp from "./pages/SignUp";
import CompleteRegistration from "./pages/CompleteRegistration";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import Feed from "./pages/Feed";
import LabExplorer from "./pages/LabExplorer";
import ProjectBoard from "./pages/ProjectBoard";
import Chat from "./pages/Chat";
import Applications from "./pages/Applications";
import Profile from "./pages/Profile";
import Settings from "./pages/Settings";
import AdminPanel from "./pages/AdminPanel";
import LabDetails from "./pages/LabDetails";
import GroupDetails from "./pages/GroupDetails";
import Groups from "./pages/Groups";
import GroupLeadership from "./pages/GroupLeadership";
import StudentCV from "./pages/StudentCV";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated, isInitialLoading } = useAuth();
  if (isInitialLoading) return <div className="flex h-screen items-center justify-center">Loading...</div>; // TODO: Better loader
  if (!isAuthenticated) return <Navigate to="/signin" replace />;
  return <>{children}</>;
};

const PublicOnlyRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated, isInitialLoading } = useAuth();
  if (isInitialLoading) return null; // Or a loader
  if (isAuthenticated) return <Navigate to="/dashboard" replace />;
  return <>{children}</>;
};

const RoleProtectedRoute = ({ children, allowedRoles }: { children: React.ReactNode; allowedRoles: UserRole[] }) => {
  const { isAuthenticated, isInitialLoading, hasRole } = useAuth();
  const location = useLocation();
  if (isInitialLoading) return <div className="flex h-screen items-center justify-center">Loading...</div>;
  if (!isAuthenticated) return <Navigate to="/signin" replace state={{ from: location }} />;
  if (!hasRole(allowedRoles)) return <Navigate to="/dashboard" replace />;
  return <>{children}</>;
};

const AppRoutes = () => (
  <Layout>
    <Routes>
      <Route path="/" element={<PublicOnlyRoute><Landing /></PublicOnlyRoute>} />
      <Route path="/signin" element={<PublicOnlyRoute><SignIn /></PublicOnlyRoute>} />
      <Route path="/signup" element={<PublicOnlyRoute><SignUp /></PublicOnlyRoute>} />
      <Route path="/complete-registration" element={<ProtectedRoute><CompleteRegistration /></ProtectedRoute>} />
      <Route path="/forgot-password" element={<PublicOnlyRoute><ForgotPassword /></PublicOnlyRoute>} />
      <Route path="/reset-password" element={<PublicOnlyRoute><ResetPassword /></PublicOnlyRoute>} />
      <Route path="/dashboard" element={<ProtectedRoute><Feed /></ProtectedRoute>} />
      <Route path="/labs" element={<ProtectedRoute><LabExplorer /></ProtectedRoute>} />
      <Route path="/projects/:projectId" element={<ProtectedRoute><ProjectBoard /></ProtectedRoute>} />
      <Route path="/applications" element={<RoleProtectedRoute allowedRoles={['TEACHER', 'ADMIN', 'PARTNER']}><Applications /></RoleProtectedRoute>} />
      <Route path="/chat" element={<ProtectedRoute><Chat /></ProtectedRoute>} />
      <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
      <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
      <Route path="/labs/:labId" element={<ProtectedRoute><LabDetails /></ProtectedRoute>} />
      <Route path="/groups/:groupId" element={<ProtectedRoute><GroupDetails /></ProtectedRoute>} />
      <Route path="/groups" element={<RoleProtectedRoute allowedRoles={['TEACHER']}><Groups /></RoleProtectedRoute>} />
      <Route path="/group-leadership" element={<RoleProtectedRoute allowedRoles={['TEACHER']}><GroupLeadership /></RoleProtectedRoute>} />
      <Route path="/student-cv" element={<RoleProtectedRoute allowedRoles={['STUDENT']}><StudentCV /></RoleProtectedRoute>} />
      <Route path="/admin" element={<RoleProtectedRoute allowedRoles={['ADMIN']}><AdminPanel /></RoleProtectedRoute>} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  </Layout>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <AppRoutes />
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
