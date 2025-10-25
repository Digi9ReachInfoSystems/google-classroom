import React from "react";

const Hero: React.FC = () => {
  return (
    <section
      id="home"
      className="relative w-full h-screen flex items-center"
      style={{
        backgroundImage: "url('/hero.jpg')",
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      {/* Dark Overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-black/50 to-transparent" />

      {/* White bottom gradient */}
      <div className="absolute bottom-0 left-0 w-full h-52 bg-gradient-to-t from-white to-transparent" />

      {/* Content */}
      <div className="relative z-10 max-w-3xl px-6 text-left md:ml-[10%]">
        {/* 600 / 48px / 58px */}
        <h1 className="font-semibold text-[48px] leading-[58px] text-white">
          Empowering Schools <br />
          with Smarter <span className="text-[var(--primary)]">Insights</span>
        </h1>

        {/* 400 / 12px */}
        <p className="mt-4 font-normal text-[13px] text-neutral-200 max-w-2xl">
          Unlock real-time analytics, student progress tracking, and performance
          dashboards<br /> all in one powerful platform designed for schools,
          teachers, and students.
        </p>

        {/* Button text: 400 / 12px */}
        <a
          href="/login"
          className="inline-flex mt-8 px-6 py-3 rounded-3xl font-normal text-[14px] bg-[var(--primary)] text-white hover:bg-[var(--primary)] transition"
        >
          Get Started
        </a>
      </div>
    </section>
  );
};

export default Hero;
