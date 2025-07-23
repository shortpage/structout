/* ------------------------------------------------------------------
 * MIT License
 * Copyright (c) 2025  Sesh Ragavachari
 *
 * Permission is hereby granted, free of charge, to any person
 * obtaining a copy of this software and associated documentation
 * files (the “Software”), to deal in the Software without restriction,
 * including without limitation the rights to use, copy, modify, merge,
 * publish, distribute, sublicense, and/or sell copies of the Software,
 * and to permit persons to whom the Software is furnished to do so,
 * subject to the following conditions:
 *
 * THE SOFTWARE IS PROVIDED “AS IS”, WITHOUT WARRANTY OF ANY KIND,
 * EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES
 * OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
 * NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT
 * HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY,
 * WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
 * FROM, OUT OF, OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR
 * OTHER DEALINGS IN THE SOFTWARE.
 * ------------------------------------------------------------------
 * File   : IntroGate.tsx
 * Author : Sesh Ragavachari
 * Date   : 2025‑07‑23
 * Version: 1.0
 *
 * Purpose
 *   One‑time “watch intro” gate.  On the first visit it shows a modal
 *   that autoplay‑mutes a short video, blocking the rest of the UI
 *   until the user clicks **Close** (or the video ends, if
 *   force‑watch mode is enabled).  A localStorage flag prevents it
 *   from re‑appearing on subsequent visits.
 *
 * Implementation notes
 *   • Native <dialog> provides focus‑trap + backdrop without deps.
 *   • Flag key is "structout.introSeen" (version by appending .v2, .v3…).
 *   • Props:
 *       videoSrc   – absolute/relative URL to .mp4 (or HLS, etc.)
 *       forceWatch – when true, hides Close button; modal dismisses
 *                    only on video end.
 *   • Works unchanged in web and Tauri desktop builds (localStorage
 *     persists in the WebView profile).
 * ------------------------------------------------------------------ */

import { useEffect, useRef, useState } from "react";

interface IntroGateProps {
  videoSrc: string;
  /** Require the user to watch the full clip before dismissing. */
  forceWatch?: boolean;
}

const FLAG_KEY = "structout.introSeen"; // bump suffix for new intro versions

export default function IntroGate({
  videoSrc,
  forceWatch = false,
}: IntroGateProps) {
  const dlgRef = useRef<HTMLDialogElement>(null);
  const [open, setOpen] = useState(false);

  /* Show gate on first visit only -------------------------------- */
  useEffect(() => {
    if (!localStorage.getItem(FLAG_KEY)) {
      setOpen(true);
      dlgRef.current?.showModal();
    }
  }, []);

  /* Persist flag + close modal ----------------------------------- */
  const dismiss = () => {
    localStorage.setItem(FLAG_KEY, "yes");
    dlgRef.current?.close();
    setOpen(false);
  };

  if (!open) return null; // gate already cleared

  return (
    <dialog ref={dlgRef} className="intro-gate">
      <video
        src={videoSrc}
        autoPlay
        muted
        controls={!forceWatch}
        onEnded={forceWatch ? dismiss : undefined}
        style={{ width: "100%", borderRadius: 8 }}
      />

      {!forceWatch && (
        <button className="intro-close" onClick={dismiss}>
          Close & start →
        </button>
      )}

      {/* quick inline styles (move to CSS module if preferred) */}
      <style>{`
        dialog.intro-gate{
          width:clamp(320px,90vw,880px);
          padding:0;
          border:none;
          border-radius:12px;
          box-shadow:0 16px 40px rgb(0 0 0 / .35);
        }
        .intro-close{
          display:block;
          margin:1rem auto 1.5rem;
          padding:.6rem 1.4rem;
          background:#1976d2;
          color:#fff;
          border:none;
          border-radius:6px;
          font-size:1rem;
          font-weight:600;
          cursor:pointer;
        }
      `}</style>
    </dialog>
  );
}
