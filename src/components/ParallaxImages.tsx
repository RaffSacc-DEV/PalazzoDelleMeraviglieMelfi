import React, { useRef, useLayoutEffect, useState, useEffect } from "react";
import gsap from "gsap";
import Draggable from "gsap/Draggable";

gsap.registerPlugin(Draggable);

export const ParallaxImages: React.FC = () => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isMuted, setIsMuted] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const video1Ref = useRef<HTMLVideoElement>(null);  // ⭐ Primo video
  const video2Ref = useRef<HTMLVideoElement>(null);  // ⭐ Secondo video
  const centerRef = useRef<HTMLDivElement>(null);    // ⭐ Cerchio double click

  const trackRef = useRef<HTMLDivElement>(null);
  const knobRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLHeadingElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);

  const firstVideoStarted = useRef(false);
  const sliderUnlocked = useRef(false);

  // ============================================================
  // PRELOAD
  // ============================================================
  useEffect(() => {
    const load = (src: string) =>
      new Promise<void>((resolve) => {
        const v = document.createElement("video");
        v.src = src;
        v.onloadeddata = () => resolve();
        setTimeout(resolve, 2000);
      });

    Promise.all([
      load("/img/videoStart.mp4"),
      load("/img/videoInternal.mp4"),
    ]).then(() => setIsLoaded(true));
  }, []);

  // ============================================================
  // AUDIO
  // ============================================================
  useEffect(() => {
    if (isLoaded && audioRef.current) {
      audioRef.current.volume = 0.25;
      audioRef.current.play().catch(() => {});
    }
  }, [isLoaded]);

  const toggleAudio = () => {
    if (!audioRef.current) return;
    audioRef.current.muted = !audioRef.current.muted;
    setIsMuted(audioRef.current.muted);
  };

  // ============================================================
  // ANIMAZIONI
  // ============================================================
  useLayoutEffect(() => {
    if (!isLoaded) return;

    const container = containerRef.current!;
    const video1 = video1Ref.current!;
    const video2 = video2Ref.current!;
    const center = centerRef.current!;
    const track = trackRef.current!;
    const knob = knobRef.current!;
    const text = textRef.current!;

    // Preloader fade
    gsap.to("#preloader", { opacity: 0, duration: 0.6 });

    // Cerchio pulsante
    gsap.to(center, {
      scale: 1.15,
      opacity: 0.9,
      repeat: -1,
      yoyo: true,
      duration: 1.1
    });

    // ⭐ Avvio del primo video
    const playFirst = () => {
      if (firstVideoStarted.current) return;
      firstVideoStarted.current = true;

      gsap.killTweensOf(center);
      gsap.to(center, { opacity: 0 });

      video1.currentTime = 0;
      video1.play();

      video1.onended = () => {
        // Transizione al secondo video
        gsap.to(video1, { opacity: 0, duration: 1 });
        gsap.to(video2, { opacity: 1, duration: 1 });

        gsap.to([track, text], { opacity: 1, delay: 0.5 }); // Mostra slider
      };
    };

    // Double click / tap
    let lastTap = 0;
    container.addEventListener("dblclick", playFirst);
    container.addEventListener("touchend", () => {
      const now = Date.now();
      if (now - lastTap < 300) playFirst();
      lastTap = now;
    });

    // ⭐ Drag slider → avvia Video2
    Draggable.create(knob, {
      type: "x",
      bounds: track,
      onDrag: function () {
        const p = this.x / this.maxX;
        gsap.to(text, { opacity: 1 - p * 1.5 });
      },
      onDragEnd: function () {
        const p = this.x / this.maxX;
        if (p > 0.85 && !sliderUnlocked.current) {
          sliderUnlocked.current = true;

          gsap.to([track, text], { opacity: 0 });
          video2.currentTime = 0;
          video2.play();
        } else {
          gsap.to(this.target, { x: 0, ease: "elastic.out(1,0.4)" });
          gsap.to(text, { opacity: 1 });
        }
      }
    });

  }, [isLoaded]);

  return (
    <>
      {!isLoaded && (
        <div id="preloader" className="fixed inset-0 bg-black text-white flex items-center justify-center z-[9999]">
          LOADING...
        </div>
      )}

      {/* AUDIO BUTTON */}
      <button
        onClick={toggleAudio}
        className="fixed top-6 right-6 z-[999] bg-white/20 backdrop-blur-md p-3 rounded-full text-white"
      >
        {isMuted ? "🔇" : "🔊"}
      </button>

      <audio ref={audioRef} src="/img/musica.mp3" loop preload="auto" />

      <div ref={containerRef} className="absolute w-full h-full overflow-hidden">

        {/* ⭐ VIDEO 1 INIZIALE */}
        <video
          ref={video1Ref}
          src="/img/videoStart.mp4"
          muted
          playsInline
          className="absolute w-full h-full object-cover object-top z-[1]"
        />

        {/* 🔘 CERCHIO */}
        <div
          ref={centerRef}
          className="absolute top-[65%] left-1/2 w-20 h-20
                    -translate-x-1/2 -translate-y-1/2
                    rounded-full border-4 border-white z-[5]"
        ></div>

        {/* ⭐ VIDEO 2 (dopo lo slide) */}
        <video
          ref={video2Ref}
          src="/img/videoInternal.mp4"
          muted
          playsInline
          className="absolute opacity-0 w-full h-full object-cover z-[2]"
        />

        {/* SLIDER */}
        <h2 ref={textRef} className="absolute top-[48%] w-full text-center left-1/2 -translate-x-1/2 text-white opacity-0 z-[20] tracking-[0.25em]">
          TRASCINA PER CONTINUARE
        </h2>

        <div ref={trackRef} className="absolute top-[55%] left-1/2 -translate-x-1/2 w-[270px] h-10 opacity-0 z-[20]">
          <div className="absolute -translate-y-1/2 inset-0 border-b border-white/30"></div>
          <div className="absolute right-0 top-1/2 -translate-y-1/2 w-2 h-2 bg-white rounded-full"></div>
          <div ref={knobRef} className="absolute left-0 w-10 h-10 border-[2px] border-white rounded-full"></div>
        </div>
      </div>
    </>
  );
};
