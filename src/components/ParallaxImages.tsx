import React, { useRef, useLayoutEffect, useState, useEffect } from "react";
import gsap from "gsap";
import Draggable from "gsap/Draggable";

gsap.registerPlugin(Draggable);

export const ParallaxImages: React.FC = () => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [audioReady, setAudioReady] = useState(false);
  const [isMuted, setIsMuted] = useState(true);

  const containerRef = useRef<HTMLDivElement>(null);
  const video1Ref = useRef<HTMLVideoElement>(null);
  const video2Ref = useRef<HTMLVideoElement>(null);
  const centerRef = useRef<HTMLDivElement>(null);

  const trackRef = useRef<HTMLDivElement>(null);
  const knobRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLHeadingElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);

  const firstVideoStarted = useRef(false);
  const sliderUnlocked = useRef(false);

  // ============================================================
  // PRELOAD RISORSE
  // ============================================================
  useEffect(() => {
    const preload = (src: string) =>
      new Promise<void>((resolve) => {
        const v = document.createElement("video");
        v.src = src;
        v.onloadeddata = () => resolve();
        setTimeout(resolve, 2000);
      });

    Promise.all([
      preload("/img/videoStart.mp4"),
      preload("/img/videoInternal.mp4")
    ]).then(() => {
      setIsLoaded(true);
    });
  }, []);

  // ============================================================
  // AUDIO: preparo MA NON lo faccio partire!
  // ============================================================
  useEffect(() => {
    if (!audioRef.current) return;
    audioRef.current.volume = 0.25;

    // Se l’utente interagisce, posso abilitare il play
    const enableAudio = () => {
      setAudioReady(true);
      document.removeEventListener("click", enableAudio);
      document.removeEventListener("touchstart", enableAudio);
    };

    document.addEventListener("click", enableAudio);
    document.addEventListener("touchstart", enableAudio);
  }, []);

  const toggleAudio = () => {
    if (!audioRef.current) return;
    if (!audioReady) return; // Non far nulla se il browser non ha ancora dato il permesso

    const muted = audioRef.current.muted;
    audioRef.current.muted = !muted;
    setIsMuted(!isMuted);

    if (!audioRef.current.muted) {
      audioRef.current.play().catch(() => {});
    }
  };

  // ============================================================
  // ANIMAZIONI / LOGICA VIDEO
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

    gsap.to("#preloader", { opacity: 0, duration: 0.5 });

    gsap.to(center, {
      scale: 1.15,
      opacity: 0.9,
      repeat: -1,
      yoyo: true,
      duration: 1.1,
    });

    const playFirst = () => {
      if (firstVideoStarted.current) return;
      firstVideoStarted.current = true;

      gsap.killTweensOf(center);
      gsap.to(center, { opacity: 0, duration: 0.3 });

      video1.currentTime = 0;
      video1.play();

      video1.onended = () => {
        gsap.to(video1, { opacity: 0, duration: 1 });
        gsap.to(video2, { opacity: 1, duration: 1 });
        gsap.to([track, text], { opacity: 1, delay: 0.5 });
      };
    };

    let lastTap = 0;
    container.addEventListener("dblclick", playFirst);
    container.addEventListener("touchend", () => {
      const now = Date.now();
      if (now - lastTap < 300) playFirst();
      lastTap = now;
    });

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
        disabled={!audioReady}
        style={{ opacity: audioReady ? 1 : 0.4 }}
      >
        {isMuted ? "🔇" : "🔊"}
      </button>

      <audio
        ref={audioRef}
        src="/img/musica.mp3"
        loop
        preload="auto"
        muted
      />

      <div ref={containerRef} className="absolute w-full h-full overflow-hidden">

        <video
          ref={video1Ref}
          src="/img/videoStart.mp4"
          muted
          playsInline
          className="absolute w-full h-full object-cover object-top z-[1]"
        />

        <div
          ref={centerRef}
          className="absolute top-[65%] left-1/2 w-20 h-20
                    -translate-x-1/2 -translate-y-1/2
                    rounded-full border-4 border-white z-[5]"
        ></div>

        <video
          ref={video2Ref}
          src="/img/videoInternal.mp4"
          muted
          playsInline
          className="absolute opacity-0 w-full h-full object-cover z-[2]"
        />

        <h2
          ref={textRef}
          className="absolute top-[48%] w-full text-center left-1/2 -translate-x-1/2 text-white opacity-0 z-[20] tracking-[0.25em]"
        >
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
