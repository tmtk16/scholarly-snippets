import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { z } from "zod";
import { useLocation } from "wouter";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { FileUpload } from "@/components/ui/file-upload";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { submissionValidationSchema } from "@shared/schema";
import AcademicIntegrityTerms from "./AcademicIntegrityTerms";

interface SubmissionFormProps {
  serviceId: number;
  wordCount: number;
  isAuthenticated?: boolean;
  onSubmitAttempt?: () => void;
}

// Extend the submission schema for the form
const formSchema = submissionValidationSchema.extend({
  file: z.instanceof(File).optional(),
  promptInstructions: z.string().min(10, "Paper prompt/instructions is required and must be at least 10 characters"),
});

type FormData = z.infer<typeof formSchema>;

export default function SubmissionForm({ serviceId, wordCount, isAuthenticated, onSubmitAttempt }: SubmissionFormProps) {
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const [submissionType, setSubmissionType] = useState<"text" | "file">("text");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [wordCountFromText, setWordCountFromText] = useState(0);
  
  // Create form
  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      serviceId,
      title: "",
      content: "",
      wordCount,
      additionalInstructions: "",
      promptInstructions: "",
      termsAccepted: false,
    },
  });
  
  // Update word count from content
  const countWords = (text: string) => {
    const count = text.trim() ? text.trim().split(/\s+/).length : 0;
    setWordCountFromText(count);
    form.setValue("wordCount", count);
    return count;
  };
  
  // Handle file upload
  const handleFileSelected = (file: File) => {
    setSelectedFile(file);
    form.setValue("file", file);
  };
  
  // Handle submission
  const textSubmissionMutation = useMutation({
    mutationFn: async (data: FormData) => {
      const response = await apiRequest("POST", "/api/submissions/text", {
        serviceId: data.serviceId,
        title: data.title,
        content: data.content,
        wordCount: data.wordCount,
        additionalInstructions: data.additionalInstructions,
        promptInstructions: data.promptInstructions,
      });
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Submission Successful",
        description: "Your text has been submitted for review.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/submissions'] });
      navigate("/orders");
    },
    onError: (error) => {
      toast({
        title: "Submission Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  const fileSubmissionMutation = useMutation({
    mutationFn: async (data: FormData) => {
      const formData = new FormData();
      formData.append("serviceId", data.serviceId.toString());
      formData.append("title", data.title);
      formData.append("wordCount", data.wordCount.toString());
      formData.append("promptInstructions", data.promptInstructions);
      
      if (data.additionalInstructions) {
        formData.append("additionalInstructions", data.additionalInstructions);
      }
      
      if (data.file) {
        formData.append("file", data.file);
      }
      
      const response = await fetch("/api/submissions/file", {
        method: "POST",
        body: formData,
        credentials: "include",
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || response.statusText);
      }
      
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Submission Successful",
        description: "Your file has been submitted for review.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/submissions'] });
      navigate("/orders");
    },
    onError: (error) => {
      toast({
        title: "Submission Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  const onSubmit = (data: FormData) => {
    // Check if user is authenticated before proceeding
    if (!isAuthenticated && onSubmitAttempt) {
      onSubmitAttempt();
      return;
    }
    
    if (submissionType === "text") {
      textSubmissionMutation.mutate(data);
    } else {
      fileSubmissionMutation.mutate(data);
    }
  };
  
  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Submit Your Document</CardTitle>
          </CardHeader>
          <CardContent>
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem className="mb-4">
                  <FormLabel>Document Title</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Research Paper on Climate Change" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <Tabs 
              defaultValue="text" 
              value={submissionType} 
              onValueChange={(value) => setSubmissionType(value as "text" | "file")}
              className="mt-4"
            >
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="text">Paste Text</TabsTrigger>
                <TabsTrigger value="file">Upload File</TabsTrigger>
              </TabsList>
              
              <TabsContent value="text">
                <Card className="border-0 shadow-none">
                  <CardContent className="p-0 pt-4">
                    <FormField
                      control={form.control}
                      name="content"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Paste Your Text</FormLabel>
                          <FormControl>
                            <Textarea 
                              placeholder="Paste your text here..." 
                              className="min-h-[200px]" 
                              {...field}
                              onChange={(e) => {
                                field.onChange(e);
                                countWords(e.target.value);
                              }}
                            />
                          </FormControl>
                          <p className="text-xs text-right text-muted-foreground mt-1">
                            {wordCountFromText} words
                          </p>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </CardContent>
                </Card>
              </TabsContent>
              
              <TabsContent value="file">
                <Card className="border-0 shadow-none">
                  <CardContent className="p-0 pt-4">
                    <FormField
                      control={form.control}
                      name="file"
                      render={({ field: { value, onChange, ...field } }) => (
                        <FormItem>
                          <FormLabel>Upload Your Document</FormLabel>
                          <FormControl>
                            <FileUpload
                              onFileSelected={handleFileSelected}
                              supportedFormats={[".pdf", ".docx", ".txt"]}
                              maxSize={5 * 1024 * 1024} // 5MB
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Original Assignment Prompt</CardTitle>
          </CardHeader>
          <CardContent>
            <FormField
              control={form.control}
              name="promptInstructions"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    <span className="text-rose-500 mr-1">*</span>
                    Assignment Prompt/Instructions
                  </FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Please paste the original assignment prompt or instructions given to you by your professor/instructor. This is required to provide accurate feedback." 
                      className="min-h-[120px]" 
                      {...field}
                    />
                  </FormControl>
                  <p className="text-xs text-muted-foreground mt-1">
                    Understanding the original assignment requirements is crucial for providing relevant feedback.
                  </p>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Additional Instructions</CardTitle>
          </CardHeader>
          <CardContent>
            <FormField
              control={form.control}
              name="additionalInstructions"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <Textarea 
                      placeholder="Any specific areas of focus or concerns? (Optional)" 
                      className="min-h-[100px]" 
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>
        
        <AcademicIntegrityTerms 
          accepted={form.watch("termsAccepted")}
          onAcceptChange={(accepted) => form.setValue("termsAccepted", accepted, { shouldValidate: true })}
        />
        
        <Button 
          type="submit" 
          className="w-full"
          disabled={
            textSubmissionMutation.isPending || 
            fileSubmissionMutation.isPending ||
            !form.formState.isValid
          }
        >
          {textSubmissionMutation.isPending || fileSubmissionMutation.isPending
            ? "Submitting..."
            : "Submit for Review"
          }
        </Button>
      </form>
    </Form>
  );
}
