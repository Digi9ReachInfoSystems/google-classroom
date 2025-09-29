"use client";
import Image from "next/image";
import React, { useEffect, useMemo, useRef, useState } from "react";

type Slide = { src: string; alt?: string };

const slides: Slide[] = [
  { src: "/pilont.png", alt: "Pilot & Training 1" },
  { src: "/pilont.png", alt: "Pilot & Training 2" },
  { src: "/pilont.png", alt: "Pilot & Training 3" },
];

const AUTO_MS = 9000;
const SWIPE_THRESHOLD = 50; // px

const PilotTrainingCarousel: React.FC = () => {
  const [index, setIndex] = useState(0);
  const count = useMemo(() => slides.length, []);
  const autoRef = useRef<NodeJS.Timeout | null>(null);

  // swipe state
  const startX = useRef<number | null>(null);
  const deltaX = useRef(0);
  const dragging = useRef(false);

  const goTo = (i: number) => {
    setIndex((i + count) % count);
  };
  const next = () => goTo(index + 1);
  const prev = () => goTo(index - 1);

  const startAuto = () => {
    stopAuto();
    autoRef.current = setInterval(() => {
      setIndex((i) => (i + 1) % count);
    }, AUTO_MS);
  };
  const stopAuto = () => {
    if (autoRef.current) clearInterval(autoRef.current);
    autoRef.current = null;
  };

  useEffect(() => {
    startAuto();
    return stopAuto;
  }, [count]);

  // reset auto after manual interaction
  useEffect(() => {
    startAuto();
  }, [index]);

  // keyboard left/right
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") { stopAuto(); next(); }
      if (e.key === "ArrowLeft")  { stopAuto(); prev(); }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [index]);

  // pointer (mouse/touch) handlers
  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    stopAuto();
    dragging.current = true;
    (e.currentTarget as HTMLDivElement).setPointerCapture(e.pointerId);
    startX.current = e.clientX;
    deltaX.current = 0;
  };

  const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!dragging.current || startX.current == null) return;
    deltaX.current = e.clientX - startX.current;
  };

  const onPointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!dragging.current) return;
    dragging.current = false;
    (e.currentTarget as HTMLDivElement).releasePointerCapture(e.pointerId);

    const dx = deltaX.current;
    startX.current = null;
    deltaX.current = 0;

    if (Math.abs(dx) > SWIPE_THRESHOLD) {
      if (dx < 0) next();
      else prev();
    } else {
      // no-op (snap back), auto will restart via effect
      startAuto();
    }
  };

  return (
<section id="pilot" className="w-full bg-[var(--neutral-100)] overflow-x-clip">
      {/* Heading */}
      <div className="max-w-5xl mx-auto px-6 pt-8 text-center">
        <h2 className="text-[48px] font-normal text-[var(--neutral-1000)]">
          Pilot & Training
        </h2>
        <p className="mt-3 text-[18px] leading-[28px] font-normal text-[var(--neutral-700)]">
          We provide a one month pilot program with selected schools and
          districts to test dashboards, alerts, and reporting. Includes
          role-based training for Super Admin, School Admin, and Teachers to
          ensure smooth adoption.
        </p>
      </div>

      {/* Full-bleed carousel */}
        <div
    className="
      relative w-[100vw] left-1/2 -translate-x-1/2
      mt-6 overflow-hidden
    "
  >
        {/* Track */}
        <div
          className="flex transition-transform duration-700 ease-out select-none"
          style={{ transform: `translateX(-${index * 100}%)` }}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
        >
          {slides.map((s, i) => (
            <div key={i} className="min-w-full relative">
              <Image
                src={s.src}
                alt={s.alt ?? "Pilot slide"}
                className="block w-screen h-[60vh] md:h-[70vh] object-cover"
                draggable={false}
              />
              {/* Top gradient */}
              <div className="pointer-events-none absolute top-0 left-0 w-full h-32 md:h-40 bg-gradient-to-b from-white to-transparent" />
              {/* Bottom gradient */}
              <div className="pointer-events-none absolute bottom-0 left-0 w-full h-40 md:h-52 bg-gradient-to-t from-white to-transparent" />
            </div>
          ))}
        </div>

        {/* Arrow controls */}
        {/* <button
          aria-label="Previous slide"
          onClick={() => { stopAuto(); prev(); }}
          className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/70 hover:bg-white rounded-full w-10 h-10 flex items-center justify-center shadow"
        >
          ‹
        </button>
        <button
          aria-label="Next slide"
          onClick={() => { stopAuto(); next(); }}
          className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/70 hover:bg-white rounded-full w-10 h-10 flex items-center justify-center shadow"
        >
          ›
        </button> */}

        {/* Pager bars */}
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-2">
          {slides.map((_, i) => {
            const active = i === index;
            return (
              <button
                key={i}
                aria-label={`Go to slide ${i + 1}`}
                onClick={() => { stopAuto(); goTo(i); }}
                className={`h-1.5 rounded-full transition-all ${
                  active
                    ? "w-10 bg-[var(--neutral-800)]"
                    : "w-6 bg-[var(--neutral-300)] hover:bg-[var(--neutral-400)]"
                }`}
              />
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default PilotTrainingCarousel;












