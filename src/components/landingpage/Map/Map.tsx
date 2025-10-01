"use client";
import Image from "next/image";
import React, { useEffect, useMemo, useRef, useState } from "react";

/* ============================  types & static data  ============================ */
type DzKey =
  | "bumthang" | "chhukha" | "dagana" | "gasa" | "haa" | "lhuentse"
  | "mongar" | "paro" | "pemagatshel" | "punakha" | "samdrupjongkhar"
  | "samtse" | "sarpang" | "thimphu" | "trashigang" | "trashiyangtse"
  | "trongsa" | "tsirang" | "wangduephodrang" | "zhemgang";

type DzStats = {
  name: string;
  schools: number; teachers: number; teams: number; students: number; ideas: number;
};

const SAMPLE: Record<DzKey, DzStats> = {
  bumthang: { name: "Bumthang", schools: 28, teachers: 410, teams: 22, students: 6800, ideas: 93 },
  chhukha:  { name: "Chhukha",  schools: 55, teachers: 930, teams: 60, students: 17800, ideas: 210 },
  dagana:   { name: "Dagana",   schools: 41, teachers: 620, teams: 44, students: 12100, ideas: 150 },
  gasa:     { name: "Gasa",     schools: 8,  teachers: 120, teams: 10, students: 1900,  ideas: 35  },
  haa:      { name: "Haa",      schools: 25, teachers: 390, teams: 24, students: 7000,  ideas: 96  },
  lhuentse: { name: "Lhuentse", schools: 23, teachers: 360, teams: 20, students: 6200,  ideas: 80  },
  mongar:   { name: "Mongar",   schools: 58, teachers: 940, teams: 66, students: 18100, ideas: 205 },
  paro:     { name: "Paro",     schools: 40, teachers: 700, teams: 50, students: 14000, ideas: 180 },
  pemagatshel:{name:"Pemagatshel",schools: 35, teachers: 560, teams: 38, students: 9800, ideas: 132 },
  punakha:  { name: "Punakha",  schools: 33, teachers: 540, teams: 36, students: 9300,  ideas: 125 },
  samdrupjongkhar:{name:"Samdrup Jongkhar",schools: 52, teachers: 870, teams: 63, students: 17400, ideas: 201 },
  samtse:   { name: "Samtse",   schools: 69, teachers: 1140,teams: 78, students: 21900, ideas: 260 },
  sarpang:  { name: "Sarpang",  schools: 63, teachers: 1030,teams: 72, students: 20500, ideas: 240 },
  thimphu:  { name: "Thimphu",  schools: 75, teachers: 1450,teams: 88, students: 28000, ideas: 320 },
  trashigang:{ name:"Trashigang",schools: 66, teachers: 1100,teams: 75, students: 22300, ideas: 250 },
  trashiyangtse:{name:"Trashiyangtse",schools: 24, teachers: 380, teams: 21, students: 6500, ideas: 90 },
  trongsa:  { name: "Trongsa",  schools: 21, teachers: 330, teams: 18, students: 5600,  ideas: 74  },
  tsirang:  { name: "Tsirang",  schools: 37, teachers: 590, teams: 40, students: 10200, ideas: 140 },
  wangduephodrang:{name:"Wangdue Phodrang",schools: 49, teachers: 820, teams: 58, students: 16800, ideas: 195 },
  zhemgang: { name: "Zhemgang", schools: 27, teachers: 410, teams: 26, students: 7200,  ideas: 100 },
};

/* ============================  geojson → svg helpers  ============================ */
type FC = {
  type: "FeatureCollection";
  features: Array<{
    type: "Feature";
    properties: Record<string, any>;
    geometry: { type: "Polygon" | "MultiPolygon"; coordinates: any };
  }>;
};

const slug = (s: string) => s.toLowerCase().replace(/[^a-z]/g, "");

// bbox for fitting to the SVG viewBox
function bboxOfFeatureCollection(fc: FC) {
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  fc.features.forEach(f => {
    const geom = f.geometry;
    const polys = geom.type === "Polygon" ? [geom.coordinates] : geom.coordinates;
    polys.forEach((rings: number[][][]) => {
      rings.forEach((ring: number[][]) => {
        ring.forEach(([x, y]) => {
          if (x < minX) minX = x; if (y < minY) minY = y;
          if (x > maxX) maxX = x; if (y > maxY) maxY = y;
        });
      });
    });
  });
  return { minX, minY, maxX, maxY, width: maxX - minX, height: maxY - minY };
}

