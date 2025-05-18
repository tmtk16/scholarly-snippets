import * as React from "react";
import { useCallback, useState } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { UploadCloud } from "lucide-react";

interface FileUploadProps extends React.InputHTMLAttributes<HTMLInputElement> {
  onFileSelected?: (file: File) => void;
  supportedFormats?: string[];
  maxSize?: number; // in bytes
  className?: string;
}

export function FileUpload({
  onFileSelected,
  supportedFormats = [".pdf", ".docx", ".txt"],
  maxSize = 5 * 1024 * 1024, // 5MB default
  className,
  ...props
}: FileUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const validateFile = (file: File): boolean => {
    // Check file size
    if (file.size > maxSize) {
      setErrorMessage(`File size exceeds the limit of ${maxSize / (1024 * 1024)}MB`);
      return false;
    }
    
    // Check file type
    const fileExtension = `.${file.name.split('.').pop()?.toLowerCase()}`;
    if (!supportedFormats.some(format => format.toLowerCase() === fileExtension)) {
      setErrorMessage(`Unsupported file format. Please use: ${supportedFormats.join(', ')}`);
      return false;
    }
    
    setErrorMessage(null);
    return true;
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (validateFile(file)) {
        setFileName(file.name);
        onFileSelected?.(file);
      } else {
        setFileName(null);
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      }
    }
  };

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    
    const file = e.dataTransfer.files?.[0];
    if (file) {
      if (validateFile(file)) {
        setFileName(file.name);
        onFileSelected?.(file);
        
        // Update the input element for form submission
        if (fileInputRef.current) {
          const dataTransfer = new DataTransfer();
          dataTransfer.items.add(file);
          fileInputRef.current.files = dataTransfer.files;
        }
      }
    }
  }, [onFileSelected, validateFile]);

  const handleButtonClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className={cn("w-full", className)}>
      <div
        className={cn(
          "border-2 border-dashed rounded-xl p-8 text-center transition-colors",
          isDragging ? "border-primary bg-primary/5" : "border-input",
          errorMessage ? "border-destructive" : ""
        )}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <UploadCloud className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
        {fileName ? (
          <div className="text-sm font-medium text-foreground mb-2">
            Selected file: {fileName}
          </div>
        ) : (
          <>
            <p className="text-sm font-medium text-foreground mb-2">
              Drag & drop your document here
            </p>
            <p className="text-xs text-muted-foreground mb-4">
              Supported formats: {supportedFormats.join(', ')}
            </p>
          </>
        )}
        
        <Button 
          type="button" 
          variant="outline" 
          onClick={handleButtonClick}
          className="mt-2"
        >
          Browse Files
        </Button>
        
        <input
          type="file"
          ref={fileInputRef}
          className="hidden"
          onChange={handleFileChange}
          accept={supportedFormats.join(',')}
          {...props}
        />
      </div>
      
      {errorMessage && (
        <p className="text-xs text-destructive mt-2">{errorMessage}</p>
      )}
    </div>
  );
}
