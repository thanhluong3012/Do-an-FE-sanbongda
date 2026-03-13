import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Booking from "./pages/Booking";
import Fields from "./pages/Fields";
import FieldDetail from "./pages/FieldDetail";
import FieldComplexDetail from "./pages/FieldComplexDetail";
import Tournament from "./pages/Tournament";
import Tournaments from "./pages/Tournaments";
import TournamentDetail from "./pages/TournamentDetail";
import ApiDebug from "./pages/ApiDebug";
import NotFound from "./pages/NotFound";
import FieldOwnerRegistration from "./pages/FieldOwnerRegistration";
import MyBookings from "./pages/MyBookings";
import ProtectedRoute from "./components/ProtectedRoute";

// Admin Pages
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminUsers from "./pages/admin/AdminUsers";
import AdminOwnerApprovals from "./pages/admin/AdminOwnerApprovals";
import AdminTournaments from "./pages/admin/AdminTournaments";

// Owner Pages
import OwnerDashboard from "./pages/owner/OwnerDashboard";
import OwnerStaff from "./pages/owner/OwnerStaff";
import OwnerFields from "./pages/owner/OwnerFields";
import OwnerBookings from "./pages/owner/OwnerBookings";
import OwnerPayments from "./pages/owner/OwnerPayments";
import OwnerRevenue from "./pages/owner/OwnerRevenue";

// Staff Pages
import StaffDashboard from "./pages/staff/StaffDashboard";
import StaffFields from "./pages/staff/StaffFields";
import StaffBookings from "./pages/staff/StaffBookings";
import StaffRevenue from "./pages/staff/StaffRevenue";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/register/field-owner" element={<FieldOwnerRegistration />} />
            
            {/* Booking - Yêu cầu đăng nhập (không cần role cụ thể) */}
            <Route path="/booking" element={
              <ProtectedRoute>
                <Booking />
              </ProtectedRoute>
            } />
            
            {/* My Bookings - CHỈ DÀNH CHO MEMBER (role=4) */}
            <Route path="/my-bookings" element={
              <ProtectedRoute requiredRole={4}>
                <MyBookings />
              </ProtectedRoute>
            } />
            
            {/* Public pages */}
            <Route path="/fields" element={<Fields />} />
            <Route path="/field/:id" element={<FieldDetail />} />
            <Route path="/field-complex/:id" element={<FieldComplexDetail />} />
            <Route path="/tournaments" element={<Tournaments />} />
            <Route path="/api-debug" element={<ApiDebug />} />
            
            {/* Tournament pages */}
            <Route path="/tournament/create" element={
              <ProtectedRoute>
                <Tournament />
              </ProtectedRoute>
            } />
            
            <Route path="/tournament/:id" element={<TournamentDetail />} />
            
            {/* Admin Routes - Role: ADMIN */}
            <Route path="/admin/dashboard" element={<ProtectedRoute requiredRole={1}><AdminDashboard /></ProtectedRoute>} />
            <Route path="/admin/users" element={<ProtectedRoute requiredRole={1}><AdminUsers /></ProtectedRoute>} />
            <Route path="/admin/owner-approvals" element={<ProtectedRoute requiredRole={1}><AdminOwnerApprovals /></ProtectedRoute>} />
            <Route path="/admin/tournaments" element={<ProtectedRoute requiredRole={1}><AdminTournaments /></ProtectedRoute>} />
            
            {/* Owner Routes - Role: OWNER */}
            <Route path="/owner/dashboard" element={<ProtectedRoute requiredRole={2}><OwnerDashboard /></ProtectedRoute>} />
            <Route path="/owner/staff" element={<ProtectedRoute requiredRole={2}><OwnerStaff /></ProtectedRoute>} />
            <Route path="/owner/fields" element={<ProtectedRoute requiredRole={2}><OwnerFields /></ProtectedRoute>} />
            <Route path="/owner/bookings" element={<ProtectedRoute requiredRole={2}><OwnerBookings /></ProtectedRoute>} />
            <Route path="/owner/payments" element={<ProtectedRoute requiredRole={2}><OwnerPayments /></ProtectedRoute>} />
            <Route path="/owner/revenue" element={<ProtectedRoute requiredRole={2}><OwnerRevenue /></ProtectedRoute>} />
            
            {/* Staff Routes - Role: STAFF */}
            <Route path="/staff/dashboard" element={<ProtectedRoute requiredRole={3}><StaffDashboard /></ProtectedRoute>} />
            <Route path="/staff/fields" element={<ProtectedRoute requiredRole={3}><StaffFields /></ProtectedRoute>} />
            <Route path="/staff/bookings" element={<ProtectedRoute requiredRole={3}><StaffBookings /></ProtectedRoute>} />
            <Route path="/staff/revenue" element={<ProtectedRoute requiredRole={3}><StaffRevenue /></ProtectedRoute>} />
            
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
