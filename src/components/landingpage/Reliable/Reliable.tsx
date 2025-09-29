import Image from "next/image";
import React from "react";

type Item = {
  icon: string;
  title: string;
  desc: string;
};

const items: Item[] = [
  { icon: "/vector.svg",        title: "Fast",              desc: "Typical load times under 3 seconds" },
  { icon: "/accessibility.svg", title: "Accessible",        desc: "WCAG AA compliant, keyboard-friendly navigation" },
  { icon: "/calender.svg",      title: "Always Up-to-Date", desc: "Hourly data syncs and nightly full refresh" },
  { icon: "/lockpassword.svg",  title: "Secure",            desc: "Google Workspace integration, role-based access" },
];

const ReliabilitySection: React.FC = () => {
  return (
    <section 
    id="reliability"
    className="w-full bg-[var(--neutral-100)] py-14">
      <div className="max-w-6xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
        {/* Left: Heading + stacked features */}
        <div>
          {/* 48px regular */}
          <h2 className="text-[48px] font-normal text-[var(--neutral-1000)]">
            Built for Reliability
          </h2>

          {/* STACKED: icon -> title -> desc */}
          <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-x-10 gap-y-8">
            {items.map(({ icon, title, desc }) => (
              <div key={title} className="flex flex-col items-start gap-3">
                {/* icon square */}
                <div className="w-10 h-10 rounded-[10px] bg-[var(--warning-400)] flex items-center justify-center">
                  <Image src={icon} alt="" className="w-5 h-5" width={20} height={20} />
                </div>

                {/* 24px medium */}
                <h3 className="text-[24px] font-medium text-[var(--neutral-1000)]">
                  {title}
                </h3>

                {/* 12px regular, line-height 16px */}
                <p className="text-[16px] leading-4 font-normal text-[var(--neutral-800)]">
                  {desc}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Right: fixed-size image (442x448) */}
       {/* Right: fixed-size image (442x448) */}
<div className="w-full flex justify-center lg:justify-end">
  <div className="rounded-2xl overflow-hidden w-[442px] h-[448px] mx-auto lg:mx-0">
    <Image
      src="/reliableimage.png"
      alt="Students in classroom"
      className="w-full h-full object-cover"
      width={442}
      height={448}
    />
  </div>
</div>

      </div>
    </section>
  );
};

export default ReliabilitySection;
