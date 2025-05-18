import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Link, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import OrderCard from "@/components/orders/OrderCard";
import type { Submission, Service } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";

export default function Profile() {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  
  // Fetch current user data
  const { data: user, isLoading: userLoading, isError: userError } = useQuery({
    queryKey: ['/api/auth/user'],
    retry: 1
  });
  
  const { data: submissions, isLoading: submissionsLoading } = useQuery<Submission[]>({
    queryKey: ['/api/submissions'],
    enabled: !!user // Only fetch if user is logged in
  });
  
  const { data: services, isLoading: servicesLoading } = useQuery<Service[]>({
    queryKey: ['/api/services'],
  });
  
  // If not logged in, redirect to login page
  if (userError) {
    setLocation("/login");
    return null;
  }
  
  // Show loading state while fetching data
  if (userLoading) {
    return (
      <div className="container mx-auto px-4 py-8 flex justify-center">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }
  
  const recentSubmissions = submissions?.slice(0, 2) || [];
  
  const getServiceForSubmission = (serviceId: number) => {
    const service = services?.find(s => s.id === serviceId);
    return service || { name: "Unknown Service", turnaround: 72 };
  };
  
  // Handle logout
  const handleLogout = async () => {
    try {
      await apiRequest("POST", "/api/auth/logout", {});
      queryClient.invalidateQueries();
      toast({
        title: "Logged out",
        description: "You have been logged out successfully"
      });
      setLocation("/login");
    } catch (error) {
      toast({
        title: "Logout failed",
        description: "There was an error logging you out",
        variant: "destructive"
      });
    }
  };
  
  const accountSettings = [
    { label: "Personal Information", icon: "user" },
    { label: "Notification Preferences", icon: "bell" },
    { label: "Payment Methods", icon: "credit-card" },
    { label: "Help & Support", icon: "help-circle" },
  ];

  // Define user data types
  type UserData = {
    id: number;
    name: string;
    email: string;
    username: string;
  };
  
  // Cast user to the correct type
  const userData = user as UserData;
  
  return (
    <div className="container mx-auto px-4 max-w-lg">
      {/* Profile Header */}
      <div className="flex items-center mb-6">
        <Avatar className="h-16 w-16 mr-4">
          <AvatarFallback className="bg-muted text-muted-foreground">
            {userData.name.split(" ").map((n: string) => n[0]).join("")}
          </AvatarFallback>
        </Avatar>
        <div>
          <h2 className="text-xl font-bold text-foreground">{userData.name}</h2>
          <p className="text-muted-foreground">{userData.email}</p>
        </div>
      </div>
      
      {/* Recent Submissions */}
      <section className="mb-8">
        <h3 className="text-xl font-bold text-primary mb-4">Recent Submissions</h3>
        
        {recentSubmissions.length > 0 ? (
          <div className="space-y-4 mb-4">
            {recentSubmissions.map(submission => (
              <OrderCard 
                key={submission.id} 
                submission={submission}
                service={getServiceForSubmission(submission.serviceId)}
              />
            ))}
          </div>
        ) : (
          <Card className="mb-4">
            <CardContent className="p-6 text-center">
              <p className="text-muted-foreground mb-4">
                You don't have any submissions yet.
              </p>
            </CardContent>
          </Card>
        )}
        
        <Link href="/orders">
          <Button variant="outline" className="w-full">
            View All Submissions
          </Button>
        </Link>
      </section>
      
      {/* Account Settings */}
      <section className="mb-8">
        <h3 className="text-xl font-bold text-primary mb-4">Account Settings</h3>
        
        <Card>
          {accountSettings.map((setting, index) => (
            <div key={setting.label}>
              <CardContent className="p-4 flex items-center justify-between cursor-pointer hover:bg-muted/50 transition-colors">
                <div className="font-medium text-foreground">{setting.label}</div>
                <svg 
                  xmlns="http://www.w3.org/2000/svg" 
                  className="h-5 w-5 text-muted-foreground" 
                  viewBox="0 0 24 24" 
                  fill="none" 
                  stroke="currentColor" 
                  strokeWidth="2" 
                  strokeLinecap="round" 
                  strokeLinejoin="round"
                >
                  <polyline points="9 18 15 12 9 6" />
                </svg>
              </CardContent>
              {index < accountSettings.length - 1 && <Separator />}
            </div>
          ))}
        </Card>
      </section>
      
      <Button variant="secondary" className="w-full mb-8" onClick={handleLogout}>
        Sign Out
      </Button>
    </div>
  );
}
