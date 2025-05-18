import { useState } from "react";
import { useParams, useLocation, Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import AuthRequired from "@/components/auth/AuthRequired";
import { formatPrice } from "@/lib/utils";
import type { Submission, Service } from "@shared/schema";
import TextHighlighter from "@/components/submission/TextHighlighter";
import TeamsScheduler from "@/components/meetings/TeamsScheduler";

export default function SubmissionDetail() {
  const { id } = useParams<{ id: string }>();
  const submissionId = parseInt(id);
  const [, navigate] = useLocation();
  
  // Fetch submission details
  const { data: submission, isLoading: submissionLoading } = useQuery({
    queryKey: ['/api/submissions', submissionId],
    queryFn: async () => {
      const res = await fetch(`/api/submissions/${submissionId}`);
      if (!res.ok) throw new Error('Failed to fetch submission');
      return res.json() as Promise<Submission>;
    }
  });
  
  // Fetch service details for this submission
  const { data: service, isLoading: serviceLoading } = useQuery({
    queryKey: ['/api/services', submission?.serviceId],
    queryFn: async () => {
      if (!submission?.serviceId) throw new Error('No service ID');
      const res = await fetch(`/api/services/${submission.serviceId}`);
      if (!res.ok) throw new Error('Failed to fetch service');
      return res.json() as Promise<Service>;
    },
    enabled: !!submission?.serviceId
  });
  
  // Function to format status
  const formatStatus = (status: string): string => {
    switch (status) {
      case "pending_approval": return "Pending Approval";
      case "approved": return "Awaiting Payment";
      case "paid": return "In Review";
      case "in_progress": return "In Progress";
      case "completed": return "Completed";
      case "rejected": return "Rejected";
      default: return status.charAt(0).toUpperCase() + status.slice(1);
    }
  };
  
  // Function to get appropriate badge color
  const getStatusVariant = (status: string): "default" | "destructive" | "outline" | "secondary" => {
    switch (status) {
      case "pending_approval": return "secondary";
      case "approved": return "outline";
      case "paid": return "default";
      case "in_progress": return "default";
      case "completed": return "default";
      case "rejected": return "destructive";
      default: return "outline";
    }
  };
  
  // Calculate estimated completion date
  const getEstimatedCompletionDate = () => {
    if (!submission || !service) return null;
    
    let baseDate = new Date(submission.submittedAt);
    
    // For paid and in_progress status, use paid date as starting point
    if (submission.paidAt && ["paid", "in_progress"].includes(submission.status)) {
      baseDate = new Date(submission.paidAt);
    }
    
    // Add turnaround hours to base date
    const completionDate = new Date(baseDate);
    completionDate.setHours(completionDate.getHours() + service.turnaround);
    
    return completionDate;
  };
  
  // Calculate progress percentage
  const getProgressPercentage = () => {
    if (!submission || !service) return 0;
    
    // If completed or rejected, return appropriate values
    if (submission.status === "completed") return 100;
    if (submission.status === "rejected") return 0;
    
    // If not yet paid, show early stage progress
    if (["pending_approval", "approved"].includes(submission.status)) {
      return submission.status === "pending_approval" ? 10 : 20;
    }
    
    // For paid/in-progress submissions, calculate based on time elapsed
    if (submission.paidAt) {
      const startTime = new Date(submission.paidAt).getTime();
      const endTime = getEstimatedCompletionDate()?.getTime() || startTime;
      const currentTime = new Date().getTime();
      
      // Calculate percentage
      const totalDuration = endTime - startTime;
      const elapsedDuration = currentTime - startTime;
      
      // Cap between 20 and 95%
      const percentage = Math.min(95, Math.max(20, (elapsedDuration / totalDuration) * 100));
      
      return Math.round(percentage);
    }
    
    return 0;
  };
  
  // Parse highlights from feedback if available
  const parseHighlights = () => {
    if (!submission?.feedback) return [];
    
    // Check if the feedback contains highlight markers
    if (!submission.feedback.includes('# Highlighted Feedback')) {
      return [];
    }
    
    // Attempt to parse highlights
    const highlights: any[] = [];
    const regex = /## Highlight (\d+)\n> "(.+?)"\n\n(.+?)(?=\n\n## Highlight|\n*$)/g;
    let match;
    let index = 0;
    
    while ((match = regex.exec(submission.feedback)) !== null) {
      index++;
      highlights.push({
        id: `extracted-${index}`,
        text: match[2],
        comment: match[3],
        color: '#FFEB3B', // Default yellow highlight
        readOnly: true
      });
    }
    
    return highlights;
  };
  
  // Extract highlights from feedback
  const extractedHighlights = submission?.feedback ? parseHighlights() : [];
  
  if (submissionLoading || (submission && serviceLoading)) {
    return (
      <AuthRequired>
        <div className="container mx-auto py-12 flex justify-center">
          <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" aria-label="Loading"/>
        </div>
      </AuthRequired>
    );
  }
  
  if (!submission) {
    return (
      <AuthRequired>
        <div className="container mx-auto py-12">
          <Alert variant="destructive">
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>
              Submission not found. The submission may have been deleted or you don't have access.
            </AlertDescription>
          </Alert>
          <Button className="mt-4" onClick={() => navigate("/dashboard")}>
            Return to Dashboard
          </Button>
        </div>
      </AuthRequired>
    );
  }
  
  return (
    <AuthRequired>
      <div className="container mx-auto py-8 max-w-4xl px-4">
        <Button 
          variant="outline" 
          className="mb-6"
          onClick={() => navigate("/dashboard")}
        >
          ← Back to Dashboard
        </Button>
        
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center flex-wrap gap-2">
                <div>
                  <CardTitle className="text-xl">{submission.title}</CardTitle>
                  <CardDescription>
                    {service?.name} | {submission.wordCount} words | {formatPrice(submission.totalPrice)}
                  </CardDescription>
                </div>
                <Badge variant={getStatusVariant(submission.status)}>
                  {formatStatus(submission.status)}
                </Badge>
              </div>
            </CardHeader>
            
            <CardContent className="space-y-6">
              {/* Status Progress */}
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Progress</span>
                  <span>{getProgressPercentage()}%</span>
                </div>
                <Progress value={getProgressPercentage()} className="h-2" />
              </div>
              
              {/* Status Information */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h3 className="text-sm font-medium mb-1">Submitted</h3>
                  <p className="text-sm">{new Date(submission.submittedAt).toLocaleString()}</p>
                </div>
                
                {service && (
                  <div>
                    <h3 className="text-sm font-medium mb-1">Turnaround Time</h3>
                    <p className="text-sm">{service.turnaround} hours</p>
                  </div>
                )}
                
                {submission.paidAt && (
                  <div>
                    <h3 className="text-sm font-medium mb-1">Paid On</h3>
                    <p className="text-sm">{new Date(submission.paidAt).toLocaleString()}</p>
                  </div>
                )}
                
                {submission.status === "paid" && getEstimatedCompletionDate() && (
                  <div>
                    <h3 className="text-sm font-medium mb-1">Estimated Completion</h3>
                    <p className="text-sm">{getEstimatedCompletionDate()?.toLocaleString()}</p>
                  </div>
                )}
                
                {submission.completedAt && (
                  <div>
                    <h3 className="text-sm font-medium mb-1">Completed On</h3>
                    <p className="text-sm">{new Date(submission.completedAt).toLocaleString()}</p>
                  </div>
                )}
              </div>
              
              {/* Status-specific Messages */}
              {submission.status === "pending_approval" && (
                <Alert>
                  <AlertTitle>Under Review</AlertTitle>
                  <AlertDescription>
                    Your submission is currently being reviewed. Once approved, you'll be able to make a payment to proceed.
                  </AlertDescription>
                </Alert>
              )}
              
              {submission.status === "approved" && (
                <Alert className="bg-amber-50 border-amber-200">
                  <AlertTitle>Payment Required</AlertTitle>
                  <AlertDescription>
                    Your submission has been approved! Please make a payment to begin the review process.
                  </AlertDescription>
                </Alert>
              )}
              
              {submission.status === "paid" && (
                <Alert className="bg-blue-50 border-blue-200">
                  <AlertTitle>In Review</AlertTitle>
                  <AlertDescription>
                    We've received your payment and your submission is in our review queue. You'll receive feedback once the review is complete.
                  </AlertDescription>
                </Alert>
              )}
              
              {submission.status === "rejected" && (
                <Alert variant="destructive">
                  <AlertTitle>Submission Rejected</AlertTitle>
                  <AlertDescription>
                    We're unable to process your submission. This could be due to content restrictions or other policy violations.
                  </AlertDescription>
                </Alert>
              )}

              <Separator />
              
              {/* Submission Content */}
              <div className="space-y-4">
                <h3 className="font-medium">Your Submission</h3>
                
                {submission.content && (
                  <div className="rounded-md border p-4 bg-gray-50 whitespace-pre-wrap">
                    {submission.content}
                  </div>
                )}
                
                {submission.filename && (
                  <div>
                    <p>Uploaded file: {submission.filename}</p>
                    <Button variant="outline" className="mt-2" asChild>
                      <a href={`/uploads/${submission.filename}`} target="_blank" rel="noopener noreferrer">
                        Download Your File
                      </a>
                    </Button>
                  </div>
                )}
              </div>
              
              {/* Submission Instructions */}
              <div className="space-y-4">
                <h3 className="font-medium">Your Instructions</h3>
                
                <div>
                  <h4 className="text-sm font-medium mb-1">Assignment Prompt</h4>
                  <div className="rounded-md border p-4 bg-gray-50 whitespace-pre-wrap">
                    {submission.promptInstructions}
                  </div>
                </div>
                
                {submission.additionalInstructions && (
                  <div>
                    <h4 className="text-sm font-medium mb-1">Additional Instructions</h4>
                    <div className="rounded-md border p-4 bg-gray-50 whitespace-pre-wrap">
                      {submission.additionalInstructions}
                    </div>
                  </div>
                )}
              </div>
              
              {/* Feedback Section */}
              {submission.status === "completed" && submission.feedback && (
                <div className="space-y-4">
                  <Separator />
                  <h3 className="font-medium text-lg">Expert Feedback</h3>
                  
                  {extractedHighlights.length > 0 ? (
                    <div className="space-y-6">
                      {/* Display highlighted feedback */}
                      {submission.content && (
                        <div className="space-y-2">
                          <h4 className="text-sm font-medium">Highlighted Comments</h4>
                          <Card className="border">
                            <CardContent className="p-4">
                              <TextHighlighter 
                                text={submission.content}
                                highlights={extractedHighlights}
                                readOnly={true}
                              />
                            </CardContent>
                          </Card>
                        </div>
                      )}
                      
                      {/* Also display the raw feedback text */}
                      <div className="space-y-2">
                        <h4 className="text-sm font-medium">Complete Feedback</h4>
                        <div className="rounded-md border p-4 bg-gray-50 whitespace-pre-wrap">
                          {submission.feedback}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="rounded-md border p-4 bg-gray-50 whitespace-pre-wrap">
                      {submission.feedback}
                    </div>
                  )}
                </div>
              )}
              
              {/* Schedule a Consultation Section */}
              {["approved", "paid", "completed"].includes(submission.status) && (
                <div className="space-y-4">
                  <Separator />
                  <h3 className="font-medium text-lg">Schedule a Consultation</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Have questions about your submission or feedback? Schedule a Microsoft Teams consultation with one of our experts.
                  </p>
                  
                  <TeamsScheduler 
                    submissionId={submission.id}
                    defaultDate={new Date(Date.now() + 24 * 60 * 60 * 1000)} // Tomorrow
                  />
                </div>
              )}
            </CardContent>
            
            <CardFooter>
              {submission.status === "approved" && (
                <Button className="w-full" asChild>
                  <Link to={`/payment?submissionId=${submission.id}`}>
                    Pay Now
                  </Link>
                </Button>
              )}
            </CardFooter>
          </Card>
        </div>
      </div>
    </AuthRequired>
  );
}