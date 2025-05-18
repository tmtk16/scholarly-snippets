import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useLocation } from "wouter";
import type { Service } from "@shared/schema";

interface ServiceCardProps {
  service: Service;
  onSelect?: (serviceId: number) => void;
}

export default function ServiceCard({ service, onSelect }: ServiceCardProps) {
  const [, navigate] = useLocation();

  const handleSelect = () => {
    if (onSelect) {
      onSelect(service.id);
    } else {
      navigate(`/submit?serviceId=${service.id}`);
    }
  };

  return (
    <Card className="shadow-sm">
      <CardContent className="p-5">
        <div className="flex justify-between items-start mb-3">
          <h3 className="text-xl font-bold text-foreground">{service.name}</h3>
          <Badge variant={service.isExpress ? "destructive" : "secondary"}>
            {service.turnaround === 24 ? "24 Hours" : "3 Days"}
          </Badge>
        </div>
        
        <p className="text-muted-foreground mb-4">
          {service.description}
        </p>
        
        <Separator className="my-3" />
        
        <div className="flex justify-between items-center">
          <div className="text-lg font-bold text-primary">
            ${(service.price / 100).toFixed(2)} per 500 words
          </div>
          <Button onClick={handleSelect}>
            Select
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
