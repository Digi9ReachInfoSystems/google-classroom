"use client";

import Image from "next/image";
import React, { useEffect, useMemo, useRef, useState } from "react";

/* =============================== STATS MODEL =============================== */

type Stats = {
  districts: number;
  schools: number;
  teachers: number;
  students: number;
  maleTeachers: number;
  femaleTeachers: number;
  otherTeachers: number;
  disabledStudents: number;
  maleStudents: number;
  femaleStudents: number;
  otherStudents: number;
  studentsEnrolled: number;
  ideasSubmitted: number;
  courseCompletion: number;
  preSurvey: number;
  postSurvey: number;
};

const BASE: Stats = {
  districts: 20,
  schools: 15800,
  teachers: 450000,
  students: 2000,
  maleTeachers: 250000,
  femaleTeachers: 250000,
  otherTeachers: 105,
  disabledStudents: 105,
  maleStudents: 850000,
  femaleStudents: 730000,
  otherStudents: 105,
  studentsEnrolled: 550000,
  ideasSubmitted: 30000,
  courseCompletion: 30000,
  preSurvey: 30000,
  postSurvey: 30000,
};

// small deterministic variance per name (so each district differs)
function hashNum(s: string, mod: number) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return (h % (mod * 2)) - mod;
}
function statsForDistrict(name: string | null | undefined): Stats {
  if (!name) return { ...BASE };
  const bump = (v: number, pct: number) =>
    Math.max(0, Math.round(v * (1 + hashNum(name, pct) / 1000)));
  return {
    districts: BASE.districts,
    schools: bump(BASE.schools, 120),
    teachers: bump(BASE.teachers, 150),
    students: bump(BASE.students, 300),
    maleTeachers: bump(BASE.maleTeachers, 120),
    femaleTeachers: bump(BASE.femaleTeachers, 120),
    otherTeachers: bump(BASE.otherTeachers, 400),
    disabledStudents: bump(BASE.disabledStudents, 400),
    maleStudents: bump(BASE.maleStudents, 120),
    femaleStudents: bump(BASE.femaleStudents, 120),
    otherStudents: bump(BASE.otherStudents, 400),
    studentsEnrolled: bump(BASE.studentsEnrolled, 120),
    ideasSubmitted: bump(BASE.ideasSubmitted, 400),
    courseCompletion: bump(BASE.courseCompletion, 400),
    preSurvey: bump(BASE.preSurvey, 400),
    postSurvey: bump(BASE.postSurvey, 400),
  };
}
const fmt = (n: number | null | undefined) =>
  n == null ? "—" : n.toLocaleString();

/* ============================= GEO → SVG HELPERS ============================= */

type FC = {
  type: "FeatureCollection";
  features: Array<{
    type: "Feature";
    properties: Record<string, any>;
    geometry: { type: "Polygon" | "MultiPolygon"; coordinates: any };
  }>;
};
const slug = (s: string) => s.toLowerCase().replace(/[^a-z]/g, "");

function bboxOfFeatureCollection(fc: FC) {
  let minX = Infinity,
    minY = Infinity,
    maxX = -Infinity,
    maxY = -Infinity;
  fc.features.forEach((f) => {
    const geom = f.geometry;
    const polys = geom.type === "Polygon" ? [geom.coordinates] : geom.coordinates;
    polys.forEach((rings: number[][][]) => {
      rings.forEach((ring: number[][]) => {
        ring.forEach(([x, y]) => {
          if (x < minX) minX = x;
          if (y < minY) minY = y;
          if (x > maxX) maxX = x;
          if (y > maxY) maxY = y;
        });
      });
    });
  });
  return { minX, minY, maxX, maxY, width: maxX - minX, height: maxY - minY };
}
function pathD(
  geom: { type: "Polygon" | "MultiPolygon"; coordinates: any },
  proj: (x: number, y: number) => [number, number]
) {
  const polys = geom.type === "Polygon" ? [geom.coordinates] : geom.coordinates;
  let d = "";
  polys.forEach((rings: number[][][]) => {
    rings.forEach((ring: number[][]) => {
      ring.forEach(([x, y], i) => {
        const [sx, sy] = proj(x, y);
        d += i === 0 ? `M ${sx} ${sy}` : ` L ${sx} ${sy}`;
      });
      d += " Z";
    });
  });
  return d;
}

/* ================================= COMPONENTS ================================ */

/** Card UI exactly like your screenshot: orange circle at left, 12px label, 16px number under it */
function StatCard({
  title,
  value,
  iconSrc,
}: {
  title: string;
  value: number | string | null | undefined;
  iconSrc: string;
}) {
  return (
    <div className="w-[279px] h-[112px] rounded-xl border border-neutral-200 bg-white px-5">
      <div className="h-full w-full flex items-center gap-4">
        <div className="h-14 w-14 rounded-full bg-[#FFA31A] grid place-items-center shrink-0">
          <Image
            src={iconSrc}
            width={26}
            height={26}
            alt=""
            className="pointer-events-none select-none"
          />
        </div>
        <div className="min-w-0">
          <div className="text-[12px] leading-none text-black font-normal">
            {title}
          </div>
          <div className="mt-2 text-[16px] leading-none text-black">
            {typeof value === "number" ? fmt(value) : (value ?? "—")}
          </div>
        </div>
      </div>
    </div>
  );
}

