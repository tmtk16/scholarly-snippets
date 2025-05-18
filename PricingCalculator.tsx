import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import type { Service } from "@shared/schema";

interface PricingCalculatorProps {
  wordCount: number;
  onWordCountChange: (count: number) => void;
  onServiceChange: (serviceId: number) => void;
  selectedServiceId?: number;
}

export default function PricingCalculator({ 
  wordCount, 
  onWordCountChange, 
  onServiceChange,
  selectedServiceId 
}: PricingCalculatorProps) {
  const { data: services, isLoading } = useQuery<Service[]>({
    queryKey: ['/api/services'],
  });
  
  const [price, setPrice] = useState(0);
  
  // Calculate price whenever word count or selected service changes
  useEffect(() => {
    if (services && selectedServiceId) {
      const selectedService = services.find(s => s.id === selectedServiceId);
      if (selectedService) {
        const units = Math.ceil(wordCount / 500);
        setPrice(units * selectedService.price / 100);
      }
    }
  }, [wordCount, selectedServiceId, services]);
  
  // Default to the first service if none is selected
  useEffect(() => {
    if (!selectedServiceId && services && services.length > 0) {
      onServiceChange(services[0].id);
    }
  }, [services, selectedServiceId, onServiceChange]);
  
  const handleServiceChange = (value: string) => {
    onServiceChange(parseInt(value));
  };
  
  const handleWordCountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const count = parseInt(e.target.value) || 0;
    onWordCountChange(count);
  };
  
  const handleCalculateClick = () => {
    // This would be used if we had a separate text content to calculate from
    // For now, it's a placeholder for potential future functionality
  };
  
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle><Skeleton className="h-6 w-36" /></CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Pricing Calculator</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div>
            <Label htmlFor="service-type">Service Type</Label>
            <Select 
              value={selectedServiceId?.toString()} 
              onValueChange={handleServiceChange}
            >
              <SelectTrigger id="service-type">
                <SelectValue placeholder="Select a service" />
              </SelectTrigger>
              <SelectContent>
                {services?.map(service => (
                  <SelectItem key={service.id} value={service.id.toString()}>
                    {service.name} ({service.turnaround === 24 ? "24 hours" : "3 days"}) - ${service.price/100} per 500 words
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div>
            <Label htmlFor="word-count">Word Count</Label>
            <div className="flex space-x-2">
              <Input
                id="word-count"
                type="number"
                min="1"
                value={wordCount || ""}
                onChange={handleWordCountChange}
                placeholder="Enter word count"
              />
              <Button 
                variant="outline" 
                onClick={handleCalculateClick}
                className="whitespace-nowrap"
              >
                Calculate
              </Button>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Or paste your text below to auto-calculate
            </p>
          </div>
          
          <Separator />
          
          <div className="flex justify-between items-center">
            <span className="text-foreground font-medium">Estimated Price:</span>
            <span className="text-xl font-bold text-primary">${price.toFixed(2)}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
