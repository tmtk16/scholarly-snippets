import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formatPrice } from "@/lib/utils";
import type { Submission } from "@shared/schema";

export default function AdminDashboard() {
  const { data: pendingSubmissions, isLoading: pendingLoading } = useQuery({
    queryKey: ['/api/submissions/status/pending_approval'],
    queryFn: async () => {
      const res = await fetch('/api/submissions/status/pending_approval');
      if (!res.ok) throw new Error('Failed to fetch pending submissions');
      return res.json() as Promise<Submission[]>;
    }
  });

  const { data: approvedSubmissions, isLoading: approvedLoading } = useQuery({
    queryKey: ['/api/submissions/status/approved'],
    queryFn: async () => {
      const res = await fetch('/api/submissions/status/approved');
      if (!res.ok) throw new Error('Failed to fetch approved submissions');
      return res.json() as Promise<Submission[]>;
    }
  });

  const { data: paidSubmissions, isLoading: paidLoading } = useQuery({
    queryKey: ['/api/submissions/status/paid'],
    queryFn: async () => {
      const res = await fetch('/api/submissions/status/paid');
      if (!res.ok) throw new Error('Failed to fetch paid submissions');
      return res.json() as Promise<Submission[]>;
    }
  });

  const { data: completedSubmissions, isLoading: completedLoading } = useQuery({
    queryKey: ['/api/submissions/status/completed'],
    queryFn: async () => {
      const res = await fetch('/api/submissions/status/completed');
      if (!res.ok) throw new Error('Failed to fetch completed submissions');
      return res.json() as Promise<Submission[]>;
    }
  });

  const isLoading = pendingLoading || approvedLoading || paidLoading || completedLoading;

  const renderSubmissionList = (submissions: Submission[] | undefined, emptyMessage: string) => {
    if (!submissions || submissions.length === 0) {
      return <p className="text-center text-gray-500 py-8">{emptyMessage}</p>;
    }

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {submissions.map(submission => (
          <Card key={submission.id} className="shadow-sm">
            <CardHeader className="pb-2">
              <div className="flex justify-between items-start">
                <CardTitle className="text-lg">{submission.title}</CardTitle>
                <Badge variant={getStatusVariant(submission.status)}>{formatStatus(submission.status)}</Badge>
              </div>
              <CardDescription>
                Word Count: {submission.wordCount} | 
                {submission.submittedAt && ` Submitted: ${new Date(submission.submittedAt).toLocaleDateString()}`}
              </CardDescription>
            </CardHeader>
            <CardContent className="pb-2">
              <p>Total Price: {formatPrice(submission.totalPrice)}</p>
              {submission.additionalInstructions && (
                <div className="mt-2">
                  <p className="text-sm text-gray-500">Additional Instructions:</p>
                  <p className="text-sm">{submission.additionalInstructions}</p>
                </div>
              )}
            </CardContent>
            <CardFooter>
              <Button asChild className="w-full">
                <Link to={`/admin/submissions/${submission.id}`}>View Details</Link>
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>
    );
  };

  const getStatusVariant = (status: string): "default" | "destructive" | "outline" | "secondary" => {
    switch (status) {
      case "pending_approval": return "secondary";
      case "approved": return "outline";
      case "paid": return "default";
      case "completed": return "default"; // Using default instead of success
      case "rejected": return "destructive";
      default: return "outline";
    }
  };

  const formatStatus = (status: string) => {
    switch (status) {
      case "pending_approval": return "Pending Approval";
      case "approved": return "Approved";
      case "paid": return "Paid";
      case "completed": return "Completed";
      case "rejected": return "Rejected";
      default: return status.charAt(0).toUpperCase() + status.slice(1);
    }
  };

  return (
    <div className="container mx-auto py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Admin Dashboard</h1>
      </div>

      <Tabs defaultValue="pending" className="w-full">
        <TabsList className="grid grid-cols-4 mb-6">
          <TabsTrigger value="pending">
            Pending ({pendingSubmissions?.length || 0})
          </TabsTrigger>
          <TabsTrigger value="approved">
            Approved ({approvedSubmissions?.length || 0})
          </TabsTrigger>
          <TabsTrigger value="paid">
            Paid ({paidSubmissions?.length || 0})
          </TabsTrigger>
          <TabsTrigger value="completed">
            Completed ({completedSubmissions?.length || 0})
          </TabsTrigger>
        </TabsList>

        {isLoading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" aria-label="Loading"/>
          </div>
        ) : (
          <>
            <TabsContent value="pending">
              {renderSubmissionList(pendingSubmissions, "No pending submissions")}
            </TabsContent>
            <TabsContent value="approved">
              {renderSubmissionList(approvedSubmissions, "No approved submissions")}
            </TabsContent>
            <TabsContent value="paid">
              {renderSubmissionList(paidSubmissions, "No paid submissions")}
            </TabsContent>
            <TabsContent value="completed">
              {renderSubmissionList(completedSubmissions, "No completed submissions")}
            </TabsContent>
          </>
        )}
      </Tabs>
    </div>
  );
}