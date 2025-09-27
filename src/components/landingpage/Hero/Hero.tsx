import React from "react";

const Hero: React.FC = () => {
  return (
    <section
    id="home"
      className="relative w-full h-screen flex items-center"
      style={{
        backgroundImage: "url('/hero.jpg')", // ✅ served from /public
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      {/* Dark Overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-black/50 to-transparent"></div>

      {/* White bottom gradient */}
      <div className="absolute bottom-0 left-0 w-full h-52 bg-gradient-to-t from-white to-transparent"></div>

      {/* Content */}
      <div className="relative z-10 max-w-3xl px-6 text-left md:ml-[10%]">
        <h1 className="text-[48px] leading-[58px] font-semibold text-white">
          Empowering Schools <br />
          with Smarter{" "}
          <span className="text-[var(--warning-400)]">Insights</span>
        </h1>

        <p className="mt-4 text-[12px] font-normal text-neutral-200 max-w-2xl">
          Unlock real-time analytics, student progress tracking, and performance
          dashboards all <br />in one powerful platform designed for schools,
          teachers, and students.
        </p>

        <button className="mt-8 px-6 py-3 rounded-md font-semibold bg-[var(--warning-400)] text-white hover:bg-[var(--warning-500)] transition">
          Get Started
        </button>
      </div>
    </section>
  );
};

export default Hero;
