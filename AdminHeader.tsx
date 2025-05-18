import { useLocation, Link } from "wouter";
import { Button } from "@/components/ui/button";

export default function AdminHeader() {
  const [location] = useLocation();
  
  return (
    <header className="bg-white border-b border-gray-200 py-4">
      <div className="container mx-auto flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <h1 className="text-xl font-bold text-primary">Scholarly Snippets</h1>
          <div className="bg-gray-100 text-gray-600 text-xs px-2 py-1 rounded-md">Admin</div>
        </div>
        
        <nav className="flex items-center space-x-4">
          <Button 
            variant={location === "/admin" ? "default" : "ghost"}
            size="sm"
            asChild
          >
            <Link href="/admin">Dashboard</Link>
          </Button>
          
          <Button variant="outline" size="sm" asChild>
            <Link href="/">Back to Site</Link>
          </Button>
        </nav>
      </div>
    </header>
  );
}