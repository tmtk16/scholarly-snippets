import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import AuthRequired from "@/components/auth/AuthRequired";
import NotFound from "@/pages/not-found";
import Home from "@/pages/Home";
import Services from "@/pages/Services";
import SubmitText from "@/pages/SubmitText";
import Orders from "@/pages/Orders";
import Profile from "@/pages/Profile";
import Login from "@/pages/Login";
import Register from "@/pages/Register";
import Payment from "@/pages/Payment";
import Dashboard from "@/pages/Dashboard";
import SubmissionDetail from "@/pages/SubmissionDetail";
import AdminDashboard from "@/pages/admin/Dashboard";
import AdminSubmissionDetail from "@/pages/admin/SubmissionDetail";
import Header from "@/components/layout/Header";
import AdminHeader from "@/components/layout/AdminHeader";
import Footer from "@/components/layout/Footer";

function Router() {
  const [location] = useLocation();
  const isAdmin = location.startsWith('/admin');
  
  // For admin routes, we show admin header but no footer
  if (isAdmin) {
    return (
      <div className="flex flex-col min-h-screen">
        <AdminHeader />
        <main className="flex-grow pt-4">
          <Switch>
            <Route path="/admin" component={AdminDashboard} />
            <Route path="/admin/submissions/:id" component={AdminSubmissionDetail} />
            <Route component={NotFound} />
          </Switch>
        </main>
      </div>
    );
  }
  
  // For regular user routes
  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-grow pt-16 pb-20">
        <Switch>
          <Route path="/" component={Home} />
          <Route path="/services" component={Services} />
          <Route path="/login" component={Login} />
          <Route path="/register" component={Register} />
          
          {/* Protected routes that require authentication */}
          <Route path="/submit" component={SubmitText} />
          <Route path="/dashboard">
            <AuthRequired>
              <Dashboard />
            </AuthRequired>
          </Route>
          <Route path="/submissions/:id">
            <AuthRequired>
              <SubmissionDetail />
            </AuthRequired>
          </Route>
          <Route path="/orders">
            <AuthRequired>
              <Orders />
            </AuthRequired>
          </Route>
          <Route path="/profile">
            <AuthRequired>
              <Profile />
            </AuthRequired>
          </Route>
          <Route path="/payment">
            <AuthRequired>
              <Payment />
            </AuthRequired>
          </Route>
          <Route component={NotFound} />
        </Switch>
      </main>
      <Footer />
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
