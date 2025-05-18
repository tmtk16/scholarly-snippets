import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import type { Service } from "@shared/schema";

export default function ServicesPreview() {
  const { data: services, isLoading } = useQuery<Service[]>({
    queryKey: ['/api/services'],
  });

  return (
    <section className="mb-8">
      <h3 className="text-xl font-bold text-primary mb-4">Our Services</h3>
      
      <div className="space-y-4">
        {isLoading ? (
          // Loading skeletons
          Array(2).fill(0).map((_, index) => (
            <Card key={index}>
              <CardContent className="p-4 flex justify-between items-center">
                <div>
                  <Skeleton className="h-5 w-36 mb-2" />
                  <Skeleton className="h-4 w-24" />
                </div>
                <div className="text-right">
                  <Skeleton className="h-5 w-16 mb-2" />
                  <Skeleton className="h-3 w-24" />
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          // Display only first two services for preview
          services?.slice(0, 2).map((service) => (
            <Card key={service.id}>
              <CardContent className="p-4 flex justify-between items-center">
                <div>
                  <h4 className="font-bold text-foreground">{service.name}</h4>
                  <p className="text-sm text-muted-foreground">
                    {service.turnaround === 24 ? "24-hour turnaround" : "3-day turnaround"}
                  </p>
                </div>
                <div className="text-right">
                  <div className="text-primary font-bold">${(service.price / 100).toFixed(2)}</div>
                  <div className="text-xs text-muted-foreground">per 500 words</div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
      
      <Link href="/services">
        <Button variant="outline" className="w-full mt-4">
          View All Services
        </Button>
      </Link>
    </section>
  );
}
