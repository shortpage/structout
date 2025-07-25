/* ------------------------------------------------------------------
 * MIT License
 * Copyright (c) 2025  Sesh Ragavachari
 *
 * One‑time "watch intro" gate that now works on first mobile visit
 * and on demand replays. Fixes:
 *   • Opens again when IntroVideoContext.showIntro toggles
 *   • Starts muted, then tries to un‑mute after user gesture
 *   • Shows Play overlay immediately; only shows "Loading…" spinner
 *     *after* the user taps Play (solves iOS first‑visit hang)
 * ------------------------------------------------------------------ */

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useIntroVideo } from "../contexts/IntroVideoContext";

interface IntroGateProps {
  videoSrc: string;
  /** Require the user to watch the full clip before dismissing. */
  forceWatch?: boolean;
}

const FLAG_KEY = "structout.introSeen"; // bump for new intro versions

export default function IntroGate({
  videoSrc,
  forceWatch = false,
}: IntroGateProps) {
  const videoRef = useRef<HTMLVideoElement>(null);

  /* ------------------------------------------------------------------
   * Local UI state
   * ------------------------------------------------------------------ */
  const [open, setOpen] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);
  const [awaitingPlayback, setAwaitingPlayback] = useState(false); // ← new
  const [videoError, setVideoError] = useState(false);

  /* ------------------------------------------------------------------
   * Context (handles localStorage + external replay trigger)
   * ------------------------------------------------------------------ */
  const { showIntro, dismissIntro } = useIntroVideo();

  /* ------------------------------------------------------------------
   * Decide when to open the modal
   * ------------------------------------------------------------------ */
  useEffect(() => {
    const firstVisit = !localStorage.getItem(FLAG_KEY);
    if (firstVisit || showIntro) {
      console.log("IntroGate: opening intro modal");
      resetStateAndOpen();
    }
  }, [showIntro]);

  const resetStateAndOpen = () => {
    setHasStarted(false);
    setAwaitingPlayback(false);
    setVideoError(false);
    setOpen(true);
  };

  /* ------------------------------------------------------------------
   * Video helpers
   * ------------------------------------------------------------------ */
  const startVideo = () => {
    if (!videoRef.current) return;

    setAwaitingPlayback(true); // spinner shows only after tap

    videoRef.current.muted = true; // mobile‑safe autoplay
    videoRef.current
      .play()
      .then(() => {
        setHasStarted(true);
        setAwaitingPlayback(false);
        // Try un‑muting now that playback is user‑initiated
        videoRef.current!.muted = false;
      })
      .catch((err) => {
        console.error("IntroGate: play() failed", err);
        setAwaitingPlayback(false);
        setVideoError(true);
      });
  };

  const dismiss = () => {
    dismissIntro(); // writes localStorage + resets showIntro flag
    setOpen(false);
  };

  /* ------------------------------------------------------------------
   * Render
   * ------------------------------------------------------------------ */
  if (!open) return null;

  return createPortal(
    <>
      {/* Backdrop */}
      <div
        style={{
          position: "fixed",
          inset: 0,
          background: "rgba(0,0,0,.8)",
          cursor: forceWatch ? "default" : "pointer",
          zIndex: 9998,
        }}
        onClick={!forceWatch ? dismiss : undefined}
      />

      {/* Modal */}
      <div
        style={{
          position: "fixed",
          top: "50%",
          left: "50%",
          transform: "translate(-50%,-50%)",
          width: "min(90vw,880px)",
          background: "#000",
          borderRadius: 12,
          overflow: "hidden",
          boxShadow: "0 16px 40px rgb(0 0 0 / .35)",
          zIndex: 9999,
        }}
      >
        {/* Loading spinner — shown only while waiting after user tap */}
        {awaitingPlayback && (
          <div
            style={{ color: "#fff", textAlign: "center", padding: "3rem 2rem" }}
          >
            Loading intro video…
          </div>
        )}

        {/* Video element */}
        <video
          ref={videoRef}
          src={videoSrc}
          muted /* hint for iOS */
          playsInline
          preload="auto"
          controls={hasStarted && !forceWatch}
          style={{
            width: "100%",
            display: awaitingPlayback ? "none" : "block",
          }}
          onError={() => {
            setAwaitingPlayback(false);
            setVideoError(true);
          }}
          onEnded={forceWatch ? dismiss : undefined}
        />

        {/* Overlay play button (visible until video actually starts) */}
        {!hasStarted && !videoError && (
          <div
            onClick={startVideo}
            style={{
              position: "absolute",
              inset: 0,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: "rgba(0,0,0,.3)",
              cursor: "pointer",
            }}
          >
            <button
              onClick={startVideo}
              style={{
                padding: "1rem 2rem",
                background: "rgba(255,255,255,.95)",
                border: "none",
                borderRadius: 8,
                fontSize: "1.1rem",
                fontWeight: 600,
                display: "flex",
                gap: ".6rem",
                alignItems: "center",
              }}
            >
              ▶ Play intro
            </button>
          </div>
        )}

        {/* Error fallback */}
        {videoError && (
          <div style={{ color: "#fff", textAlign: "center", padding: "2rem" }}>
            <p>Can’t load the intro video.</p>
            <button onClick={startVideo}>Try again</button>
          </div>
        )}

        {/* Dismiss button (hidden if forceWatch) */}
        {!forceWatch && (
          <button
            onClick={dismiss}
            style={{
              display: "block",
              margin: "1rem auto 1.5rem",
              padding: ".6rem 1.4rem",
              background: "#1976d2",
              color: "#fff",
              border: "none",
              borderRadius: 6,
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            {videoError ? "Skip intro" : "Close & start →"}
          </button>
        )}
      </div>
    </>,
    document.body,
  );
}