function toPathD(
  geom: { type: "Polygon" | "MultiPolygon"; coordinates: any },
  proj: (x: number, y: number) => [number, number]
) {
  const polys = geom.type === "Polygon" ? [geom.coordinates] : geom.coordinates;
  let d = "";
  polys.forEach((rings: number[][][]) => {
    rings.forEach((ring: number[][]) => {
      ring.forEach(([x, y], i) => {
        const [sx, sy] = proj(x, y);
        d += (i === 0 ? `M ${sx} ${sy}` : ` L ${sx} ${sy}`);
      });
      d += " Z";
    });
  });
  return d;
}

/* ============================  OPTIONAL live students via API  ============================ */
/** flip to true when you want Students to come from your API instead of SAMPLE */
const USE_LIVE_STUDENTS = false;

/** map each dzongkhag to its Google Classroom courseId (fill when you go live) */
const COURSE_BY_DZ: Partial<Record<DzKey, string>> = {
  // thimphu: "1234567890", // ← example
};

async function fetchStudents(courseId: string) {
  const res = await fetch(`/api/classroom/${encodeURIComponent(courseId)}/students`, {
    credentials: "include",
    cache: "no-store",
  });
  if (!res.ok) {
    const txt = await res.text().catch(() => "");
    throw new Error(`${res.status} ${res.statusText} ${txt}`);
  }
  return res.json() as Promise<{ success: boolean; students: Array<{ userId: string }> }>;
}

