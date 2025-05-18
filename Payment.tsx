import { useState, useEffect } from "react";
import { useLocation, useParams } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { CheckCircle, AlertTriangle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { formatPrice } from "@/lib/utils";
import PayPalButton from "@/components/payment/PayPalButton";
import { apiRequest } from "@/lib/queryClient";
import type { Submission } from "@shared/schema";

export default function Payment() {
  const { id } = useParams<{ id: string }>();
  const submissionId = parseInt(id);
  const [paymentStatus, setPaymentStatus] = useState<"idle" | "processing" | "success" | "error">("idle");
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [, navigate] = useLocation();

  // Fetch submission details
  const { data: submission, isLoading } = useQuery({
    queryKey: ['/api/submissions', submissionId],
    queryFn: async () => {
      const res = await fetch(`/api/submissions/${submissionId}`);
      if (!res.ok) throw new Error('Failed to fetch submission');
      return res.json() as Promise<Submission>;
    }
  });

  // Update payment status mutation
  const paymentSuccessMutation = useMutation({
    mutationFn: async (paymentIntentId: string) => {
      return apiRequest("POST", `/api/submissions/${submissionId}/payment-success`, { 
        paymentIntentId 
      });
    },
    onSuccess: () => {
      setPaymentStatus("success");
      queryClient.invalidateQueries({ queryKey: ['/api/submissions', submissionId] });
      queryClient.invalidateQueries({ queryKey: ['/api/submissions/status/approved'] });
      queryClient.invalidateQueries({ queryKey: ['/api/submissions/status/paid'] });
      toast({
        title: "Payment Successful",
        description: "Your payment has been processed successfully. We'll start working on your submission right away!",
        variant: "default"
      });
    },
    onError: (error: any) => {
      setPaymentStatus("error");
      toast({
        title: "Payment Error",
        description: error.message || "There was an error processing your payment. Please try again.",
        variant: "destructive"
      });
    }
  });

  // Handle PayPal payment completion
  const handlePaymentSuccess = async (paymentId: string) => {
    setPaymentStatus("processing");
    paymentSuccessMutation.mutate(paymentId);
  };

  // If already paid, redirect to orders page
  useEffect(() => {
    if (submission && submission.status === "paid") {
      toast({
        title: "Already Paid",
        description: "This submission has already been paid for.",
      });
      navigate("/orders");
    }
  }, [submission, navigate, toast]);

  if (isLoading) {
    return (
      <div className="container mx-auto py-12 flex justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" aria-label="Loading"/>
      </div>
    );
  }

  if (!submission) {
    return (
      <div className="container mx-auto py-12">
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>
            Submission not found. The submission may have been deleted or you don't have access.
          </AlertDescription>
        </Alert>
        <Button className="mt-4" onClick={() => navigate("/orders")}>
          Return to Orders
        </Button>
      </div>
    );
  }

  // Only allow payment for approved submissions
  if (submission.status !== "approved") {
    return (
      <div className="container mx-auto py-12">
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Payment Not Available</AlertTitle>
          <AlertDescription>
            {submission.status === "pending_approval" 
              ? "This submission is still pending approval and cannot be paid for yet."
              : submission.status === "rejected"
              ? "This submission has been rejected and cannot be paid for."
              : submission.status === "paid" || submission.status === "completed"
              ? "This submission has already been paid for."
              : "This submission cannot be paid for in its current state."}
          </AlertDescription>
        </Alert>
        <Button className="mt-4" onClick={() => navigate("/orders")}>
          Return to Orders
        </Button>
      </div>
    );
  }

  // Show success message after payment
  if (paymentStatus === "success") {
    return (
      <div className="container mx-auto py-12 max-w-md">
        <Card>
          <CardHeader>
            <div className="flex justify-center mb-4">
              <CheckCircle className="h-16 w-16 text-green-500" />
            </div>
            <CardTitle className="text-center text-2xl">Payment Successful!</CardTitle>
            <CardDescription className="text-center">
              Your payment for {submission.title} has been processed successfully.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center space-y-4">
            <p className="text-center">
              We'll start working on your submission right away. You can track the status in your orders page.
            </p>
            <Button onClick={() => navigate("/orders")}>
              View Your Orders
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Calculate amount as dollars with 2 decimal places
  const amountInDollars = (submission.totalPrice / 100).toFixed(2);

  return (
    <div className="container mx-auto py-12 max-w-md">
      <Card>
        <CardHeader>
          <CardTitle>Complete Your Payment</CardTitle>
          <CardDescription>
            Pay for your submission to start receiving feedback
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <h3 className="font-medium">Submission Details</h3>
            <p className="text-sm">{submission.title}</p>
            <div className="flex justify-between">
              <span>Word Count:</span>
              <span>{submission.wordCount} words</span>
            </div>
            <div className="flex justify-between font-medium">
              <span>Total:</span>
              <span>{formatPrice(submission.totalPrice)}</span>
            </div>
          </div>

          <div className="pt-4 space-y-4">
            <h3 className="font-medium">Pay with PayPal</h3>
            <div className="p-4 border rounded-md flex justify-center">
              {paymentStatus === "processing" ? (
                <div className="flex flex-col items-center space-y-2">
                  <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full"></div>
                  <p>Processing your payment...</p>
                </div>
              ) : (
                <div className="w-full">
                  <div className="bg-blue-50 text-blue-700 rounded-md p-4 mb-4 text-sm">
                    <p>Click the PayPal button below to complete your payment of {formatPrice(submission.totalPrice)}</p>
                  </div>
                  <Button 
                    variant="outline" 
                    className="w-full h-12 flex items-center justify-center bg-[#ffc439] hover:bg-[#f0b72c] text-black border-[#ffc439] hover:border-[#f0b72c]"
                    style={{ backgroundColor: "#ffc439", borderColor: "#ffc439" }}
                    id="paypal-button"
                  >
                    <span className="font-bold">PayPal Checkout</span>
                  </Button>
                  <PayPalButton 
                    amount={amountInDollars}
                    currency="USD"
                    intent="CAPTURE"
                  />
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}