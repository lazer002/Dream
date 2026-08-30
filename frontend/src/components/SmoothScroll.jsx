// src/components/SmoothScroll.jsx

import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import Lenis from "@studio-freight/lenis";

export default function SmoothScroll({ children }) {
  const { pathname } = useLocation();

  const isAdminPage = pathname.startsWith("/admin");

  useEffect(() => {
    if (isAdminPage) {
      window.scrollTo(0, 0);
      document.documentElement.scrollTop = 0;
      document.body.scrollTop = 0;
      return;
    }

    const lenis = new Lenis({
      duration: 1.2,
      lerp: 0.08,
      smoothWheel: true,
      smoothTouch: false,
    });

    window.lenis = lenis;

    let rafId;

    const raf = (time) => {
      lenis.raf(time);
      rafId = requestAnimationFrame(raf);
    };

    rafId = requestAnimationFrame(raf);

    // Reset scroll whenever route changes
    lenis.scrollTo(0, {
      immediate: true,
      force: true,
    });

    window.scrollTo(0, 0);
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;

    requestAnimationFrame(() => {
      lenis.scrollTo(0, {
        immediate: true,
        force: true,
      });

      window.scrollTo(0, 0);
    });

    return () => {
      cancelAnimationFrame(rafId);

      if (window.lenis === lenis) {
        delete window.lenis;
      }

      lenis.destroy();
    };
  }, [pathname, isAdminPage]);

  return children;
}