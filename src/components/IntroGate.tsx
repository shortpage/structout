// IntroGate.tsx  – drop‑in replacement
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useIntroVideo } from "../contexts/IntroVideoContext";

interface IntroGateProps {
  videoSrc: string;
  forceWatch?: boolean;
}

const FLAG_KEY = "structout.introSeen";

export default function IntroGate({
  videoSrc,
  forceWatch = false,
}: IntroGateProps) {
  const videoRef = useRef<HTMLVideoElement>(null);

  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [videoError, setVideoError] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);

  /* ------------------------------------------------------------------ */
  /*  Context                                                           */
  /* ------------------------------------------------------------------ */
  const { showIntro, dismissIntro } = useIntroVideo();

  /* ------------------------------------------------------------------ */
  /*  Gate‑opening logic                                                */
  /* ------------------------------------------------------------------ */
  useEffect(() => {
    const firstVisit = !localStorage.getItem(FLAG_KEY);

    if (firstVisit || showIntro) {
      console.log("IntroGate: opening modal (first visit or replay)");
      resetStateAndOpen();
    }
  }, [showIntro]);

  const resetStateAndOpen = () => {
    setIsLoading(true);
    setVideoError(false);
    setHasStarted(false);
    setOpen(true);
  };

  /* ------------------------------------------------------------------ */
  /*  Video helpers                                                     */
  /* ------------------------------------------------------------------ */
  const startVideo = () => {
    if (!videoRef.current) return;

    // iOS/Android require muted first
    videoRef.current.muted = true;
    videoRef.current
      .play()
      .then(() => {
        setHasStarted(true);
        console.log("IntroGate: muted playback ok, attempting un‑mute");
        videoRef.current!.muted = false; // if browser allows, audio resumes
      })
      .catch((err) => {
        console.error("IntroGate: play() failed", err);
        setVideoError(true);
      });
  };

  const dismiss = () => {
    dismissIntro(); // writes localStorage & flips showIntro off
    setOpen(false);
  };

  /* ------------------------------------------------------------------ */
  /*  Render                                                            */
  /* ------------------------------------------------------------------ */
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
          zIndex: 9999,
          boxShadow: "0 16px 40px rgb(0 0 0 / .35)",
        }}
      >
        {/* Loading state */}
        {isLoading && (
          <div
            style={{ color: "#fff", textAlign: "center", padding: "3rem 2rem" }}
          >
            Loading intro video…
          </div>
        )}

        {/* Video */}
        <video
          ref={videoRef}
          src={videoSrc}
          muted // mobile‑friendly hint
          playsInline
          preload="auto"
          controls={hasStarted && !forceWatch}
          style={{ width: "100%", display: isLoading ? "none" : "block" }}
          onLoadedData={() => setIsLoading(false)}
          onError={() => {
            setIsLoading(false);
            setVideoError(true);
          }}
          onEnded={forceWatch ? dismiss : undefined}
        />

        {/* Overlay play button */}
        {!isLoading && !hasStarted && !videoError && (
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

        {/* Dismiss button */}
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
