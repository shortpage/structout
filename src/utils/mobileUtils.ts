/* ------------------------------------------------------------------
 * Mobile Utilities
 * Helper functions and hooks for mobile responsiveness
 * ------------------------------------------------------------------ */

import { useState, useEffect, useCallback } from "react";

/* ------------------------------------------------------------------ */
/* Responsive Detection Hook                                          */
/* ------------------------------------------------------------------ */
export const useResponsive = () => {
  const [screenSize, setScreenSize] = useState(() => {
    if (typeof window === "undefined") return { width: 1024, height: 768 };
    return { width: window.innerWidth, height: window.innerHeight };
  });

  useEffect(() => {
    const handleResize = () => {
      setScreenSize({ width: window.innerWidth, height: window.innerHeight });
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const isMobile = screenSize.width < 768;
  const isTablet = screenSize.width >= 768 && screenSize.width < 1024;
  const isDesktop = screenSize.width >= 1024;

  return {
    isMobile,
    isTablet,
    isDesktop,
    screenSize,
    breakpoint: isMobile ? "mobile" : isTablet ? "tablet" : "desktop",
  };
};

/* ------------------------------------------------------------------ */
/* Viewport Height Fix for Mobile Safari                             */
/* ------------------------------------------------------------------ */
export const useViewportHeight = () => {
  useEffect(() => {
    const setVH = () => {
      const vh = window.innerHeight * 0.01;
      document.documentElement.style.setProperty("--vh", `${vh}px`);
    };

    setVH();
    window.addEventListener("resize", setVH);
    window.addEventListener("orientationchange", setVH);

    return () => {
      window.removeEventListener("resize", setVH);
      window.removeEventListener("orientationchange", setVH);
    };
  }, []);
};

/* ------------------------------------------------------------------ */
/* Debounce Hook for Performance                                      */
/* ------------------------------------------------------------------ */
export const useDebounce = <T>(value: T, delay: number): T => {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
};

/* ------------------------------------------------------------------ */
/* Touch Handler Hook                                                 */
/* ------------------------------------------------------------------ */
interface TouchHandlers {
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  onSwipeUp?: () => void;
  onSwipeDown?: () => void;
}

export const useTouchHandlers = (handlers: TouchHandlers) => {
  const [startTouch, setStartTouch] = useState<{ x: number; y: number } | null>(
    null,
  );

  const onTouchStart = useCallback((e: React.TouchEvent) => {
    const touch = e.touches[0];
    if (touch) {
      setStartTouch({ x: touch.clientX, y: touch.clientY });
    }
  }, []);

  const onTouchEnd = useCallback(
    (e: React.TouchEvent) => {
      if (!startTouch) return;

      const touch = e.changedTouches[0];
      if (!touch) return;

      const deltaX = touch.clientX - startTouch.x;
      const deltaY = touch.clientY - startTouch.y;
      const minSwipeDistance = 50;

      if (Math.abs(deltaX) > Math.abs(deltaY)) {
        // Horizontal swipe
        if (Math.abs(deltaX) > minSwipeDistance) {
          if (deltaX > 0 && handlers.onSwipeRight) {
            handlers.onSwipeRight();
          } else if (deltaX < 0 && handlers.onSwipeLeft) {
            handlers.onSwipeLeft();
          }
        }
      } else {
        // Vertical swipe
        if (Math.abs(deltaY) > minSwipeDistance) {
          if (deltaY > 0 && handlers.onSwipeDown) {
            handlers.onSwipeDown();
          } else if (deltaY < 0 && handlers.onSwipeUp) {
            handlers.onSwipeUp();
          }
        }
      }

      setStartTouch(null);
    },
    [startTouch, handlers],
  );

  return { onTouchStart, onTouchEnd };
};

/* ------------------------------------------------------------------ */
/* Mobile Detection Utilities                                        */
/* ------------------------------------------------------------------ */
export const isMobileDevice = (): boolean => {
  if (typeof window === "undefined") return false;

  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
    navigator.userAgent,
  );
};

export const isIOSDevice = (): boolean => {
  if (typeof window === "undefined") return false;

  return /iPad|iPhone|iPod/.test(navigator.userAgent);
};

export const isTouchDevice = (): boolean => {
  if (typeof window === "undefined") return false;

  return "ontouchstart" in window || navigator.maxTouchPoints > 0;
};

/* ------------------------------------------------------------------ */
/* Orientation Detection                                              */
/* ------------------------------------------------------------------ */
export const useOrientation = () => {
  const [orientation, setOrientation] = useState<"portrait" | "landscape">(
    () => {
      if (typeof window === "undefined") return "portrait";
      return window.innerHeight > window.innerWidth ? "portrait" : "landscape";
    },
  );

  useEffect(() => {
    const handleOrientationChange = () => {
      setOrientation(
        window.innerHeight > window.innerWidth ? "portrait" : "landscape",
      );
    };

    window.addEventListener("resize", handleOrientationChange);
    window.addEventListener("orientationchange", handleOrientationChange);

    return () => {
      window.removeEventListener("resize", handleOrientationChange);
      window.removeEventListener("orientationchange", handleOrientationChange);
    };
  }, []);

  return orientation;
};

/* ------------------------------------------------------------------ */
/* Safe Area Detection (for notched devices)                         */
/* ------------------------------------------------------------------ */
export const useSafeArea = () => {
  const [safeArea, setSafeArea] = useState({
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
  });

  useEffect(() => {
    const updateSafeArea = () => {
      const style = getComputedStyle(document.documentElement);
      setSafeArea({
        top: parseInt(style.getPropertyValue("env(safe-area-inset-top)")) || 0,
        bottom:
          parseInt(style.getPropertyValue("env(safe-area-inset-bottom)")) || 0,
        left:
          parseInt(style.getPropertyValue("env(safe-area-inset-left)")) || 0,
        right:
          parseInt(style.getPropertyValue("env(safe-area-inset-right)")) || 0,
      });
    };

    updateSafeArea();
    window.addEventListener("resize", updateSafeArea);
    window.addEventListener("orientationchange", updateSafeArea);

    return () => {
      window.removeEventListener("resize", updateSafeArea);
      window.removeEventListener("orientationchange", updateSafeArea);
    };
  }, []);

  return safeArea;
};

/* ------------------------------------------------------------------ */
/* Performance Optimization Utilities                                */
/* ------------------------------------------------------------------ */
export const throttle = <T extends (...args: any[]) => any>(
  func: T,
  delay: number,
): T => {
  let timeoutId: NodeJS.Timeout | null = null;
  let lastExecTime = 0;

  return ((...args: Parameters<T>) => {
    const currentTime = Date.now();

    if (currentTime - lastExecTime > delay) {
      func(...args);
      lastExecTime = currentTime;
    } else {
      if (timeoutId) clearTimeout(timeoutId);
      timeoutId = setTimeout(
        () => {
          func(...args);
          lastExecTime = Date.now();
        },
        delay - (currentTime - lastExecTime),
      );
    }
  }) as T;
};

/* ------------------------------------------------------------------ */
/* Clipboard Utilities with Mobile Fallback                         */
/* ------------------------------------------------------------------ */
export const copyToClipboard = async (text: string): Promise<boolean> => {
  try {
    // Modern clipboard API
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
      return true;
    }

    // Fallback for older browsers or non-secure contexts
    const textArea = document.createElement("textarea");
    textArea.value = text;
    textArea.style.position = "absolute";
    textArea.style.left = "-999999px";
    textArea.style.top = "-999999px";
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();

    const success = document.execCommand("copy");
    document.body.removeChild(textArea);

    return success;
  } catch (error) {
    console.error("Failed to copy text:", error);
    return false;
  }
};

/* ------------------------------------------------------------------ */
/* Local Storage with Error Handling                                 */
/* ------------------------------------------------------------------ */
export const safeLocalStorage = {
  getItem: (key: string): string | null => {
    try {
      return localStorage.getItem(key);
    } catch (error) {
      console.warn("localStorage.getItem failed:", error);
      return null;
    }
  },

  setItem: (key: string, value: string): boolean => {
    try {
      localStorage.setItem(key, value);
      return true;
    } catch (error) {
      console.warn("localStorage.setItem failed:", error);
      return false;
    }
  },

  removeItem: (key: string): boolean => {
    try {
      localStorage.removeItem(key);
      return true;
    } catch (error) {
      console.warn("localStorage.removeItem failed:", error);
      return false;
    }
  },
};

/* ------------------------------------------------------------------ */
/* Download Utilities for Mobile                                     */
/* ------------------------------------------------------------------ */
export const triggerDownload = (blob: Blob, filename: string): void => {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = filename;
  link.style.display = "none";

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  // Clean up the URL object
  setTimeout(() => URL.revokeObjectURL(url), 100);
};

/* ------------------------------------------------------------------ */
/* CSS Custom Properties for Mobile                                  */
/* ------------------------------------------------------------------ */
export const injectMobileCSS = () => {
  if (typeof document === "undefined") return;

  const existingStyle = document.getElementById("mobile-css-vars");
  if (existingStyle) return;

  const style = document.createElement("style");
  style.id = "mobile-css-vars";
  style.textContent = `
    :root {
      --touch-target-min: 44px;
      --mobile-padding: 16px;
      --tablet-padding: 24px;
      --desktop-padding: 32px;
      --mobile-font-size: 14px;
      --desktop-font-size: 16px;
    }

    /* Fix viewport height on mobile */
    .full-height {
      height: 100vh;
      height: calc(var(--vh, 1vh) * 100);
    }

    /* Smooth scrolling */
    * {
      -webkit-overflow-scrolling: touch;
    }

    /* Remove tap highlight */
    * {
      -webkit-tap-highlight-color: transparent;
    }

    /* Ensure minimum touch targets */
    button,
    .MuiIconButton-root,
    .MuiButton-root {
      min-width: var(--touch-target-min);
      min-height: var(--touch-target-min);
    }

    /* Safe area support for notched devices */
    @supports (padding: max(0px)) {
      .safe-area-inset {
        padding-left: max(16px, env(safe-area-inset-left));
        padding-right: max(16px, env(safe-area-inset-right));
        padding-top: max(16px, env(safe-area-inset-top));
        padding-bottom: max(16px, env(safe-area-inset-bottom));
      }
    }
  `;

  document.head.appendChild(style);
};

/* ------------------------------------------------------------------ */
/* Initialize Mobile Features                                         */
/* ------------------------------------------------------------------ */
export const initializeMobileFeatures = () => {
  // Inject CSS variables
  injectMobileCSS();

  // Set initial viewport height
  const setVH = () => {
    const vh = window.innerHeight * 0.01;
    document.documentElement.style.setProperty("--vh", `${vh}px`);
  };

  setVH();
  window.addEventListener("resize", setVH);
  window.addEventListener("orientationchange", setVH);

  // Prevent zoom on double tap for iOS
  if (isIOSDevice()) {
    let lastTouchEnd = 0;
    document.addEventListener(
      "touchend",
      (event) => {
        const now = new Date().getTime();
        if (now - lastTouchEnd <= 300) {
          event.preventDefault();
        }
        lastTouchEnd = now;
      },
      false,
    );
  }
};
