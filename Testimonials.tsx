import { Card, CardContent } from "@/components/ui/card";
import { Star } from "lucide-react";

export default function Testimonials() {
  const testimonial = {
    rating: 5,
    text: "The feedback I received helped me strengthen my dissertation proposal tremendously. My advisor was impressed with the improvements!",
    author: "Emily L., Ph.D. Candidate"
  };

  return (
    <section className="mb-8">
      <h3 className="text-xl font-bold text-primary mb-4">What Our Clients Say</h3>
      
      <Card>
        <CardContent className="p-5">
          <div>
            <div className="flex items-center mb-3">
              <div className="text-yellow-400 flex">
                {Array(testimonial.rating).fill(0).map((_, i) => (
                  <Star key={i} className="h-4 w-4 fill-current" />
                ))}
              </div>
              <div className="ml-2 text-sm text-muted-foreground">5.0</div>
            </div>
            <p className="text-foreground mb-2">
              "{testimonial.text}"
            </p>
            <p className="text-sm font-bold text-foreground">
              - {testimonial.author}
            </p>
          </div>
        </CardContent>
      </Card>
    </section>
  );
}
