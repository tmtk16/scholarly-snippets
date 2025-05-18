import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import ServiceCard from "@/components/services/ServiceCard";
import type { Service } from "@shared/schema";

export default function Services() {
  const { data: services, isLoading } = useQuery<Service[]>({
    queryKey: ['/api/services'],
  });

  const features = [
    "Detailed comments on structure & organization",
    "Suggestions for clarity & flow improvement",
    "Feedback on academic tone & style",
    "Identification of argument strengths & weaknesses",
    "Grammar & mechanics review"
  ];

  return (
    <div className="container mx-auto px-4 max-w-lg">
      <h2 className="text-2xl font-bold text-primary mb-6">Our Services</h2>
      
      {/* Service List */}
      <div className="space-y-4 mb-8">
        {isLoading ? (
          // Loading skeletons
          Array(4).fill(0).map((_, index) => (
            <Card key={index}>
              <CardContent className="p-5">
                <div className="flex justify-between items-start mb-3">
                  <Skeleton className="h-6 w-40" />
                  <Skeleton className="h-6 w-20" />
                </div>
                <Skeleton className="h-4 w-full mb-2" />
                <Skeleton className="h-4 w-full mb-2" />
                <Skeleton className="h-4 w-2/3 mb-4" />
                <div className="border-t border-neutral-200 pt-3 flex justify-between items-center">
                  <Skeleton className="h-6 w-32" />
                  <Skeleton className="h-10 w-20" />
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          services?.map((service) => (
            <ServiceCard key={service.id} service={service} />
          ))
        )}
      </div>
      
      {/* Service Features */}
      <Card className="mb-8">
        <CardContent className="p-5">
          <h3 className="text-lg font-bold text-foreground mb-4">What's Included</h3>
          <ul className="space-y-3">
            {features.map((feature, index) => (
              <li key={index} className="flex items-start">
                <svg 
                  xmlns="http://www.w3.org/2000/svg" 
                  className="h-5 w-5 text-green-500 mr-2 mt-0.5" 
                  viewBox="0 0 24 24" 
                  fill="none" 
                  stroke="currentColor" 
                  strokeWidth="2" 
                  strokeLinecap="round" 
                  strokeLinejoin="round"
                >
                  <polyline points="20 6 9 17 4 12" />
                </svg>
                <span className="text-muted-foreground">{feature}</span>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
