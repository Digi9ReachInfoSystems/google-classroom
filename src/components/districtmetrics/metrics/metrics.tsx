import Image from "next/image";
import React from "react";

type Stat = { label: string; value: string; icon: string };

type StatCardProps = Stat & {
  /** Tailwind width class; defaults to w-full */
  widthClass?: string;
};

/* row 1 */
const ROW1: Stat[] = [
  { label: "schools", value: "15,800", icon: "/metrics/school.png" },
  { label: "Teachers", value: "450,000", icon: "/metrics/teachers.png" },
  { label: "Students", value: "2,000", icon: "/metrics/students.png" },
];

/* row 2 */
const ROW2: Stat[] = [
  {
    label: "Male Teachers",
    value: "250,000",
    icon: "/metrics/maleteachers.png",
  },
  {
    label: "Female Teachers",
    value: "250,000",
    icon: "/metrics/femaleteachers.png",
  },
  { label: "Other Teachers", value: "105", icon: "/metrics/otherteacher.png" },
];

/* row 3 */
const ROW3: Stat[] = [
  {
    label: "Male Students",
    value: "850,000",
    icon: "/metrics/malestudents.png",
  },
  {
    label: "Female Students",
    value: "730,000",
    icon: "/metrics/femalestudents.png",
  },
  { label: "Other Students", value: "105", icon: "/metrics/otherstudent.png" },
];

/* row 4 (right side) */
const ROW4_RIGHT: Stat[] = [
  { label: "Pre survey", value: "30,000", icon: "/metrics/ideas.png" },
  { label: "Course completion", value: "30,000", icon: "/metrics/ideas.png" },
  { label: "Post survey", value: "30,000", icon: "/metrics/ideas.png" },
];

/* under the map (row 4, first column) */
const IDEA_SUBMITTED: Stat = {
  label: "Idea Submitted",
  value: "30,000",
  icon: "/metrics/ideas.png",
};

function StatCard({
  label,
  value,
  icon,
  widthClass = "w-full",
}: StatCardProps) {
  return (
    <div className={`h-[112px] ${widthClass} rounded-xl bg-white`}>
      <div className="h-full w-full flex items-center justify-start px-4">
        <div className="flex items-center gap-3">
          <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[var(--primary)]">
            <Image
              src={icon}
              alt={label}
              width={24}
              height={24}
              className="object-contain"
            />
          </span>
          <div className="min-w-0 text-left">
            <div className="text-[12px] font-normal leading-5 text-black truncate">
              {label}
            </div>
            <div className="text-[16px] font-normal leading-6 text-black">
              {value}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

const DistrictOverview: React.FC = () => {
  return (
    <section className="w-full px-5 sm:px-6 md:px-8 lg:px-10 xl:px-[20px]">
      <h2 className="text-3xl font-semibold">
        District Overview
      </h2>

      <div className="grid grid-cols-12 auto-rows-[112px] gap-4 items-start mt-18">
        {/* Map card */}
        <div className="col-span-12 lg:col-span-3 row-span-3 flex justify-center">
          <div className="relative w-[269px] h-[362px] rounded-3xl bg-white  flex flex-col items-center justify-center pb-14">
            <div className="relative w-[85%] h-[85%]">
              <Image
                src="/gasa.png"
                alt="Gasa district map"
                fill
                className="object-contain"
                draggable={false}
              />
            </div>
            <button
              type="button"
              className="absolute bottom-3 left-1/2 -translate-x-1/2 h-10 w-[200px] rounded-lg
                 bg-[var(--neutral-300)] text-[16px] font-medium text-[var(--neutral-1000)]"
            >
              GASA
            </button>
          </div>
        </div>

        {/* Row 1 */}
        {ROW1.map((s, i) => (
          <div
            key={s.label}
            className={`col-span-12 lg:col-span-3 ${
              i === 0 ? "lg:col-start-4" : ""
            }`}
          >
            <StatCard {...s} />
          </div>
        ))}

        {/* Row 2 */}
        {ROW2.map((s, i) => (
          <div
            key={s.label}
            className={`col-span-12 lg:col-span-3 ${
              i === 0 ? "lg:col-start-4" : ""
            }`}
          >
            <StatCard {...s} />
          </div>
        ))}

        {/* Row 3 */}
        {ROW3.map((s, i) => (
          <div
            key={s.label}
            className={`col-span-12 lg:col-span-3 ${
              i === 0 ? "lg:col-start-4" : ""
            }`}
          >
            <StatCard {...s} />
          </div>
        ))}

        {/* Row 4: Idea Submitted (269px wide) */}
        <div className="col-span-12 lg:col-span-3 flex justify-center">
          <StatCard {...IDEA_SUBMITTED} widthClass="w-[269px]" />
        </div>

        {/* Row 4 (right) */}
        {ROW4_RIGHT.map((s, i) => (
          <div
            key={s.label}
            className={`col-span-12 lg:col-span-3 ${
              i === 0 ? "lg:col-start-4" : ""
            }`}
          >
            <StatCard {...s} />
          </div>
        ))}
      </div>
    </section>
  );
};

export default DistrictOverview;
