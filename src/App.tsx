import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { NotificationProvider } from "@/contexts/NotificationContext";
import { Layout } from "@/components/Layout";
import { apiRepository } from "@/repositories/apiRepository";
import { type UserRole } from "@/types";
import { useEffect, useState } from "react";
import Landing from "./pages/Landing";
import GroupLanding from "./pages/GroupLanding";
import SignIn from "./pages/SignIn";
import SignUp from "./pages/SignUp";
import CompleteRegistration from "./pages/CompleteRegistration";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import VerifyEmail from "./pages/VerifyEmail";
import ProjectBoard from "./pages/ProjectBoard";
import Applications from "./pages/Applications";
import Profile from "./pages/Profile";
import Settings from "./pages/Settings";
import AdminPanel from "./pages/AdminPanel";
import Groups from "./pages/Groups";
import GroupDetails from "./pages/GroupDetails";
import GroupLeadership from "./pages/GroupLeadership";
import StudentCV from "./pages/StudentCV";
import MyLabDetails from "./pages/MyLabDetails";
import MyLabGroupDetails from "./pages/MyLabGroupDetails";
import PublicProjects from "./pages/PublicProjects";
import PublicProjectDetails from "./pages/PublicProjectDetails";
import PublicMemberDetails from "./pages/PublicMemberDetails";
import Unverified from "./pages/Unverified";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated, isInitialLoading, user } = useAuth();
  if (isInitialLoading) return <div className="flex h-screen items-center justify-center">Loading...</div>; // TODO: Better loader
  if (!isAuthenticated) return <Navigate to="/signin" replace />;
  if (user && user.is_email_verified === false) return <Navigate to="/unverified" replace />;
  return <>{children}</>;
};

const PublicOnlyRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated, isInitialLoading } = useAuth();
  if (isInitialLoading) return null; // Or a loader
  if (isAuthenticated) return <Navigate to="/projects" replace />;
  return <>{children}</>;
};

const RoleProtectedRoute = ({ children, allowedRoles }: { children: React.ReactNode; allowedRoles: UserRole[] }) => {
  const { isAuthenticated, isInitialLoading, hasRole, user } = useAuth();
  const location = useLocation();
  if (isInitialLoading) return <div className="flex h-screen items-center justify-center">Loading...</div>;
  if (!isAuthenticated) return <Navigate to="/signin" replace state={{ from: location }} />;
  if (user && user.is_email_verified === false) return <Navigate to="/unverified" replace />;
  if (!hasRole(allowedRoles)) return <Navigate to="/projects" replace />;
  return <>{children}</>;
};

const LabAdminProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated, isInitialLoading, user } = useAuth();
  const location = useLocation();
  const [checking, setChecking] = useState(true);
  const [isLabAdmin, setIsLabAdmin] = useState(false);

  useEffect(() => {
    const checkMembership = async () => {
      if (!isAuthenticated || !user) {
        setIsLabAdmin(false);
        setChecking(false);
        return;
      }
      try {
        const admins = await apiRepository.getLabAdmins();
        setIsLabAdmin(admins.some(a => a.user_id === user.id));
      } catch {
        setIsLabAdmin(false);
      } finally {
        setChecking(false);
      }
    };
    checkMembership();
  }, [isAuthenticated, user?.id]);

  if (isInitialLoading || checking) return <div className="flex h-screen items-center justify-center">Loading...</div>;
  if (!isAuthenticated) return <Navigate to="/signin" replace state={{ from: location }} />;
  if (user && user.is_email_verified === false) return <Navigate to="/unverified" replace />;
  if (!isLabAdmin) return <Navigate to="/projects" replace />;
  return <>{children}</>;
};

const AppRoutes = () => (
  <Layout>
    <Routes>
      <Route path="/" element={<PublicOnlyRoute><Landing /></PublicOnlyRoute>} />
      <Route path="/group/:groupId" element={<GroupLanding />} />
      <Route path="/discovery/projects" element={<PublicProjects />} />
      <Route path="/discovery/projects/:projectId" element={<PublicProjectDetails />} />
      <Route path="/member/:memberId" element={<PublicMemberDetails />} />
      <Route path="/signin" element={<PublicOnlyRoute><SignIn /></PublicOnlyRoute>} />
      <Route path="/signup" element={<PublicOnlyRoute><SignUp /></PublicOnlyRoute>} />
      <Route path="/complete-registration" element={<ProtectedRoute><CompleteRegistration /></ProtectedRoute>} />
      <Route path="/forgot-password" element={<PublicOnlyRoute><ForgotPassword /></PublicOnlyRoute>} />
      <Route path="/reset-password" element={<PublicOnlyRoute><ResetPassword /></PublicOnlyRoute>} />
      <Route path="/verify-email" element={<VerifyEmail />} />
      <Route path="/unverified" element={<Unverified />} />
      <Route path="/dashboard" element={<Navigate to="/projects" replace />} />
      <Route path="/projects" element={<ProtectedRoute><ProjectBoard /></ProtectedRoute>} />
      <Route path="/projects/:projectId" element={<ProtectedRoute><ProjectBoard /></ProtectedRoute>} />
      <Route path="/applications" element={<RoleProtectedRoute allowedRoles={['TEACHER', 'PARTNER']}><Applications /></RoleProtectedRoute>} />
      <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
      <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
      <Route path="/groups" element={<RoleProtectedRoute allowedRoles={['TEACHER']}><Groups /></RoleProtectedRoute>} />
      <Route path="/groups/:groupId" element={<RoleProtectedRoute allowedRoles={['TEACHER', 'STUDENT']}><GroupDetails /></RoleProtectedRoute>} />
      <Route path="/group-leadership" element={<RoleProtectedRoute allowedRoles={['TEACHER']}><GroupLeadership /></RoleProtectedRoute>} />
      <Route path="/student-cv" element={<RoleProtectedRoute allowedRoles={['STUDENT']}><StudentCV /></RoleProtectedRoute>} />
      <Route path="/admin" element={<RoleProtectedRoute allowedRoles={['ADMIN']}><AdminPanel /></RoleProtectedRoute>} />
      <Route path="/my-labs" element={<LabAdminProtectedRoute><AdminPanel myLabsOnly /></LabAdminProtectedRoute>} />
      <Route path="/my-labs/labs/:labId" element={<LabAdminProtectedRoute><MyLabDetails /></LabAdminProtectedRoute>} />
      <Route path="/my-labs/groups/:groupId" element={<LabAdminProtectedRoute><MyLabGroupDetails /></LabAdminProtectedRoute>} />
      <Route path="/" element={<ProtectedRoute><Navigate to="/projects" replace /></ProtectedRoute>} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  </Layout>
);

const ScrollToTop = () => {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return null;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner richColors closeButton />
      <BrowserRouter>
        <ScrollToTop />
        <AuthProvider>
          <NotificationProvider>
            <AppRoutes />
          </NotificationProvider>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
