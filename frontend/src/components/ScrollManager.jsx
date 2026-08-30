// ScrollManager.jsx

import { useLayoutEffect } from "react";
import { useLocation } from "react-router-dom";

export default function ScrollManager() {
  const location = useLocation();

  useLayoutEffect(() => {
    window.history.scrollRestoration = "manual";

    const scrollTop = () => {
      window.scrollTo(0, 0);
      document.documentElement.scrollTop = 0;
      document.body.scrollTop = 0;

      if (window.lenis) {
        window.lenis.scrollTo(0, {
          immediate: true,
          force: true,
        });
      }
    };

    scrollTop();

    const raf1 = requestAnimationFrame(scrollTop);

    const raf2 = requestAnimationFrame(() => {
      requestAnimationFrame(scrollTop);
    });

    const timeout = setTimeout(scrollTop, 100);

    return () => {
      cancelAnimationFrame(raf1);
      cancelAnimationFrame(raf2);
      clearTimeout(timeout);
    };
  }, [location.key]);

  return null;
}