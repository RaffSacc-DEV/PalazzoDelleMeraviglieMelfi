import React, { useRef, useLayoutEffect, useState, useEffect } from "react";
import gsap from "gsap";
import Draggable from "gsap/Draggable";

gsap.registerPlugin(Draggable);

export const ParallaxImages: React.FC = () => {
  const [ready, setReady] = useState(false);
  const [audioEnabled, setAudioEnabled] = useState(false);
  const [isMuted, setIsMuted] = useState(true);

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

  // 🔥 FUNZIONE PRELOAD AFFIDABILE
  const preloadMedia = () => {
    const media: (HTMLMediaElement | null)[] = [
      video1Ref.current,
      video2Ref.current,
      audioRef.current
    ];

    let loaded = 0;

    const onReady = () => {
      loaded++;
      if (loaded === media.length) {
        setReady(true);
      }
    };

    media.forEach(el => {
      if (!el) return;

      if (el.readyState >= 3) {
        onReady();
      } else {
        el.addEventListener("canplaythrough", onReady, { once: true });
      }
    });
  };

  useEffect(preloadMedia, []);

  // Abilita audio solo dopo interazione utente
  useEffect(() => {
    const unlockAudio = () => {
      setAudioEnabled(true);
      document.removeEventListener("click", unlockAudio);
      document.removeEventListener("touchstart", unlockAudio);
    };
    document.addEventListener("click", unlockAudio);
    document.addEventListener("touchstart", unlockAudio);
  }, []);

  const toggleAudio = () => {
    if (!audioRef.current || !audioEnabled) return;
    audioRef.current.muted = !audioRef.current.muted;
    setIsMuted(audioRef.current.muted);
    if (!audioRef.current.muted) audioRef.current.play().catch(() => {});
  };

  useLayoutEffect(() => {
    if (!ready) return;

    const container = containerRef.current!;
    const v1 = video1Ref.current!;
    const v2 = video2Ref.current!;
    const knob = knobRef.current!;
    const track = trackRef.current!;
    const text = textRef.current!;
    const center = centerRef.current!;

    // Preloader fade-out
    gsap.to("#preloader", { autoAlpha: 0, duration: 0.4 });

    // Pulsazione cerchio
    gsap.to(center, {
      scale: 1.12,
      opacity: 0.9,
      repeat: -1,
      yoyo: true,
      duration: 1.1,
      ease: "power1.inOut"
    });

    // Avvio video
    const startFirstVideo = () => {
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
      };
    };

    // Attiva primo video con doppio tap o doppio click
    let lastTap = 0;
    const dbClick = () => startFirstVideo();
    const touch = () => {
      const now = Date.now();
      if (now - lastTap < 300) startFirstVideo();
      lastTap = now;
    };
    container.addEventListener("dblclick", dbClick);
    container.addEventListener("touchend", touch);

    // Slider → attiva Video 2
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
          v2.currentTime = 0;
          v2.play();
        } else {
          gsap.to(knob, { x: 0, ease: "elastic.out(1,0.4)" });
          gsap.to(text, { opacity: 1 });
        }
      }
    });

    return () => {
      container.removeEventListener("dblclick", dbClick);
      container.removeEventListener("touchend", touch);
    };
  }, [ready]);

  return (
    <>
      {/* LOADING BLOCCANTE */}
      {!ready && (
        <div id="preloader" className="fixed inset-0 bg-black text-white text-xl tracking-widest flex items-center justify-center z-[9999]">
          LOADING...
        </div>
      )}

      {/* AUDIO BUTTON */}
      <button
        onClick={toggleAudio}
        disabled={!audioEnabled}
        className="fixed top-6 right-6 z-[999] bg-white/30 backdrop-blur-md p-3 rounded-full text-white"
        style={{ opacity: audioEnabled ? 1 : 0.35 }}
      >
        {isMuted ? "🔇" : "🔊"}
      </button>

      {/* MEDIA */}
      <audio ref={audioRef} src="/img/musica.mp3" loop preload="auto" muted />

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
          className="absolute top-[65%] left-1/2 w-20 h-20 -translate-x-1/2 -translate-y-1/2 rounded-full border-4 border-white z-[5]"
        ></div>
        <video
          ref={video2Ref}
          src="/img/videoInternal.mp4"
          muted
          playsInline
          className="absolute w-full h-full opacity-0 object-cover z-[2]"
        />
        <h2 ref={textRef}
            className="absolute top-[48%] w-full text-center left-1/2 -translate-x-1/2 opacity-0 z-[20] text-white tracking-[0.3em]">
          TRASCINA PER CONTINUARE
        </h2>
        <div ref={trackRef} className="absolute top-[55%] left-1/2 -translate-x-1/2 w-[270px] h-10 opacity-0 z-[20]">
          <div className="absolute inset-0 -translate-y-1/2 border-b border-white/40"></div>
          <div ref={knobRef} className="absolute left-0 w-10 h-10 border-2 border-white rounded-full"></div>
        </div>
      </div>
    </>
  );
};
