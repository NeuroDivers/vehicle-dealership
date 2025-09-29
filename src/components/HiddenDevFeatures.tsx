'use client';

import { useEffect, useState } from 'react';

// Hidden dev emails - keep in sync with backend
const HIDDEN_DEV_EMAILS = ['nick@neurodivers.ca'];

interface HiddenDevFeaturesProps {
  userEmail?: string;
  children?: React.ReactNode;
}

export function HiddenDevFeatures({ userEmail, children }: HiddenDevFeaturesProps) {
  const [isHiddenDev, setIsHiddenDev] = useState(false);

  useEffect(() => {
    // Check if current user is a hidden dev
    if (userEmail && HIDDEN_DEV_EMAILS.includes(userEmail.toLowerCase())) {
      setIsHiddenDev(true);
    }
  }, [userEmail]);

  // Only render children if user is a hidden dev
  if (!isHiddenDev) {
    return null;
  }

  return <>{children}</>;
}

// Hook to check if current user is a hidden dev
export function useHiddenDev(userEmail?: string): boolean {
  const [isHiddenDev, setIsHiddenDev] = useState(false);

  useEffect(() => {
    if (userEmail && HIDDEN_DEV_EMAILS.includes(userEmail.toLowerCase())) {
      setIsHiddenDev(true);
    }
  }, [userEmail]);

  return isHiddenDev;
}

// Component that shows dev badge only to hidden devs
export function HiddenDevBadge({ userEmail }: { userEmail?: string }) {
  const isHiddenDev = useHiddenDev(userEmail);

  if (!isHiddenDev) {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 bg-purple-600 text-white px-3 py-1 rounded-full text-xs font-mono opacity-50 hover:opacity-100 transition-opacity">
      DEV MODE
    </div>
  );
}

// Component that shows different content based on dev status
export function DevConditionalContent({ 
  userEmail, 
  devContent, 
  normalContent 
}: { 
  userEmail?: string;
  devContent: React.ReactNode;
  normalContent: React.ReactNode;
}) {
  const isHiddenDev = useHiddenDev(userEmail);
  return <>{isHiddenDev ? devContent : normalContent}</>;
}
