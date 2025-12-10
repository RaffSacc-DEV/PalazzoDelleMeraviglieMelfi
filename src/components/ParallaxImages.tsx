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
  const [audioEnabled, setAudioEnabled] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [showCalendar, setShowCalendar] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const video1Ref = useRef<HTMLVideoElement>(null);
  const video2Ref = useRef<HTMLVideoElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const knobRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const centerRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLHeadingElement>(null);

  const sliderUnlocked = useRef(false);
  const firstVideoStarted = useRef(false);

  /* 🛑 BLOCCA SCROLL E ZOOM SU MOBILE */
  useEffect(() => {
    const preventScroll = (e: TouchEvent) => e.preventDefault();
    document.addEventListener("touchmove", preventScroll, { passive: false });
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("touchmove", preventScroll);
      document.body.style.overflow = "";
    };
  }, []);

  /* 🎞️ PRELOAD SOLO VIDEO (audio dopo click) */
  useEffect(() => {
    const video1 = video1Ref.current;
    const video2 = video2Ref.current;
    if (!video1 || !video2) return;

    const media = [video1, video2];
    let loaded = 0;

    const done = () => {
      loaded++;
      if (loaded === media.length) setReady(true);
    };

    media.forEach((m) => {
      if (m.readyState >= 3) done();
      else m.addEventListener("canplaythrough", done, { once: true });
    });
  }, []);

  /* 🔒 FALLBACK per iPhone se canplaythrough non arriva */
  useEffect(() => {
    const t = setTimeout(() => setReady(true), 6000);
    return () => clearTimeout(t);
  }, []);

  /* 🔊 AUDIO ABILITATO SOLO DOPO CLICK */
  useEffect(() => {
    const unlock = () => {
      setAudioEnabled(true);
      document.removeEventListener("click", unlock);
      document.removeEventListener("touchstart", unlock);
    };
    document.addEventListener("click", unlock);
    document.addEventListener("touchstart", unlock);
  }, []);

  const toggleAudio = () => {
    if (!audioRef.current || !audioEnabled) return;
    audioRef.current.muted = !audioRef.current.muted;
    setIsMuted(audioRef.current.muted);
    if (!audioRef.current.muted)
      audioRef.current.play().catch(() => {});
  };

  /* 🎬 ANIMAZIONI VIDEO E SLIDER */
  useLayoutEffect(() => {
    if (!ready) return;

    const v1 = video1Ref.current!;
    const v2 = video2Ref.current!;
    const knob = knobRef.current!;
    const track = trackRef.current!;
    const text = textRef.current!;
    const center = centerRef.current!;
    const container = containerRef.current!;

    gsap.to("#preloader", { autoAlpha: 0, duration: 0.4 });
    gsap.to(center, { scale: 1.12, opacity: 0.9, repeat: -1, yoyo: true });

    const playFirst = () => {
      if (firstVideoStarted.current) return;
      firstVideoStarted.current = true;

      gsap.killTweensOf(center);
      gsap.to(center, { opacity: 0 });

      v1.currentTime = 0;
      v1.play();

      v1.onended = () => {
        gsap.to(v1, { opacity: 0, duration: 0.8 });
        gsap.to(v2, { opacity: 1, duration: 0.8 });
        gsap.to([text, track], { opacity: 1, delay: 0.5 });
        v2.onended = () => setShowCalendar(true);
      };
    };

    /* DOPPIO TAP MOBILE */
    let lastTap = 0;
    container.addEventListener("dblclick", playFirst);
    container.addEventListener("touchend", () => {
      const now = Date.now();
      if (now - lastTap < 350) playFirst();
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
        const p = this.x / this.maxX;
        if (p > 0.85 && !sliderUnlocked.current) {
          sliderUnlocked.current = true;
          gsap.to([track, text], { opacity: 0 });
          v2.currentTime = 0;
          v2.play();
        } else {
          gsap.to(knob, { x: 0, ease: "elastic.out(1,0.4)" });
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
          touch-action: none;
          overscroll-behavior: none;
        }
        .scene-container {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          aspect-ratio: 16/9;
          overflow: hidden;
        }
        @media (min-aspect-ratio: 16/9) {
          .scene-container { width: 100vw; height: 56.25vw; }
        }
        @media (max-aspect-ratio: 16/9) {
          .scene-container { height: 100vh; width: 177.78vh; }
        }
      `}</style>

      {!ready && (
        <div
          id="preloader"
          className="fixed inset-0 bg-black text-white text-xl z-[9999] flex items-center justify-center"
        >
          LOADING...
        </div>
      )}

      <button
        onClick={toggleAudio}
        disabled={!audioEnabled}
        className="fixed top-6 right-6 z-[999] bg-white/30 backdrop-blur-md p-3 rounded-full text-white"
        style={{ opacity: audioEnabled ? 1 : 0.35 }}
      >
        {isMuted ? "🔇" : "🔊"}
      </button>

      <audio ref={audioRef} src="/img/musica.mp3" loop preload="auto" muted />

      <div ref={containerRef} className="scene-container">

        <video
          ref={video1Ref}
          src="/img/videoStart.mp4"
          muted playsInline
          className="absolute w-full h-full object-cover"
        />

        <div
          ref={centerRef}
          className="absolute top-[65%] left-1/2 w-20 h-20 border-4 border-white rounded-full -translate-x-1/2 -translate-y-1/2"
        />

        <video
          ref={video2Ref}
          src="/img/videoInterno1.mp4"
          muted playsInline
          className="absolute w-full h-full object-cover opacity-0"
        />

        <h2
          ref={textRef}
          className="absolute top-[48%] w-full text-center text-white opacity-0 tracking-[0.3em]"
        >
          TRASCINA PER CONTINUARE
        </h2>

        <div
          ref={trackRef}
          className="absolute top-[55%] left-1/2 w-[270px] h-10 opacity-0 -translate-x-1/2"
        >
          <div className="absolute inset-0 -translate-y-1/2 border-b border-white/40" />
          <div ref={knobRef} className="absolute left-0 w-10 h-10 border-2 border-white rounded-full" />
        </div>

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
                rowGap: "6%",     // spazio ridotto 👍
                columnGap: "4%",
              }}
            >
              {[20,21,22,23,24, 27,28,29,30,31, 2,3,4,5,6].map((day) => (
                <button
                  key={day}
                  onClick={() => setSelectedImage(`/img/events/${day}.jpg`)}
                  className="w-[80%] h-[80%] pointer-events-auto opacity-0"
                >
                  {day}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {selectedImage && (
        <div className="fixed inset-0 bg-black/80 z-[999] flex items-center justify-center">
          <img src={selectedImage} className="max-w-[80%] max-h-[80%] rounded-xl" />
          <button
            onClick={() => setSelectedImage(null)}
            className="absolute top-8 right-8 text-red-600 text-3xl font-bold"
          >
            ✖
          </button>
        </div>
      )}
    </>
  );
};