/* ==================================  component  ================================== */
const Map: React.FC = () => {
  const wrapperRef = useRef<HTMLDivElement | null>(null);

  const [selected, setSelected] = useState<DzKey>("gasa");
  const [hovered, setHovered] = useState<DzKey | null>(null);
  const [liveStudents, setLiveStudents] = useState<Partial<Record<DzKey, number>>>({});
  const [loadingLive, setLoadingLive] = useState(false);

  // load live student counts ONLY if flag is on
  useEffect(() => {
    if (!USE_LIVE_STUDENTS) return;
    let aborted = false;

    (async () => {
      try {
        setLoadingLive(true);
        const entries = await Promise.all(
          (Object.keys(SAMPLE) as DzKey[]).map(async (k) => {
            const courseId = COURSE_BY_DZ[k];
            if (!courseId) return [k, undefined] as const;
            const { students } = await fetchStudents(courseId);
            return [k, students.length] as const;
          })
        );
        if (!aborted) {
          const next: Partial<Record<DzKey, number>> = {};
          for (const [k, v] of entries) if (typeof v === "number") next[k] = v;
          setLiveStudents(next);
        }
      } catch {
        // keep silent; we’ll just fall back to SAMPLE
      } finally {
        if (!aborted) setLoadingLive(false);
      }
    })();

    return () => { aborted = true; };
  }, []);

  const activeKey = hovered ?? selected;

  // merge live student counts (if fetched) into the displayed stats
  const stats = useMemo(() => {
    const base = SAMPLE[activeKey];
    const students = USE_LIVE_STUDENTS && liveStudents[activeKey] != null
      ? liveStudents[activeKey]!
      : base.students;
    return { ...base, students };
  }, [activeKey, liveStudents]);

  // build SVG from GeoJSON
  useEffect(() => {
    let cancelled = false;

    (async () => {
      // 1) Load GeoJSON
      const res = await fetch("/bhutanmap.geojson", { cache: "no-store" });
      const fc: FC = await res.json();

      if (cancelled || !wrapperRef.current) return;

      // 2) Fit projection to viewBox (flip Y for SVG)
      const PAD = 10;
      const VIEW_W = 900, VIEW_H = 480;
      const bb = bboxOfFeatureCollection(fc);
      const sx = (VIEW_W - PAD * 2) / bb.width;
      const sy = (VIEW_H - PAD * 2) / bb.height;
      const scale = Math.min(sx, sy);
      const offsetX = PAD - bb.minX * scale;
      const offsetY = PAD + bb.maxY * scale; // flip Y
      const proj = (x: number, y: number): [number, number] => [
        Math.round(x * scale + offsetX),
        Math.round(offsetY - y * scale)
      ];

      // 3) Generate a <path> per feature
      const paths: string[] = [];
      fc.features.forEach((f, idx) => {
        const name = (f.properties.Dzongkhag ?? f.properties.name ?? `dz_${idx}`) as string;
        const id = slug(name) as DzKey; // e.g. "Thimphu" -> "thimphu"
        const d = toPathD(f.geometry, proj);
        const sel = id === selected;
        paths.push(
          `<path data-dz="${id}" data-name="${name}"
                 d="${d}"
                 fill="${sel ? 'var(--primary)' : '#E5E7EB'}"
                 stroke="#BDBDBD" stroke-width="1" />`
        );
      });

      // 4) Inject SVG
      const svg =
        `<svg xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 ${VIEW_W} ${VIEW_H}" style="width:100%;height:auto;display:block">
            <g>${paths.join("")}</g>
         </svg>`;
      wrapperRef.current.innerHTML = svg;

      // 5) Interactivity
      const svgEl = wrapperRef.current.querySelector("svg")!;
      const els = svgEl.querySelectorAll<SVGElement>("[data-dz][data-name]");

      const over = (el: SVGElement) => {
        const k = el.getAttribute("data-dz") as DzKey;
        if (!(k in SAMPLE)) return; // ignore features without stats
        setHovered(k);
        el.style.setProperty("fill", "var(--primary)", "important");
      };
      const out = (el: SVGElement) => {
        setHovered(null);
        const k = el.getAttribute("data-dz") as DzKey;
        const isSel = k === selected;
        el.style.setProperty("fill", isSel ? "var(--primary)" : "#E5E7EB", "important");
      };
      const click = (el: SVGElement) => {
        const k = el.getAttribute("data-dz") as DzKey;
        if (k in SAMPLE) setSelected(k);
      };

      els.forEach((el) => {
        el.style.cursor = "pointer";
        const enter = () => over(el);
        const leave = () => out(el);
        const press = () => click(el);
        el.addEventListener("mouseenter", enter);
        el.addEventListener("mouseleave", leave);
        el.addEventListener("click", press);
        (el as any).__clean = () => {
          el.removeEventListener("mouseenter", enter);
          el.removeEventListener("mouseleave", leave);
          el.removeEventListener("click", press);
        };
      });

      // cleanup on re-run/unmount
      return () => {
        els.forEach((el) => (el as any).__clean?.());
      };
    })();

    return () => {
      cancelled = true;
      if (wrapperRef.current) wrapperRef.current.innerHTML = "";
    };
  }, [selected]);

  // recolor on hover/select (without rebuilding SVG)
  useEffect(() => {
    const svg = wrapperRef.current?.querySelector("svg");
    if (!svg) return;
    const els = svg.querySelectorAll<SVGElement>("[data-dz][data-name]");
    els.forEach((el) => {
      const k = el.getAttribute("data-dz") as DzKey;
      const isActive = k === (hovered ?? selected);
      el.style.setProperty("fill", isActive ? "var(--primary)" : "#E5E7EB", "important");
    });
  }, [hovered, selected]);

  return (
    <section id="map" className="w-full bg-[var(--neutral-100)] py-10">
      <div className="max-w-6xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
        {/* LEFT: title + counters */}
        <div className="lg:col-span-4">
          <h2 className="text-[40px] md:text-[48px] font-normal text-[var(--neutral-1000)]">Bhutan</h2>

          {USE_LIVE_STUDENTS && (
            <div className="mt-1 text-[12px]">
              {loadingLive ? (
                <span className="text-[var(--neutral-700)]">Updating student counts…</span>
              ) : (
                <span className="text-[var(--neutral-600)]">Counts shown {Object.keys(liveStudents).length ? "live where available" : "from samples"}</span>
              )}
            </div>
          )}

          <div className="mt-6 grid grid-cols-2 gap-x-10 gap-y-6">
            <Stat n={stats.schools}  label="Schools" />
            <Stat n={stats.teachers} label="Teachers" />
            <Stat n={stats.teams}    label="Teams" />
            <Stat n={stats.students} label="Students" />
            <Stat n={stats.ideas}    label="Ideas" />
          </div>

          <a
            href="/login"
            className="inline-flex mt-8 px-10 py-1.5 rounded-full bg-[var(--primary)] text-white text-[14px] font-normal hover:bg-[var(--primary)] transition"
          >
            Login
          </a>
        </div>

        {/* MIDDLE: divider + arrow button (decorative) */}
{/* MIDDLE: decorative image only (270x70) */}
<div className="hidden lg:flex lg:col-span-1 items-center justify-center">
  <div className="relative h-[270px] w-[70px]">
    <Image
      src="/arrowicon.png"
      alt=""
      role="presentation"
      aria-hidden="true"
      width={70}
      height={270}
      className="absolute inset-0 h-[270px] w-[70px] object-contain select-none pointer-events-none"
    />
  </div>
</div>


        {/* RIGHT: map + active dzongkhag name */}
        <div className="lg:col-span-7">
          <div className="text-center mb-3">
            <span className="text-[36px] font-normal text-[var(--neutral-1000)]">{SAMPLE[activeKey]?.name ?? "—"}</span>
          </div>
          <div ref={wrapperRef} className="w-full" />
        </div>
      </div>
    </section>
  );
};

function Stat({ n, label }: { n: number; label: string }) {
  return (
    <div>
      <div className="text-[40px] leading-none font-medium text-[var(--neutral-1000)]">{n}</div>
      <div className="mt-1 text-[14px] text-[var(--neutral-700)]">{label}</div>
    </div>
  );
}

export default Map;