function HoverPanel({
  name,
  stats,
}: {
  name: string | null;
  stats: Stats | null;
}) {
  return (
    <div className="w-[360px] rounded-xl bg-[#787878] text-white p-6 shadow-md">
      <div className="text-[24px] font-semibold tracking-wide mb-3">
        {name ? name.toUpperCase() : "—"}
      </div>

      <div className="grid grid-cols-2 gap-y-3 gap-x-6">
        <div>
          <div className="text-[12px] text-white/80">Total Students</div>
          <div className="text-[16px] mt-1">{stats ? fmt(stats.students) : "—"}</div>
        </div>
        <div>
          <div className="text-[12px] text-white/80">Total Teachers</div>
          <div className="text-[16px] mt-1">{stats ? fmt(stats.teachers) : "—"}</div>
        </div>
        <div>
          <div className="text-[12px] text-white/80">Instruction</div>
          <div className="text-[16px] mt-1">{stats ? fmt(stats.preSurvey) : "—"}</div>
        </div>
        <div>
          <div className="text-[12px] text-white/80">Total Ideas</div>
          <div className="text-[16px] mt-1">
            {stats ? `${Math.min(99, Math.round((stats.courseCompletion / 40000) * 100))}%` : "—"}
          </div>
        </div>
      </div>

      {/* <button
        type="button"
        className="mt-5 h-8 w-full rounded-full bg-[#FFA31A] text-[12px] text-black"
      >
        View More
      </button> */}
    </div>
  );
}

/* ================================== MAP ONLY ================================= */
/** Now supports hover + click (click = persistent selection) */
function BhutanMap({
  highlighted,
  selected,
  onHoverDistrict,
  onSelectDistrict,
}: {
  highlighted: string | null;
  selected: string | null;
  onHoverDistrict: (name: string | null) => void;
  onSelectDistrict: (name: string | null) => void;
}) {
  const hostRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      const res = await fetch("/bhutanmap.geojson", { cache: "no-store" });
      const fc: FC = await res.json();
      if (cancelled || !hostRef.current) return;

      const PAD = 10;
      const VIEW_W = 900;
      const VIEW_H = 480;

      const bb = bboxOfFeatureCollection(fc);
      const sx = (VIEW_W - PAD * 2) / bb.width;
      const sy = (VIEW_H - PAD * 2) / bb.height;
      const scale = Math.min(sx, sy);
      const offsetX = PAD - bb.minX * scale;
      const offsetY = PAD + bb.maxY * scale; // flip Y
      const proj = (x: number, y: number): [number, number] => [
        Math.round(x * scale + offsetX),
        Math.round(offsetY - y * scale),
      ];

      const paths: string[] = [];
      fc.features.forEach((f, idx) => {
        const name =
          (f.properties.Dzongkhag ??
            f.properties.name ??
            f.properties.NAME_1 ??
            f.properties.district ??
            `dz_${idx}`) as string;
        const id = slug(name);
        const d = pathD(f.geometry, proj);
        paths.push(
          `<path data-id="${id}" data-name="${name}" d="${d}"
             fill="#f6f6f6" stroke="#dadada" stroke-width="1" />`
        );
      });
hostRef.current.innerHTML = `
  <div class="w-full bg-white rounded-2xl">
    <div class="text-[16px] text-black mb-2 ml-4 mt-4 text-left font-medium">
      Map view
    </div>
    <div class="w-full flex items-center justify-center">
      <div class="relative" style="width:704px;height:464px">
        <svg xmlns="http://www.w3.org/2000/svg"
             viewBox="0 0 ${VIEW_W} ${VIEW_H}"
             width="704" height="464" class="block">
          <g>${paths.join("")}</g>
        </svg>
      </div>
    </div>
  </div>
`;

      // interactions
      const svg = hostRef.current.querySelector("svg")!;
      const els = svg.querySelectorAll<SVGElement>("path[data-id]");

      const setFill = (el: SVGElement, color: string) =>
        el.style.setProperty("fill", color, "important");

      const enter = (el: SVGElement) => {
        onHoverDistrict(el.getAttribute("data-name"));
        setFill(el, "#FFA31A");
      };
      const leave = (el: SVGElement) => {
        onHoverDistrict(null);
        const id = el.getAttribute("data-id");
        const isSel = selected && slug(selected) === id;
        setFill(el, isSel ? "#FFA31A" : "#f6f6f6");
      };
      const click = (el: SVGElement) => {
        onSelectDistrict(el.getAttribute("data-name"));
      };

      els.forEach((el) => {
        el.style.cursor = "pointer";
        const onIn = () => enter(el);
        const onOut = () => leave(el);
        const onClick = () => click(el);
        el.addEventListener("mouseenter", onIn);
        el.addEventListener("mouseleave", onOut);
        el.addEventListener("click", onClick);
        (el as any).__cleanup = () => {
          el.removeEventListener("mouseenter", onIn);
          el.removeEventListener("mouseleave", onOut);
          el.removeEventListener("click", onClick);
        };
      });
    })();

    return () => {
      cancelled = true;
      if (hostRef.current) hostRef.current.innerHTML = "";
    };
 
  }, [onHoverDistrict, onSelectDistrict]);

  // Repaint fills when hover/selection changes without rebuilding DOM
  useEffect(() => {
    const svg = hostRef.current?.querySelector("svg");
    if (!svg) return;
    const els = svg.querySelectorAll<SVGElement>("path[data-id]");
    els.forEach((el) => {
      const id = el.getAttribute("data-id");
      const isActive =
        (!!highlighted && slug(highlighted) === id) ||
        (!!selected && slug(selected) === id);
      el.style.setProperty("fill", isActive ? "#FFA31A" : "#f6f6f6", "important");
    });
  }, [highlighted, selected]);

  return <div ref={hostRef} className="w-full" />;
}

