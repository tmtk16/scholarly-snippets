import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { Menu, X, User, LogIn } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useQuery } from "@tanstack/react-query";

export default function Header() {
  const [location] = useLocation();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  // Check if user is logged in
  const { data: user, isLoading } = useQuery({
    queryKey: ['/api/auth/user'],
    retry: false,
  });
  
  const isAuthenticated = !!user;

  // Common navigation items for all users
  const commonNavItems = [
    { title: "Home", href: "/" },
    { title: "Services", href: "/services" },
  ];
  
  // Navigation items for authenticated users
  const authNavItems = [
    { title: "Submit", href: "/submit" },
    { title: "Orders", href: "/orders" },
    { title: "Profile", href: "/profile" },
  ];
  
  // Navigation items based on authentication status
  const navItems = isAuthenticated 
    ? [...commonNavItems, ...authNavItems]
    : commonNavItems;

  // Handle scroll events for header styling
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-200 ${
        isScrolled ? "bg-white/95 backdrop-blur-md shadow-sm" : "bg-white"
      }`}
    >
      <div className="container mx-auto flex items-center justify-between p-4">
        <Link href="/">
          <div className="text-2xl font-serif font-bold text-primary">
            Scholarly Snippets
          </div>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center space-x-6">
          {navItems.map((item) => (
            <Link key={item.href} href={item.href}>
              <div
                className={`text-sm font-medium transition-colors cursor-pointer ${
                  location === item.href
                    ? "text-primary"
                    : "text-muted-foreground hover:text-primary"
                }`}
              >
                {item.title}
              </div>
            </Link>
          ))}
          
          {isAuthenticated ? (
            <Link href="/profile">
              <Button variant="outline" size="sm" className="flex items-center gap-1">
                <User className="h-4 w-4" />
                Profile
              </Button>
            </Link>
          ) : (
            <div className="flex items-center gap-2">
              <Link href="/login">
                <Button variant="ghost" size="sm" className="flex items-center gap-1">
                  <LogIn className="h-4 w-4" />
                  Login
                </Button>
              </Link>
              <Link href="/register">
                <Button variant="outline" size="sm">
                  Register
                </Button>
              </Link>
            </div>
          )}
          
          <Link href="/admin">
            <Button variant="ghost" size="sm">
              Admin
            </Button>
          </Link>
        </nav>

        {/* Mobile Navigation */}
        <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
          <SheetTrigger asChild className="md:hidden">
            <Button variant="ghost" size="icon">
              <Menu className="h-6 w-6" />
              <span className="sr-only">Open menu</span>
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="w-[300px] sm:w-[400px]">
            <nav className="flex flex-col mt-10 space-y-4">
              {navItems.map((item) => (
                <Link key={item.href} href={item.href}>
                  <div
                    className={`text-lg font-medium py-2 px-4 rounded-md transition-colors cursor-pointer ${
                      location === item.href
                        ? "bg-primary/10 text-primary"
                        : "hover:bg-muted hover:text-primary"
                    }`}
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    {item.title}
                  </div>
                </Link>
              ))}
              
              <div className="border-t my-2 pt-2">
                {!isAuthenticated && (
                  <>
                    <Link href="/login">
                      <div
                        className="text-lg font-medium py-2 px-4 rounded-md transition-colors cursor-pointer hover:bg-muted hover:text-primary flex items-center gap-2"
                        onClick={() => setIsMobileMenuOpen(false)}
                      >
                        <LogIn className="h-5 w-5" />
                        Login
                      </div>
                    </Link>
                    <Link href="/register">
                      <div
                        className="text-lg font-medium py-2 px-4 rounded-md transition-colors cursor-pointer hover:bg-muted hover:text-primary"
                        onClick={() => setIsMobileMenuOpen(false)}
                      >
                        Register
                      </div>
                    </Link>
                  </>
                )}
                <Link href="/admin">
                  <div
                    className="text-lg font-medium py-2 px-4 rounded-md transition-colors cursor-pointer hover:bg-muted hover:text-primary"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    Admin Dashboard
                  </div>
                </Link>
              </div>
            </nav>
          </SheetContent>
        </Sheet>
      </div>
    </header>
  );
}
