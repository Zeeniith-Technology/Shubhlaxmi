"use client";

import { ReactLenis, useLenis } from 'lenis/react';
import { ReactNode, useEffect } from 'react';
import { usePathname } from 'next/navigation';

function ScrollToTop() {
  const pathname = usePathname();
  const lenis = useLenis();

  useEffect(() => {
    if (lenis) {
      lenis.scrollTo(0, { immediate: true });
    }
  }, [pathname, lenis]);

  return null;
}

export default function SmoothScrolling({ children }: { children: ReactNode }) {
  return (
    <ReactLenis root options={{ lerp: 0.1, duration: 1.5 }}>
      <ScrollToTop />
      {children}
    </ReactLenis>
  );
}
