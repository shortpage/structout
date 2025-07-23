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
 * File   : App.tsx
 * Author : Sesh Ragavachari
 * Date   : 2025‑07‑23
 * Version: 1.0
 *
 *  Top‑level React component.  Mounts:
 *    • <IntroGate/>  – one‑time "watch intro" modal
 *    • <Workbench/>  – main StructOut designer
 *
 *  ⌁ Responsibilities
 *    • Provide global wrappers/providers if needed (router, telemetry…).
 *    • Remain intentionally *stateless* and *presentation‑free* beyond
 *      gating logic.
 *    • Now includes IntroVideoProvider for replay functionality
 * ------------------------------------------------------------------ */

import type React from "react";
import Workbench from "./Workbench";
import IntroGate from "./components/IntroGate";
import {
  IntroVideoProvider,
  useIntroVideo,
} from "./contexts/IntroVideoContext";

/**
 * Inner app component that uses the intro video context.
 * Separated to allow context usage.
 */
function AppContent(): React.JSX.Element {
  const { showIntro } = useIntroVideo();
  const hasSeenIntro = localStorage.getItem("structout.introSeen");

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
