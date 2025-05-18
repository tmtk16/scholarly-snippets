import { Button } from "@/components/ui/button";
import { Link } from "wouter";

export default function Hero() {
  return (
    <section className="mb-8">
      <div className="relative rounded-2xl overflow-hidden h-56 mb-4">
        <img 
          src="https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=450" 
          alt="Academic writing workspace with books and papers" 
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-primary/80 to-transparent flex items-end p-6">
          <h2 className="text-white text-2xl font-bold leading-tight">
            Expert Guidance for<br />Academic Excellence
          </h2>
        </div>
      </div>
      
      <p className="text-lg text-muted-foreground mb-4">
        Professional feedback on your scholarly writing to help you express your ideas with clarity and confidence. We proudly serve students from universities across the globe.
      </p>
      
      <div className="bg-card p-4 rounded-xl shadow-sm mb-6">
        <p className="scholarly-highlight text-lg text-center mb-0">
          "We don't write for you—we empower you to become the confident, skilled writer you're meant to be."
        </p>
      </div>
      
      <div className="flex flex-wrap justify-center gap-2 mb-6">
        <span className="inline-block px-3 py-1 bg-primary/10 text-primary text-xs font-medium rounded-full">North America</span>
        <span className="inline-block px-3 py-1 bg-primary/10 text-primary text-xs font-medium rounded-full">Europe</span>
        <span className="inline-block px-3 py-1 bg-primary/10 text-primary text-xs font-medium rounded-full">Asia</span>
        <span className="inline-block px-3 py-1 bg-primary/10 text-primary text-xs font-medium rounded-full">Australia</span>
        <span className="inline-block px-3 py-1 bg-primary/10 text-primary text-xs font-medium rounded-full">Africa</span>
      </div>
      
      <p className="text-sm text-muted-foreground mb-6">
        Scholarly Snippets works with students from all academic backgrounds and regions around the world. Our team understands diverse educational systems and can provide culturally-aware feedback tailored to your specific needs.
      </p>
      
      <Link href="/submit">
        <Button className="w-full" size="lg">
          Submit Your Text
        </Button>
      </Link>
    </section>
  );
}
