import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useQuery, type UseQueryOptions } from "@tanstack/react-query";
import PricingCalculator from "@/components/submission/PricingCalculator";
import SubmissionForm from "@/components/submission/SubmissionForm";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import type { Service } from "@shared/schema";

export default function SubmitText() {
  const [location, setLocation] = useLocation();
  const [selectedServiceId, setSelectedServiceId] = useState<number>();
  const [wordCount, setWordCount] = useState(500);
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);
  
  // Check if user is logged in
  const { data: user, isLoading: userLoading } = useQuery({
    queryKey: ['/api/auth/user'],
    retry: false,
    gcTime: 0 // Don't cache this query
  } as UseQueryOptions);
  
  const isAuthenticated = !!user;
  
  // Get service ID from URL query params if available
  useEffect(() => {
    const params = new URLSearchParams(location.split("?")[1]);
    const serviceId = params.get("serviceId");
    if (serviceId) {
      setSelectedServiceId(parseInt(serviceId));
    }
  }, [location]);
  
  // Fetch services
  const { data: services } = useQuery<Service[]>({
    queryKey: ['/api/services'],
  });
  
  // Set first service as default if none selected
  useEffect(() => {
    if (!selectedServiceId && services && services.length > 0) {
      setSelectedServiceId(services[0].id);
    }
  }, [services, selectedServiceId]);
  
  // Handle the submit action when user is not logged in
  const handleSubmitAttempt = () => {
    if (!isAuthenticated) {
      setShowLoginPrompt(true);
    }
  };
  
  return (
    <div className="container mx-auto px-4 max-w-lg">
      <h2 className="text-2xl font-bold text-primary mb-2">Submit Your Text</h2>
      <p className="text-muted-foreground mb-6">
        Upload or paste your text for professional review
      </p>
      
      <div className="space-y-6">
        <PricingCalculator 
          wordCount={wordCount}
          onWordCountChange={setWordCount}
          onServiceChange={setSelectedServiceId}
          selectedServiceId={selectedServiceId}
        />
        
        {selectedServiceId && (
          <SubmissionForm 
            serviceId={selectedServiceId} 
            wordCount={wordCount} 
            isAuthenticated={isAuthenticated}
            onSubmitAttempt={handleSubmitAttempt}
          />
        )}
      </div>
      
      {/* Login prompt dialog */}
      <Dialog open={showLoginPrompt} onOpenChange={setShowLoginPrompt}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Login or Register to Submit</DialogTitle>
            <DialogDescription>
              To submit your text for review, you need to create an account or login to your existing account.
            </DialogDescription>
          </DialogHeader>
          <p className="py-2">
            Creating an account allows you to:
          </p>
          <ul className="list-disc pl-6 space-y-1 text-sm">
            <li>Track the status of your submissions</li>
            <li>Receive notifications about your feedback</li>
            <li>Access your submission history</li> 
            <li>Make payments for approved submissions</li>
          </ul>
          <DialogFooter className="flex flex-col sm:flex-row gap-2 mt-4">
            <Button 
              variant="outline" 
              className="sm:flex-1" 
              onClick={() => {
                setShowLoginPrompt(false);
                setLocation("/register");
              }}
            >
              Register
            </Button>
            <Button 
              className="sm:flex-1" 
              onClick={() => {
                setShowLoginPrompt(false);
                setLocation("/login");
              }}
            >
              Login
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
