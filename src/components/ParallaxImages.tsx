import React, { useRef, useLayoutEffect, useState, useEffect } from "react";
import gsap from "gsap";
import Draggable from "gsap/Draggable";

gsap.registerPlugin(Draggable);

const BOARD_CONFIG = {
  left: 41.5,
  top: 45,
  width: 18,
  height: 22,
};

export const ParallaxImages: React.FC = () => {
  const [ready, setReady] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [showCalendar, setShowCalendar] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const poster1= useRef<HTMLImageElement>(null);
  const poster2= useRef<HTMLImageElement>(null);
  const loghiref= useRef<HTMLImageElement>(null);
  const video1Ref = useRef<HTMLVideoElement>(null);
  const video2Ref = useRef<HTMLVideoElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const knobRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const centerRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLHeadingElement>(null);
  const textRef1 = useRef<HTMLHeadingElement>(null);
  const textRef2 = useRef<HTMLHeadingElement>(null);

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

  /* 🎞️ PRELOAD VIDEO */
  useEffect(() => {
    const v1 = video1Ref.current;
    const v2 = video2Ref.current;
    if (!v1 || !v2) return;

    let loaded = 0;
    const done = () => {
      loaded++;
      if (loaded >= 2) setReady(true);
    };

    [v1, v2].forEach((m) => {
      if (m.readyState >= 3) done();
      else m.addEventListener("canplaythrough", done, { once: true });
    });
  }, []);

  /* 📌 FALLBACK iPhone */
  useEffect(() => {
    const t = setTimeout(() => setReady(true), 5000);
    return () => clearTimeout(t);
  }, []);

  /* 🔊 AUDIO SOLO DA CLICK BOTTONE */
  const toggleAudio = () => {
    if (!audioRef.current) return;

    if (audioRef.current.muted) {
      audioRef.current.muted = false;
      setIsMuted(false);
      audioRef.current.play().catch(() => {});
    } else {
      audioRef.current.muted = true;
      setIsMuted(true);
      audioRef.current.pause();
    }
  };

  /* 🎬 ANIMAZIONI */
  useLayoutEffect(() => {
    if (!ready) return;

    const v1 = video1Ref.current!;
    const v2 = video2Ref.current!;
    const p1 = poster1.current!;
    const p2 = poster2.current!;
    const loghi = loghiref.current!;
    const knob = knobRef.current!;
    const track = trackRef.current!;
    const text = textRef.current!;
    const text1 = textRef1.current!;
    const text2 = textRef2.current!;
    const center = centerRef.current!;
    const container = containerRef.current!;

    gsap.to("#preloader", { autoAlpha: 0, duration: 0.4 });
    gsap.to(center, { scale: 1.12, opacity: 0.3, repeat: -1, yoyo: true });

    const playFirst = () => {
      if (firstVideoStarted.current) return;
      firstVideoStarted.current = true;

      gsap.killTweensOf(center);
      gsap.to([center,p1,text1,loghi], { opacity: 0, duration: 0.8});

      v1.currentTime = 0;
      v1.play();
      v1.onended = () => {
        gsap.to(v1, { opacity: 0, duration: 0.8 });
        gsap.to([v2,p2], { opacity: 1, duration: 0.8 });

        gsap.to([text, track], { opacity: 1, delay: 0.5 });

        v2.onended = () => {
          setShowCalendar(true);
          gsap.to(text2, { 
              opacity: 1, 
              duration: 0.8,
              onComplete: () => {
                          const link = document.querySelector(".powered-link") as HTMLElement;
                          if (link) link.style.pointerEvents = "auto"; // 🔥 attiva i click!
                         }
            });

        }
      };
    };

    /* TAP / DOPPIO TAP */
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

      {!ready && (
  <div
    id="preloader"
    className="fixed inset-0 bg-[#791434] flex flex-col items-center justify-center z-[9999]"
  >
    {/* IMMAGINE DI CARICAMENTO */}
    <img
      src="/img/palazzoLogoRosso.jpg"
      alt="loader"
      className="w-[180px] h-[180px] object-contain mb-6"
    />

    {/* SCRITTA ANIMATA "CARICAMENTO..." */}
    <div className="font-christmas text-white text-xl font-semibold flex gap-1">
      <span>LOADING</span>
      <span className="w-8 flex">
        <span className="dot1">.</span>
        <span className="dot2">.</span>
        <span className="dot3">.</span>
      </span>
    </div>

    {/* ANIMAZIONE DEI TRE PUNTINI */}
    <style>
      {`
        .dot1, .dot2, .dot3 {
          opacity: 0;
          animation: blink 1.4s infinite;
        }
        .dot2 { animation-delay: 0.2s; }
        .dot3 { animation-delay: 0.4s; }

        @keyframes blink {
          0% { opacity: 0; }
          50% { opacity: 1; }
          100% { opacity: 0; }
        }
      `}
    </style>
  </div>
)}


      {/* AUDIO BUTTON */}
      <button
        onClick={toggleAudio}
        className="fixed top-6 right-6 z-[999] text-white p-3 bg-white/30 backdrop-blur-md rounded-full"
      >
        {isMuted ? "🔇" : "🔊"}
      </button>

      <audio
        ref={audioRef}
        src="/img/musica.mp3"
        preload="auto"
        playsInline
        loop
        muted
      />

      <div ref={containerRef} className="scene-container">

        <img
          ref={loghiref}
          src="/img/topLocandina.png"
          className="absolute top-[10%] w-[30%] object-contain h-[30%] left-[35%] pointer-events-none z-[2] opacity-1"
          alt="poster1"
        />

        {/* Poster sotto Video1 */}
        <img
          ref={poster1}
          src="/img/frameMobile1.png"
          className="absolute object-contain w-full h-full pointer-events-none z-[0] opacity-1"
          alt="poster1"
        />

        {/* Video 1 */}
        <video
          ref={video1Ref}
          src="/img/mobile1.mp4"
          playsInline
          muted
          preload="auto"
          poster="/img/imgStart.jpg"
          className="absolute w-full h-full"
        />

        <div ref={centerRef} className="absolute top-[65%] left-1/2 w-20 h-20 border-4 border-white rounded-full -translate-x-1/2 -translate-y-1/2" />
        <h2 ref={textRef1} className="absolute font-christmas top-[85%] left-1/2 top-[48%] w-full text-center text-white -translate-x-1/2 -translate-y-1/2">
          DOPPIO CLICK PER CONTINUARE
        </h2>
        <img
          ref={poster2}
          src="/img/frameMobile2.png"
          className="absolute w-full h-full object-contain pointer-events-none z-[0] opacity-0"
          alt="poster2"
        />

        {/* Video 2 */}
        <video
          ref={video2Ref}
          src="/img/mobileVideo1.mp4"
          playsInline
          muted
          preload="auto"
          poster="/img/interno.jpg"
          className="absolute w-full h-full opacity-0"
        />

        {/* Slider */}
        <h2 ref={textRef} className="font-christmas absolute top-[72%] left-[12.5%] w-[75%] text-center text-white opacity-0 tracking-[0.3em]">
          TRASCINA PER CONTINUARE
        </h2>
        <div ref={trackRef} className="absolute top-[77%] left-1/2 w-[270px] h-10 -translate-x-1/2 opacity-0 z-[1000]">
          <div className="absolute inset-0 -translate-y-1/2 border-b border-white/40" />
          <div ref={knobRef} className="absolute left-0 w-10 h-10 border-2 border-white rounded-full" />
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
              className="w-full h-[100%] grid"
              style={{
                gridTemplateColumns: "repeat(5, 1fr)",
                gridTemplateRows: "repeat(3, 1fr)",
                rowGap: "8%",
                columnGap: "5%",
              }}
            >
              {[20, 21, 22, 23, 24, 27, 28, 29, 30, 31, 2, 3, 4, 5, 6].map((day) => (
                <button
                  key={day}
                  onClick={() => setSelectedImage(`/img/events/${day}.jpg`)}
                  className="cursor-pointer pointer-events-auto"
                  style={{width: "100%", height: "100%"}}
                />
              ))}
            </div>
          </div>
        )}
        <h2 ref={textRef2} className="font-christmas absolute top-[77%] left-[32.5%] w-[35%] text-[80%] text-center text-white opacity-0">
          CLICCA SULLA DATA <br/> PER SCOPRIRE L'EVENTO DEL GIORNO
          <a
            href="https://www.instagram.com/isac.agency"
            target="_blank"
            rel="noopener noreferrer"
            className="powered-link block font-christmas mt-2 text-[70%] text-white/80 underline pointer-events-none"
            >
            powered by isac.agency
          </a>
        </h2>
      </div>

      {selectedImage && (
        <div className="fixed inset-0 bg-black/80 z-[999] flex items-center justify-center">
          <img src={selectedImage} className="max-w-[80%] max-h-[80%] rounded-xl" />
          <button
            onClick={() => setSelectedImage(null)}
            className="absolute font-christmas top-8 right-8 text-red-600 text-3xl"
          >
            X
          </button>
        </div>
      )}
    </>
  );
};