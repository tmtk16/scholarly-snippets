import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import OrderCard from "@/components/orders/OrderCard";
import type { Submission, Service } from "@shared/schema";

export default function Orders() {
  const [activeTab, setActiveTab] = useState("active");
  
  const { data: submissions, isLoading: submissionsLoading } = useQuery<Submission[]>({
    queryKey: ['/api/submissions'],
  });
  
  const { data: services, isLoading: servicesLoading } = useQuery<Service[]>({
    queryKey: ['/api/services'],
  });
  
  const isLoading = submissionsLoading || servicesLoading;
  
  const getServiceForSubmission = (serviceId: number) => {
    const service = services?.find(s => s.id === serviceId);
    return service || { name: "Unknown Service", turnaround: 72 };
  };
  
  // Filter submissions by their status
  const activeSubmissions = submissions?.filter(
    s => ["pending_approval", "approved", "paid", "in-progress"].includes(s.status)
  ) || [];
  
  const completedSubmissions = submissions?.filter(
    s => s.status === "completed" || s.status === "rejected"
  ) || [];

  return (
    <div className="container mx-auto px-4 max-w-lg">
      <h2 className="text-2xl font-bold text-primary mb-6">My Submissions</h2>
      
      <Tabs defaultValue="active" value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2 mb-6">
          <TabsTrigger value="active">Active</TabsTrigger>
          <TabsTrigger value="completed">Completed</TabsTrigger>
        </TabsList>
        
        <TabsContent value="active">
          {isLoading ? (
            Array(2).fill(0).map((_, index) => (
              <Card key={index} className="mb-4">
                <CardContent className="p-4">
                  <div className="flex justify-between items-start mb-2">
                    <Skeleton className="h-5 w-36 mb-2" />
                    <Skeleton className="h-5 w-24" />
                  </div>
                  <Skeleton className="h-4 w-full mb-2" />
                  <div className="flex justify-between items-center mb-3">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-4 w-20" />
                  </div>
                  <Skeleton className="h-2 w-full mb-1" />
                  <div className="flex justify-between">
                    <Skeleton className="h-3 w-24" />
                    <Skeleton className="h-3 w-24" />
                  </div>
                </CardContent>
              </Card>
            ))
          ) : activeSubmissions.length > 0 ? (
            <div className="space-y-4 mb-6">
              {activeSubmissions.map(submission => (
                <OrderCard 
                  key={submission.id} 
                  submission={submission}
                  service={getServiceForSubmission(submission.serviceId)}
                  showDetails={true}
                />
              ))}
            </div>
          ) : (
            <Card className="mb-6">
              <CardContent className="p-6 text-center">
                <p className="text-muted-foreground mb-4">
                  You don't have any active submissions.
                </p>
                <Link href="/submit">
                  <Button>Create New Submission</Button>
                </Link>
              </CardContent>
            </Card>
          )}
        </TabsContent>
        
        <TabsContent value="completed">
          {isLoading ? (
            Array(2).fill(0).map((_, index) => (
              <Card key={index} className="mb-4">
                <CardContent className="p-4">
                  <div className="flex justify-between items-start mb-2">
                    <Skeleton className="h-5 w-36 mb-2" />
                    <Skeleton className="h-5 w-24" />
                  </div>
                  <Skeleton className="h-4 w-full mb-2" />
                  <div className="flex justify-between items-center mb-3">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-4 w-20" />
                  </div>
                  <div className="flex space-x-2">
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-10 w-12" />
                  </div>
                </CardContent>
              </Card>
            ))
          ) : completedSubmissions.length > 0 ? (
            <div className="space-y-4 mb-6">
              {completedSubmissions.map(submission => (
                <OrderCard 
                  key={submission.id} 
                  submission={submission}
                  service={getServiceForSubmission(submission.serviceId)}
                  showDetails={true}
                />
              ))}
            </div>
          ) : (
            <Card className="mb-6">
              <CardContent className="p-6 text-center">
                <p className="text-muted-foreground mb-4">
                  You don't have any completed submissions yet.
                </p>
                <Link href="/submit">
                  <Button>Create New Submission</Button>
                </Link>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
      
      <Link href="/submit">
        <Button variant="outline" className="w-full">
          New Submission
        </Button>
      </Link>
    </div>
  );
}
