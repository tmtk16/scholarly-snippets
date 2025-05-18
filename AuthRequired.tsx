import React, { useEffect } from 'react';
import { useLocation } from 'wouter';
import { useQuery } from '@tanstack/react-query';

interface AuthRequiredProps {
  children: React.ReactNode;
}

/**
 * A component that ensures a user is authenticated before rendering children
 * If not authenticated, redirects to the login page
 */
export default function AuthRequired({ children }: AuthRequiredProps) {
  const [, setLocation] = useLocation();
  
  const { data: user, isLoading, isError } = useQuery({
    queryKey: ['/api/auth/user'],
    retry: 1
  });
  
  useEffect(() => {
    if (!isLoading && isError) {
      // Not authenticated, redirect to login
      setLocation('/login');
    }
  }, [isLoading, isError, setLocation]);
  
  // Show loading state
  if (isLoading) {
    return (
      <div className="h-[60vh] flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }
  
  // Only render children if authenticated
  return isError ? null : <>{children}</>;
}