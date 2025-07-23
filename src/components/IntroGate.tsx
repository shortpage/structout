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
 * File   : IntroGate.tsx
 * Author : Sesh Ragavachari
 * Date   : 2025‑07‑23
 * Version: 1.0
 *
 * Purpose
 *   One‑time "watch intro" gate.  On the first visit it shows a modal
 *   that requires user interaction to play video with sound, blocking
 *   the rest of the UI until the user clicks **Close** (or the video
 *   ends, if force‑watch mode is enabled).  A localStorage flag prevents
 *   it from re‑appearing on subsequent visits.
 *
 * Implementation notes
 *   • Uses div-based modal with portal for better compatibility
 *   • Flag key is "structout.introSeen" (version by appending .v2, .v3…).
 *   • Props:
 *       videoSrc   – absolute/relative URL to .mp4 (or HLS, etc.)
 *       forceWatch – when true, hides Close button; modal dismisses
 *                    only on video end.
 *   • Works unchanged in web and Tauri desktop builds (localStorage
 *     persists in the WebView profile).
 *   • Now integrated with IntroVideoContext for replay functionality
 * ------------------------------------------------------------------ */

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useIntroVideo } from "../contexts/IntroVideoContext";

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
  const videoRef = useRef<HTMLVideoElement>(null);
  const [open, setOpen] = useState(false);
  const [videoError, setVideoError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [hasStarted, setHasStarted] = useState(false);

  // Use context for dismiss functionality
  const { dismissIntro: contextDismiss } = useIntroVideo();

  /* Show gate on first visit only or when triggered by context */
  useEffect(() => {
    const hasSeenIntro = localStorage.getItem(FLAG_KEY);
    console.log("IntroGate: Checking if intro was seen:", hasSeenIntro);

    if (!hasSeenIntro) {
      console.log("IntroGate: First visit detected, showing intro");
      setOpen(true);
    } else {
      // If we're here, it means context triggered the replay
      console.log("IntroGate: Replay triggered by context");
      setOpen(true);
    }
  }, []);

  /* Start video with sound when user clicks play ----------------- */
  const startVideo = () => {
    if (videoRef.current) {
      videoRef.current.muted = false; // Unmute for sound
      videoRef.current
        .play()
        .then(() => {
          setHasStarted(true);
          console.log("IntroGate: Video started with sound");
        })
        .catch((err) => {
          console.error("IntroGate: Play failed:", err);
          // Try playing muted as fallback
          videoRef.current!.muted = true;
          videoRef
            .current!.play()
            .then(() => {
              setHasStarted(true);
              console.log("IntroGate: Fallback - playing muted");
            })
            .catch(() => {
              setVideoError(true);
            });
        });
    }
  };

  /* Persist flag + close modal using context -------------------- */
  const dismiss = () => {
    console.log("IntroGate: Dismissing via context");
    contextDismiss(); // Use context dismiss which handles localStorage
    setOpen(false);
  };

  /* Manual play for autoplay failures ---------------------------- */
  const handleManualPlay = () => {
    startVideo();
    setVideoError(false);
  };

  /* Handle video load events ------------------------------------- */
  const handleVideoLoad = () => {
    setIsLoading(false);
    console.log("IntroGate: Video loaded successfully");
  };

  const handleVideoError = (e: React.SyntheticEvent<HTMLVideoElement>) => {
    console.error("IntroGate: Video loading error", e);
    setIsLoading(false);
    setVideoError(true);
  };

  if (!open) return null;

  // Portal-based modal for better compatibility
  return createPortal(
    <>
      {/* Backdrop */}
      <div
        className="intro-backdrop"
        onClick={!forceWatch ? dismiss : undefined}
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: "rgba(0, 0, 0, 0.8)",
          zIndex: 99998,
          cursor: !forceWatch ? "pointer" : "default",
        }}
      />

      {/* Modal */}
      <div
        className="intro-modal"
        style={{
          position: "fixed",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          width: "min(90vw, 880px)",
          backgroundColor: "#000",
          borderRadius: "12px",
          boxShadow: "0 16px 40px rgb(0 0 0 / .35)",
          zIndex: 99999,
          overflow: "hidden",
        }}
      >
        {isLoading && (
          <div
            style={{
              color: "#fff",
              textAlign: "center",
              padding: "3rem",
              fontSize: "1.1rem",
            }}
          >
            Loading intro video...
          </div>
        )}

        <div style={{ position: "relative" }}>
          <video
            ref={videoRef}
            src={videoSrc}
            playsInline
            preload="auto"
            controls={hasStarted && !forceWatch}
            onLoadedData={handleVideoLoad}
            onError={handleVideoError}
            onEnded={forceWatch ? dismiss : undefined}
            style={{
              width: "100%",
              display: isLoading ? "none" : "block",
              verticalAlign: "middle",
            }}
          />

          {/* Play button overlay for starting video with sound */}
          {!isLoading && !hasStarted && !videoError && (
            <div
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                backgroundColor: "rgba(0, 0, 0, 0.3)",
                cursor: "pointer",
              }}
              onClick={startVideo}
            >
              <button
                onClick={startVideo}
                style={{
                  padding: "1rem 2rem",
                  borderRadius: "8px",
                  border: "none",
                  background: "rgba(255, 255, 255, 0.95)",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "0.5rem",
                  fontSize: "1.1rem",
                  fontWeight: "600",
                  color: "#000",
                  boxShadow: "0 4px 20px rgba(0, 0, 0, 0.3)",
                  transition: "transform 0.2s",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = "scale(1.05)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = "scale(1)";
                }}
              >
                <span style={{ fontSize: "1.2rem" }}>▶</span>
                Play 1 Minute Intro
              </button>
            </div>
          )}
        </div>

        {videoError && (
          <div
            style={{
              color: "#fff",
              textAlign: "center",
              padding: "2rem",
            }}
          >
            <p style={{ marginBottom: "1rem", fontSize: "1.1rem" }}>
              Unable to load the intro video.
            </p>
            <button
              onClick={handleManualPlay}
              style={{
                padding: ".8rem 1.6rem",
                background: "#4caf50",
                color: "#fff",
                border: "none",
                borderRadius: "6px",
                fontSize: "1rem",
                fontWeight: 600,
                cursor: "pointer",
                display: "inline-flex",
                alignItems: "center",
                gap: "0.5rem",
              }}
            >
              <span style={{ fontSize: "1.1rem" }}>▶</span>
              Try Playing 1 Minute Intro
            </button>
          </div>
        )}

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
              borderRadius: "6px",
              fontSize: "1rem",
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            {videoError ? "Skip intro" : "Close & start →"}
          </button>
        )}
      </div>
    </>,
    document.body,
  );
}
