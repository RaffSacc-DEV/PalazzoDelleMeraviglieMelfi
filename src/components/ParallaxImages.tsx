import React, { useRef, useLayoutEffect, useState, useEffect } from "react";
import gsap from "gsap";
import Draggable from "gsap/Draggable";

gsap.registerPlugin(Draggable);

const BOARD_CONFIG = {
  left: 40.5,
  top: 46,
  width: 20.5,
  height: 35,
};

export const ParallaxImages: React.FC = () => {
  const [ready, setReady] = useState(false);
  const [progress, setProgress] = useState(0);
  const [isMuted, setIsMuted] = useState(true);
  const [showCalendar, setShowCalendar] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const poster1 = useRef<HTMLImageElement>(null);
  const poster2 = useRef<HTMLImageElement>(null);
  const video1Ref = useRef<HTMLVideoElement>(null);
  const video2Ref = useRef<HTMLVideoElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const knobRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const centerRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLHeadingElement>(null);

  const sliderUnlocked = useRef(false);
  const firstVideoStarted = useRef(false);

  /* 🚫 NO SCROLL MOBILE */
  useEffect(() => {
    document.body.style.overflow = "hidden";
    const preventScroll = (e: TouchEvent) => e.preventDefault();
    document.addEventListener("touchmove", preventScroll, { passive: false });

    return () => {
      document.body.style.overflow = "";
      document.removeEventListener("touchmove", preventScroll);
    };
  }, []);

  /* 🎞️ PRELOAD VIDEO + PROGRESS */
  useEffect(() => {
    const v1 = video1Ref.current;
    const v2 = video2Ref.current;
    if (!v1 || !v2) return;

    const media = [v1, v2];
    let loaded = 0;

    const onLoad = () => {
      loaded++;
      setProgress(Math.round((loaded / media.length) * 100));
      if (loaded === media.length) setReady(true);
    };

    media.forEach((m) => {
      if (m.readyState >= 3) onLoad();
      else m.addEventListener("canplaythrough", onLoad, { once: true });
    });
  }, []);

  /* 📌 FALLBACK iPhone */
  useEffect(() => {
    const t = setTimeout(() => {
      setProgress(100);
      setReady(true);
    }, 5000);
    return () => clearTimeout(t);
  }, []);

  /* 🔊 AUDIO */
  const toggleAudio = () => {
    const audio = audioRef.current;
    if (!audio) return;

    const nowMuted = !audio.muted;
    audio.muted = !audio.muted;
    setIsMuted(nowMuted);

    if (!nowMuted) audio.play().catch(() => {});
    else audio.pause();
  };

  /* 🎬 ANIMAZIONI */
  useLayoutEffect(() => {
    if (!ready) return;

    const v1 = video1Ref.current!;
    const v2 = video2Ref.current!;
    const p1 = poster1.current!;
    const p2 = poster2.current!;
    const knob = knobRef.current!;
    const track = trackRef.current!;
    const text = textRef.current!;
    const center = centerRef.current!;
    const container = containerRef.current!;

    gsap.to("#preloader", { autoAlpha: 0, duration: 0.6 });
    gsap.to(center, { scale: 1.12, opacity: 0.9, repeat: -1, yoyo: true });

    const playFirst = () => {
      if (firstVideoStarted.current) return;
      firstVideoStarted.current = true;

      gsap.killTweensOf(center);
      gsap.to([center, p1], { opacity: 0 });

      v1.currentTime = 0;
      v1.play();

      v1.onended = () => {
        gsap.to(v1, { opacity: 0, duration: 0.8 });
        gsap.to([v2, p2], { opacity: 1, duration: 0.8 });

        gsap.to([text, track], { opacity: 1, delay: 0.5 });

        v2.onended = () => setShowCalendar(true);
      };
    };

    /* TAP / DOUBLE TAP */
    let lastTap = 0;
    container.addEventListener("dblclick", playFirst);
    container.addEventListener("touchend", () => {
      const now = Date.now();
      if (now - lastTap < 300) playFirst();
      lastTap = now;
    });

    /* SLIDER */
    Draggable.create(knob, {
      type: "x",
      bounds: track,
      onDrag() {
        gsap.to(text, { opacity: 1 - (this.x / this.maxX) * 1.5 });
      },
      onDragEnd() {
        if (this.x / this.maxX > 0.85) {
          gsap.to([track, text], { opacity: 0 });
          v2.currentTime = 0;
          v2.play().catch(() => {});
        } else {
          gsap.to(knob, { x: 0 });
          gsap.to(text, { opacity: 1 });
        }
      },
    });
  }, [ready]);

  return (
    <>
      <style>{`
        html, body {
          overflow: hidden !important;
          height: 100%;
          width: 100%;
          position: fixed;
          inset: 0;
        }
        body { overscroll-behavior: none; }
        .scene-container {
          aspect-ratio: 16/9;
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          overflow: hidden;
        }
        @media (min-aspect-ratio: 16/9) {
          .scene-container { width: 100vw; height: 56.25vw; }
        }
        @media (max-aspect-ratio: 16/9) {
          .scene-container { height: 100vh; width: 177.78vh; }
        }
      `}</style>

      {/* 🌟 LOADER GRAFICO */}
      {!ready && (
        <div
          id="preloader"
          className="fixed inset-0 bg-black flex flex-col items-center justify-center z-[9999]"
        >
          <div className="relative w-[180px] h-[180px]">
            {/* immagine base */}
            <img
              src="/img/loader.png"
              className="absolute inset-0 w-full h-full object-contain opacity-20"
            />

            {/* immagine che si riempie */}
            <div
              className="absolute bottom-0 left-0 w-full overflow-hidden"
              style={{ height: `${progress}%` }}
            >
              <img
                src="/img/palazzoLogoRosso.jpg"
                className="w-full h-full object-contain"
              />
            </div>
          </div>

          <div className="text-white mt-6 text-lg font-bold">{progress}%</div>
        </div>
      )}

      {/* AUDIO BUTTON */}
      <button
        onClick={toggleAudio}
        className="fixed top-6 right-6 z-[999] text-white p-3 bg-white/30 backdrop-blur-md rounded-full"
      >
        {isMuted ? "🔇" : "🔊"}
      </button>

      <audio ref={audioRef} src="/img/musica.mp3" preload="auto" loop muted />

      <div ref={containerRef} className="scene-container">

        {/* POSTER SOTTO VIDEO 1 */}
        <img
          ref={poster1}
          src="/img/frameStart.png"
          className="absolute w-full h-full object-cover z-[0] opacity-1"
        />

        {/* VIDEO 1 */}
        <video
          ref={video1Ref}
          src="/img/videoStart1.mp4"
          playsInline
          muted
          preload="auto"
          className="absolute w-full h-full object-cover"
        />

        {/* CENTER CIRCLE */}
        <div
          ref={centerRef}
          className="absolute top-[65%] left-1/2 w-20 h-20 border-4 border-white rounded-full -translate-x-1/2 -translate-y-1/2"
        />

        {/* POSTER SOTTO VIDEO 2 */}
        <img
          ref={poster2}
          src="/img/frame-1.png"
          className="absolute w-full h-full object-cover z-[0] opacity-0"
        />

        {/* VIDEO 2 */}
        <video
          ref={video2Ref}
          src="/img/videoInterno1.mp4"
          playsInline
          muted
          preload="auto"
          className="absolute w-full h-full object-cover opacity-0"
        />

        {/* SLIDER */}
        <h2
          ref={textRef}
          className="absolute top-[48%] w-full text-center text-white opacity-0 tracking-[0.3em]"
        >
          TRASCINA PER CONTINUARE
        </h2>

        <div
          ref={trackRef}
          className="absolute top-[55%] left-1/2 w-[270px] h-10 -translate-x-1/2 opacity-0"
        >
          <div className="absolute inset-0 -translate-y-1/2 border-b border-white/40" />
          <div
            ref={knobRef}
            className="absolute left-0 w-10 h-10 border-2 border-white rounded-full"
          />
        </div>

        {/* CALENDARIO */}
        {showCalendar && (
          <div
            className="absolute z-[50]"
            style={{
              left: `${BOARD_CONFIG.left}%`,
              top: `${BOARD_CONFIG.top}%`,
              width: `${BOARD_CONFIG.width}%`,
              height: `${BOARD_CONFIG.height}%`,
              pointerEvents: "none",
            }}
          >
            <div
              className="w-full h-[75%] grid"
              style={{
                gridTemplateColumns: "repeat(5, 1fr)",
                gridTemplateRows: "repeat(3, 1fr)",
                rowGap: "10%",
                columnGap: "3%",
              }}
            >
              {[20, 21, 22, 23, 24, 27, 28, 29, 30, 31, 2, 3, 4, 5, 6].map(
                (day) => (
                  <button
                    key={day}
                    onClick={() =>
                      setSelectedImage(`/img/events/${day}.jpg`)
                    }
                    className="cursor-pointer pointer-events-auto"
                    style={{ opacity: 0, width: "80%", height: "80%" }}
                  />
                )
              )}
            </div>
          </div>
        )}
      </div>

      {/* POPUP */}
      {selectedImage && (
        <div className="fixed inset-0 bg-black/80 z-[999] flex items-center justify-center">
          <img
            src={selectedImage}
            className="max-w-[80%] max-h-[80%] rounded-xl"
          />
          <button
            onClick={() => setSelectedImage(null)}
            className="absolute top-8 right-8 text-red-600 text-3xl"
          >
            X
          </button>
        </div>
      )}
    </>
  );
};
