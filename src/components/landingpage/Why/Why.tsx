import Image from "next/image";
import React from "react";

const Why: React.FC = () => {
  return (
    <section id="why" className="w-full bg-[var(--neutral-100)] py-16">
      {/* Heading */}
      <h2 className="text-center text-[48px] md:text-5xl font-weight-400 text-[var(--neutral-1000)] flex items-center justify-center gap-3">
        <span>Why</span>
        <Image
          src="/upshiftlogo.png"            // in /public
          alt="UPSHIFT"
          className="h-10 md:h-16 w-auto"
        />
      </h2>

      {/* Subheading */}
      <p className="mt-4 max-w-4xl mx-auto text-center md:text-1xl font-weight-400 text-[var(--neutral-700)]">
        Education data is powerful — when it’s easy to access and act on. UPSHIFT
        transforms raw classroom data into <br /> meaningful insights so schools can:
      </p>

      {/* Feature pills */}
      <div className="mt-10 max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6 px-6">
        {/* Pill 1 */}
        <div className="flex items-center gap-4 bg-[--blue-300] border border-[var(--neutral-600)] rounded-[40px] px-6 py-5 shadow-sm">
          <div className="flex items-center justify-center w-12 h-12 rounded-full bg-[var(--blue-400)]">
            <Image src="/piechart.svg" alt="" className="w-6 h-6" />
          </div>
          <p className="text-left font-semibold text-lg text-[var(--neutral-1000)]">
            Boost participation
          </p>
        </div>

        {/* Pill 2 */}
        <div className="flex items-center gap-4 bg-[var(--neutral-100)] border border-[var(--neutral-600)] rounded-[40px] px-6 py-5 shadow-sm">
          <div className="flex items-center justify-center w-12 h-12 rounded-full bg-[var(--warning-400)]">
            <Image src="/lock.svg" alt="" className="w-6 h-6" />
          </div>
          <p className="text-left font-semibold text-lg text-[var(--neutral-1000)]">
            Improve learning outcomes
          </p>
        </div>

        {/* Pill 3 */}
        <div className="flex items-center gap-4 bg-[var(--neutral-100)] border border-[var(--neutral-600)] rounded-[40px] px-6 py-5 shadow-sm">
          <div className="flex items-center justify-center w-12 h-12 rounded-full bg-[var(--blue-600)]">
            <Image src="/chat.svg" alt="" className="w-6 h-6" />
          </div>
          <p className="text-left font-semibold text-lg text-[var(--neutral-1000)]">
            Celebrate achievements
          </p>
        </div>
      </div>
    </section>
  );
};

export default Why;
