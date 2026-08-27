// src/components/SmoothScroll.jsx

import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import Lenis from "@studio-freight/lenis";

export default function SmoothScroll({ children }) {
  const { pathname } = useLocation();

  const isAdminPage = pathname.startsWith("/admin");

  useEffect(() => {
    if (isAdminPage) return;

    const lenis = new Lenis({
      duration: 1.2,
      lerp: 0.08,
      smoothWheel: true,
      smoothTouch: false,
    });

    let rafId;

    const raf = (time) => {
      lenis.raf(time);
      rafId = requestAnimationFrame(raf);
    };

    rafId = requestAnimationFrame(raf);

    return () => {
      cancelAnimationFrame(rafId);
      lenis.destroy();
    };
  }, [isAdminPage]);

  return children;
}