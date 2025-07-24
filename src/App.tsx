/* ------------------------------------------------------------------
 * MIT License
 * Copyright (c) 2025  Sesh Ragavachari
 *
 * Permission is hereby granted, free of charge, to any person
 * obtaining a copy of this software and associated documentation
 * files (the "Software"), to deal in the Software without restriction,
 * including without limitation the rights to use, copy, modify, merge,
 * publish, distribute, sublicense, and/or sell copies of the Software,
 * and to permit persons to whom the Software is furnished to do so,
 * subject to the following conditions:
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
 * EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES
 * OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
 * NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT
 * HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY,
 * WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
 * FROM, OUT OF, OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR
 * OTHER DEALINGS IN THE SOFTWARE.
 * ------------------------------------------------------------------
 * File   : App.tsx (Mobile-Responsive Version)
 * Author : Sesh Ragavachari
 * Date   : 2025‑07‑24
 * Version: 2.0 - Mobile Support Added
 *
 * Top‑level React component with mobile initialization.
 * Now includes mobile utility initialization and viewport fixes.
 * ------------------------------------------------------------------ */

import React, { useEffect } from "react";
import Workbench from "./Workbench";
import IntroGate from "./components/IntroGate";
import {
  IntroVideoProvider,
  useIntroVideo,
} from "./contexts/IntroVideoContext";
import {
  initializeMobileFeatures,
  useViewportHeight
} from "./utils/mobileUtils";

/**
 * Inner app component that uses the intro video context.
 * Separated to allow context usage.
 */
function AppContent(): React.JSX.Element {
  const { showIntro } = useIntroVideo();
  const hasSeenIntro = localStorage.getItem("structout.introSeen");

  // Initialize mobile features and viewport height fix
  useViewportHeight();

  useEffect(() => {
    // Initialize mobile-specific features
    initializeMobileFeatures();

    // Add meta viewport tag if it doesn't exist
    let viewportMeta = document.querySelector('meta[name="viewport"]');
    if (!viewportMeta) {
      viewportMeta = document.createElement('meta');
      viewportMeta.setAttribute('name', 'viewport');
      document.head.appendChild(viewportMeta);
    }

    // Set optimal viewport settings for mobile
    viewportMeta.setAttribute(
      'content',
      'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover'
    );

    // Add theme-color meta tag for mobile browsers
    let themeColorMeta = document.querySelector('meta[name="theme-color"]');
    if (!themeColorMeta) {
      themeColorMeta = document.createElement('meta');
      themeColorMeta.setAttribute('name', 'theme-color');
      themeColorMeta.setAttribute('content', '#2962ff');
      document.head.appendChild(themeColorMeta);
    }

    // Add apple-mobile-web-app-capable for iOS
    let appleMeta = document.querySelector('meta[name="apple-mobile-web-app-capable"]');
    if (!appleMeta) {
      appleMeta = document.createElement('meta');
      appleMeta.setAttribute('name', 'apple-mobile-web-app-capable');
      appleMeta.setAttribute('content', 'yes');
      document.head.appendChild(appleMeta);
    }

    // Add apple-mobile-web-app-status-bar-style for iOS
    let appleStatusMeta = document.querySelector('meta[name="apple-mobile-web-app-status-bar-style"]');
    if (!appleStatusMeta) {
      appleStatusMeta = document.createElement('meta');
      appleStatusMeta.setAttribute('name', 'apple-mobile-web-app-status-bar-style');
      appleStatusMeta.setAttribute('content', 'default');
      document.head.appendChild(appleStatusMeta);
    }

    // Prevent zoom on iOS double-tap
    let lastTouchEnd = 0;
    const preventZoom = (event: TouchEvent) => {
      const now = new Date().getTime();
      if (now - lastTouchEnd <= 300) {
        event.preventDefault();
      }
      lastTouchEnd = now;
    };

    document.addEventListener('touchend', preventZoom, false);

    // Cleanup
    return () => {
      document.removeEventListener('touchend', preventZoom, false);
    };
  }, []);

  return (
    <>
      {/* Show intro on first visit OR when triggered via context */}
      {(!hasSeenIntro || showIntro) && (
        <IntroGate videoSrc="/intro/short_intro.mp4" forceWatch={false} />
      )}

      {/* main StructOut workbench */}
      <Workbench />
    </>
  );
}

/**
 * Application root injected by ReactDOM.
 * Wraps content with IntroVideoProvider to enable replay functionality.
 */
export default function App(): React.JSX.Element {
  return (
    <IntroVideoProvider>
      <AppContent />
    </IntroVideoProvider>
  );
}
