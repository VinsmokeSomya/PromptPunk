'use client';

import { useEffect, useState } from 'react';

export default function ClientWrapper({ children }: { children: React.ReactNode }) {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    // Use setTimeout to ensure DOM is fully loaded
    setTimeout(() => {
      setIsMounted(true);
    }, 0);
  }, []);

  if (!isMounted) {
    return <div suppressHydrationWarning>Loading...</div>;
  }

  return <div suppressHydrationWarning>{children}</div>;
}