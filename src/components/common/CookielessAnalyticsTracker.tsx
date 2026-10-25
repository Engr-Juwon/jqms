import React, { useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import { trackPageView } from "@/lib/analytics";

/**
 * Automatically tracks page views on every React Router route transition
 * in a 100% cookieless, privacy-preserving manner without annoying popups.
 */
export const CookielessAnalyticsTracker: React.FC = () => {
  const location = useLocation();
  const lastTrackedPath = useRef<string>("");

  useEffect(() => {
    const currentPath = `${location.pathname}${location.search}`;
    if (currentPath !== lastTrackedPath.current) {
      lastTrackedPath.current = currentPath;
      trackPageView(location.pathname);
    }
  }, [location.pathname, location.search]);

  return null;
};
