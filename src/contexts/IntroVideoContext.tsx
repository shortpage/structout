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
 * FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR
 * OTHER DEALINGS IN THE SOFTWARE.
 * ------------------------------------------------------------------
 * File   : IntroVideoContext.tsx
 * Author : Sesh Ragavachari
 * Date   : 2025‑07‑23
 * Version: 1.0
 *
 * Purpose
 *   Context provider for managing intro video state across the app.
 *   Allows triggering intro video replay without page reload.
 *
 * Implementation notes
 *   • Provides showIntro state to force showing the intro video
 *   • triggerIntroReplay() clears localStorage and sets showIntro
 *   • dismissIntro() saves the flag and hides intro
 *   • Used by IntroGate, LegalLinks, and any other components
 *     that need to control the intro video
 * ------------------------------------------------------------------ */

import React, { createContext, useContext, useState } from "react";

interface IntroVideoContextType {
  showIntro: boolean;
  triggerIntroReplay: () => void;
  dismissIntro: () => void;
}

const IntroVideoContext = createContext<IntroVideoContextType | null>(null);

/**
 * Hook to access intro video controls.
 * Must be used within IntroVideoProvider.
 */
export const useIntroVideo = () => {
  const context = useContext(IntroVideoContext);
  if (!context) {
    throw new Error("useIntroVideo must be used within IntroVideoProvider");
  }
  return context;
};

/**
 * Provider component that manages intro video state.
 * Wrap your app with this to enable intro video replay functionality.
 */
export function IntroVideoProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [showIntro, setShowIntro] = useState(false);

  const triggerIntroReplay = () => {
    console.log("IntroVideoContext: Triggering intro replay");
    localStorage.removeItem("structout.introSeen");
    setShowIntro(true);
  };

  const dismissIntro = () => {
    console.log("IntroVideoContext: Dismissing intro");
    localStorage.setItem("structout.introSeen", "yes");
    setShowIntro(false);
  };

  return (
    <IntroVideoContext.Provider
      value={{ showIntro, triggerIntroReplay, dismissIntro }}
    >
      {children}
    </IntroVideoContext.Provider>
  );
}
