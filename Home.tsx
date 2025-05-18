import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Link } from "wouter";
import Hero from "@/components/home/Hero";
import ServicesPreview from "@/components/home/ServicesPreview";
import HowItWorks from "@/components/home/HowItWorks";
import Testimonials from "@/components/home/Testimonials";

export default function Home() {
  return (
    <div className="container mx-auto px-4 max-w-lg">
      <Hero />
      
      <ServicesPreview />
      
      <HowItWorks />
      
      <Testimonials />
      
      {/* CTA Section */}
      <section className="mb-8">
        <Card className="bg-primary text-white">
          <CardContent className="p-6 text-center">
            <h3 className="text-xl font-bold mb-3">Ready to elevate your academic writing?</h3>
            <p className="mb-4 opacity-90">Get started with your first submission today.</p>
            <Link href="/submit">
              <Button variant="secondary" className="w-full">
                Submit Your Text
              </Button>
            </Link>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
