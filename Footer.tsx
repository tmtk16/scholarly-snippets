import { Link } from "wouter";

export default function Footer() {
  return (
    <footer className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-border shadow-sm">
      <div className="container mx-auto max-w-7xl">
        <div className="flex justify-around items-center h-16">
          <Link href="/">
            <div className="flex flex-col items-center justify-center text-muted-foreground hover:text-primary transition-colors cursor-pointer">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mb-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
                <polyline points="9 22 9 12 15 12 15 22"/>
              </svg>
              <span className="text-xs">Home</span>
            </div>
          </Link>
          
          <Link href="/services">
            <div className="flex flex-col items-center justify-center text-muted-foreground hover:text-primary transition-colors cursor-pointer">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mb-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/>
                <polyline points="14 2 14 8 20 8"/>
                <line x1="16" y1="13" x2="8" y2="13"/>
                <line x1="16" y1="17" x2="8" y2="17"/>
                <line x1="10" y1="9" x2="8" y2="9"/>
              </svg>
              <span className="text-xs">Services</span>
            </div>
          </Link>
          
          <Link href="/submit">
            <div className="flex flex-col items-center justify-center text-muted-foreground hover:text-primary transition-colors cursor-pointer">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mb-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                <polyline points="17 8 12 3 7 8"/>
                <line x1="12" y1="3" x2="12" y2="15"/>
              </svg>
              <span className="text-xs">Submit</span>
            </div>
          </Link>
          
          <Link href="/orders">
            <div className="flex flex-col items-center justify-center text-muted-foreground hover:text-primary transition-colors cursor-pointer">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mb-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/>
                <rect x="8" y="2" width="8" height="4" rx="1" ry="1"/>
                <path d="M9 14h6"/>
                <path d="M9 10h6"/>
                <path d="M9 18h6"/>
              </svg>
              <span className="text-xs">Orders</span>
            </div>
          </Link>
          
          <Link href="/profile">
            <div className="flex flex-col items-center justify-center text-muted-foreground hover:text-primary transition-colors cursor-pointer">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mb-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                <circle cx="12" cy="7" r="4"/>
              </svg>
              <span className="text-xs">Profile</span>
            </div>
          </Link>
        </div>
      </div>
    </footer>
  );
}