/* ================================== PAGE =================================== */

export default function Superadminoverview() {
  const [hoverDistrict, setHoverDistrict] = useState<string | null>(null);
  const [selectedDistrict, setSelectedDistrict] = useState<string | null>(null);

  // data source: persistent selection (click) first, else transient hover
  const activeDistrict = selectedDistrict ?? hoverDistrict ?? null;
  const stats = useMemo(
    () => (activeDistrict ? statsForDistrict(activeDistrict) : null),
    [activeDistrict]
  );

  return (
    <main className="min-h-screen p-6 md:p-5">
      <h1 className="text-3xl font-semibold">
        Welcome, Super Admin!
      </h1>

      {/* Map with RIGHT-SIDE info panel */}
      <div className="w-full flex flex-col items-center">
        <div className="w-full max-w-[1200px] flex flex-col lg:flex-row items-center justify-center gap-6 mb-10">
          <BhutanMap
            highlighted={hoverDistrict}
            selected={selectedDistrict}
            onHoverDistrict={setHoverDistrict}
            onSelectDistrict={setSelectedDistrict}
          />
          <HoverPanel name={activeDistrict} stats={stats} />
        </div>
      </div>

      {/* KPI CARDS — 4 per row on lg, content matching the screenshot */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 justify-items-center">
        <StatCard title="Districts" value={stats?.districts ?? "—"} iconSrc="/metrics/teachers.png" />
        <StatCard title="Schools" value={stats?.schools ?? "—"} iconSrc="/metrics/school.png" />
        <StatCard title="Teachers" value={stats?.teachers ?? "—"} iconSrc="/metrics/teachers.png" />
        <StatCard title="Students" value={stats?.students ?? "—"} iconSrc="/metrics/students.png" />

        <StatCard title="Male Teachers" value={stats?.maleTeachers ?? "—"} iconSrc="/metrics/maleteachers.png" />
        <StatCard title="Female Teachers" value={stats?.femaleTeachers ?? "—"} iconSrc="/metrics/femaleteachers.png" />
        <StatCard title="Other Teachers" value={stats?.otherTeachers ?? "—"} iconSrc="/metrics/otherteacher.png" />
        <StatCard title="Disabled Students" value={stats?.disabledStudents ?? "—"} iconSrc="/metrics/otherstudent.png" />

        <StatCard title="Male Students" value={stats?.maleStudents ?? "—"} iconSrc="/metrics/malestudents.png" />
        <StatCard title="Female Students" value={stats?.femaleStudents ?? "—"} iconSrc="/metrics/femalestudents.png" />
        <StatCard title="Other Students" value={stats?.otherStudents ?? "—"} iconSrc="/metrics/otherstudent.png" />
        <StatCard title="Students Enrolled" value={stats?.studentsEnrolled ?? "—"} iconSrc="/metrics/enrolled.png" />

        <StatCard title="Ideas Submitted" value={stats?.ideasSubmitted ?? "—"} iconSrc="/metrics/ideas.png" />
        <StatCard title="Course completion" value={stats?.courseCompletion ?? "—"} iconSrc="/metrics/ideas.png" />
        <StatCard title="Pre survey" value={stats?.preSurvey ?? "—"} iconSrc="/metrics/ideas.png" />
        <StatCard title="Post survey" value={stats?.postSurvey ?? "—"} iconSrc="/metrics/ideas.png" />
      </div>
    </main>
  );
}
