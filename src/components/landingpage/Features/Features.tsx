import Image from "next/image";
import React from "react";

type Feature = {
  img: string;
  title: string;
  desc: string;
  alt?: string;
  bg?: string;               // curved gradient
  className?: string;
  variant?: "wide" | "standard";
};

const features: Feature[] = [
  {
    img: "/feature1.png",
    title: "Interactive Dashboards",
    desc:
      "Track participation by geography, gender, and cohorts. Monitor progress, completion, and assessments in real time.",
    variant: "wide",
  },
  {
    img: "/feature2.png",
    title: "Smart Reports & Exports",
    desc:
      "Export data instantly to Excel or receive scheduled reports via email — complete with audit logs.",
    variant: "wide",
  },
  {
    img: "/feature3.png",
    title: "Gamified Learning",
    desc:
      "Reward achievements with automated badges, streaks, and class leaderboards for motivation.",
    variant: "standard",
  },
  {
    img: "/feature4.png",
    title: "Alerts & Notifications",
    desc:
      "Identify at-risk students early with configurable thresholds. Get in-app and email alerts with quiet-hour controls.",
    variant: "standard",
  },
  {
    img: "/feature5.png",
    title: "Visual Insights",
    desc:
      "Explore data visually with interactive maps and drill down from national → school → class → student levels.",
    variant: "standard",
  },
];

const FeatureCard: React.FC<Feature> = ({
  img,
  title,
  desc,
  alt = "",
  bg = "/backgroundimage.png",
  className = "",
  variant = "standard",
}) => {
  const mediaAspect =
    variant === "wide" ? "aspect-[16/9.8] md:aspect-[16/9.6]" : "aspect-[16/12] md:aspect-[16/11.2]";
  const imgHeights =
    variant === "wide"
      ? "max-h-[62%] sm:max-h-[64%] md:max-h-[66%]"
      : "max-h-[54%] sm:max-h-[56%] md:max-h-[58%]";

  return (
    <div
      className={[
        "overflow-hidden rounded-2xl border border-[var(--neutral-300)] shadow-sm",
        "bg-[var(--neutral-100)]",
        className,
      ].join(" ")}
    >
      {/* Media with background gradient */}
      <div
        className={`relative w-full overflow-hidden ${mediaAspect}`}
        style={{
          backgroundImage: `url('${bg}')`,
          backgroundSize: "cover",
          backgroundPosition: "right bottom",
          backgroundRepeat: "no-repeat",
        }}
      >
        {/* Foreground image pinned toward top */}
        <div className="absolute inset-0 flex items-start justify-center pt-3 md:pt-4 px-6">
          <Image
            src={img}
            alt={alt}
            className={`${imgHeights} max-w-[86%] object-contain drop-shadow-sm`}
            loading="lazy"
            width={300}
            height={100}
          />
        </div>

        {/* Bottom overlay text INSIDE the background area */}
        <div className="absolute inset-x-0 bottom-0 p-5 pt-6 bg-gradient-to-t from-white/85 via-white/30 to-transparent">
          {/* Title: 18px, 500 (medium) */}
          <h3 className="text-[var(--neutral-1000)] text-[18px] font-medium">
            {title}
          </h3>
          {/* Description: 14px, 400 (regular) */}
          <p className="mt-2 text-[14px] leading-5 font-normal text-[var(--neutral-800)]">
            {desc}
          </p>
        </div>
      </div>
    </div>
  );
};

const FeaturesSection: React.FC = () => {
  return (
    <section id="features" className="w-full py-12 bg-[var(--neutral-100)]">
      {/* Heading: 48px, 400 (regular) */}
      <h2 className="text-center text-[48px] font-normal text-[var(--neutral-1000)]">
        Features
      </h2>

      <div className="mt-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-6 max-w-6xl mx-auto px-6">
        {/* Row 1 (wide cards) */}
        <FeatureCard {...features[0]} className="lg:col-span-6 md:col-span-1" />
        <FeatureCard {...features[1]} className="lg:col-span-6 md:col-span-1" />

        {/* Row 2 */}
        <FeatureCard {...features[2]} className="lg:col-span-4 md:col-span-1" />
        <FeatureCard {...features[3]} className="lg:col-span-4 md:col-span-1" />
        <FeatureCard {...features[4]} className="lg:col-span-4 md:col-span-1" />
      </div>
    </section>
  );
};

export default FeaturesSection;
