import { format } from "date-fns";
import { Link } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { formatPrice } from "@/lib/utils";
import type { Submission } from "@shared/schema";

interface OrderCardProps {
  submission: Submission;
  service: { name: string; turnaround: number };
  showDetails?: boolean;
}

export default function OrderCard({ submission, service, showDetails = false }: OrderCardProps) {
  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case "pending_approval":
        return "secondary";
      case "approved":
        return "outline";
      case "paid":
      case "in-progress":
        return "default";
      case "completed":
        return "default";
      case "rejected":
        return "destructive";
      default:
        return "outline";
    }
  };
  
  const getStatusText = (status: string) => {
    switch (status) {
      case "pending_approval":
        return "Pending Approval";
      case "approved":
        return "Approved";
      case "paid":
        return "Paid";
      case "in-progress":
        return "In Progress";
      case "completed":
        return "Completed";
      case "rejected":
        return "Rejected";
      default:
        return status.charAt(0).toUpperCase() + status.slice(1);
    }
  };
  
  const getProgressPercentage = (status: string, submittedAt: Date) => {
    if (status === "completed") return 100;
    if (["pending_approval", "approved"].includes(status)) return 0;
    if (status === "rejected") return 0;
    
    // Calculate progress based on time elapsed for in-progress submissions
    const now = new Date();
    const submitted = new Date(submittedAt);
    const turnaroundTime = service.turnaround * 60 * 60 * 1000; // convert hours to ms
    const elapsed = now.getTime() - submitted.getTime();
    const progress = Math.min(Math.floor((elapsed / turnaroundTime) * 100), 99);
    
    return progress;
  };
  
  const calculateETA = (submittedAt: Date, turnaround: number) => {
    const submitted = new Date(submittedAt);
    const eta = new Date(submitted.getTime() + (turnaround * 60 * 60 * 1000));
    return eta;
  };
  
  const progress = getProgressPercentage(submission.status, submission.submittedAt);
  const eta = calculateETA(submission.submittedAt, service.turnaround);
  
  return (
    <Card className="shadow-sm">
      <CardContent className="p-4">
        <div className="flex justify-between items-start mb-2">
          <h4 className="font-bold text-foreground">{service.name}</h4>
          <Badge variant={getStatusBadgeVariant(submission.status)}>
            {getStatusText(submission.status)}
          </Badge>
        </div>
        
        {showDetails && (
          <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
            {submission.title}
          </p>
        )}
        
        <div className="flex justify-between items-center text-sm mb-3">
          <span className="text-muted-foreground">
            {submission.status === "completed" ? "Completed: " : "Submitted: "}
            {format(
              submission.status === "completed" && submission.completedAt 
                ? new Date(submission.completedAt) 
                : new Date(submission.submittedAt), 
              "MMM d, yyyy"
            )}
          </span>
          <span className="text-muted-foreground">{submission.wordCount} words</span>
        </div>
        
        {submission.status !== "completed" && (
          <div className="mb-3">
            <Progress value={progress} className="h-2" />
            <div className="flex justify-between text-xs mt-1">
              <span className="text-muted-foreground">
                ETA: {format(eta, "MMM d, yyyy")}
              </span>
              <span className="text-primary font-medium">
                {progress}% Complete
              </span>
            </div>
          </div>
        )}
        
        {/* Button for Approved Submissions - Pay Now */}
        {submission.status === "approved" && (
          <div className="mt-3">
            <Link href={`/payment/${submission.id}`}>
              <Button className="w-full bg-primary">
                Pay Now - {formatPrice(submission.totalPrice)}
              </Button>
            </Link>
          </div>
        )}

        {/* Button for Completed Submissions - View Feedback */}
        {submission.status === "completed" && (
          <div className="flex space-x-2 mt-3">
            <Button variant="outline" className="flex-1">
              View Feedback
            </Button>
            <Button variant="ghost" size="icon">
              <svg 
                xmlns="http://www.w3.org/2000/svg" 
                className="h-4 w-4" 
                viewBox="0 0 24 24" 
                fill="none" 
                stroke="currentColor" 
                strokeWidth="2" 
                strokeLinecap="round" 
                strokeLinejoin="round"
              >
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="7 10 12 15 17 10" />
                <line x1="12" y1="15" x2="12" y2="3" />
              </svg>
            </Button>
          </div>
        )}
        
        {/* Status message for rejected submissions */}
        {submission.status === "rejected" && (
          <div className="mt-3 p-2 bg-red-50 text-red-700 rounded text-sm">
            This submission has been rejected. Please create a new submission.
          </div>
        )}
      </CardContent>
    </Card>
  );
}
