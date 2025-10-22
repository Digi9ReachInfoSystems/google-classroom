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

function HoverPanel({
  name,
  stats,
}: {
  name: string | null;
  stats: DzStats | null;
}) {
  return (
    <div className="w-[360px] rounded-xl bg-[#787878] text-white p-6 shadow-md">
      {name && stats ? (
        <>
          <div className="text-[24px] font-semibold tracking-wide mb-3">
            {name.toUpperCase()}
          </div>

          <div className="grid grid-cols-2 gap-y-3 gap-x-6">
            <div>
              <div className="text-[12px] text-white/80">Schools</div>
              <div className="text-[16px] mt-1">{stats.schools.toLocaleString()}</div>
            </div>
            <div>
              <div className="text-[12px] text-white/80">Teachers</div>
              <div className="text-[16px] mt-1">{stats.teachers.toLocaleString()}</div>
            </div>
            <div>
              <div className="text-[12px] text-white/80">Students</div>
              <div className="text-[16px] mt-1">{stats.students.toLocaleString()}</div>
            </div>
            <div>
              <div className="text-[12px] text-white/80">Ideas</div>
              <div className="text-[16px] mt-1">{stats.ideas.toLocaleString()}</div>
            </div>
          </div>
        </>
      ) : (
        <div className="text-center py-8">
          <div className="text-[20px] font-semibold mb-2">
            Select a District
          </div>
          <div className="text-[14px] text-white/80 leading-relaxed">
            Hover over any district on the map to view its statistics and information.
          </div>
        </div>
      )}
    </div>
  );
}

/* ================================== MAP ONLY ================================= */
/** Hover-only interaction - no click selection */
function BhutanMap({
  highlighted,
  onHoverDistrict,
}: {
  highlighted: string | null;
  onHoverDistrict: (name: string | null) => void;
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
        setFill(el, "#f6f6f6");
      };

      els.forEach((el) => {
        el.style.cursor = "pointer";
        const onIn = () => enter(el);
        const onOut = () => leave(el);
        el.addEventListener("mouseenter", onIn);
        el.addEventListener("mouseleave", onOut);
        (el as any).__cleanup = () => {
          el.removeEventListener("mouseenter", onIn);
          el.removeEventListener("mouseleave", onOut);
        };
      });
    })();

    return () => {
      cancelled = true;
      if (hostRef.current) hostRef.current.innerHTML = "";
    };
  }, []);

  // Repaint fills when hover changes without rebuilding DOM
  useEffect(() => {
    const svg = hostRef.current?.querySelector("svg");
    if (!svg) return;
    const els = svg.querySelectorAll<SVGElement>("path[data-id]");
    els.forEach((el) => {
      const name = el.getAttribute("data-name");
      const isHighlighted = name === highlighted;
      const color = isHighlighted ? "#FFA31A" : "#f6f6f6";
      el.style.setProperty("fill", color, "important");
    });
  }, [highlighted]);

  return <div ref={hostRef} className="w-full" />;
}

/* ================================== PAGE =================================== */

const Map: React.FC = () => {
  const [hoverDistrict, setHoverDistrict] = useState<string | null>(null);

  // data source: hover only
  const activeDistrict = hoverDistrict;
  const stats = useMemo(() => {
    if (!activeDistrict) return null;
    // Find the district in our SAMPLE data
    const found = Object.values(SAMPLE).find(d => 
      d.name.toLowerCase() === activeDistrict.toLowerCase()
    );
    return found || null;
  }, [activeDistrict]);

  return (
    <section id="map" className="w-full bg-[var(--neutral-100)] py-10">
      <div className="max-w-6xl mx-auto px-6">
        {/* Title */}
        <div className="text-center mb-8">
          <h2 className="text-[40px] md:text-[48px] font-normal text-[var(--neutral-1000)]">Bhutan</h2>
        </div>

        {/* Map + hover panel */}
        <div className="w-full flex flex-col lg:flex-row items-center justify-center gap-6">
          <BhutanMap
            highlighted={hoverDistrict}
            onHoverDistrict={setHoverDistrict}
          />
          <HoverPanel name={activeDistrict} stats={stats} />
        </div>
      </div>
    </section>
  );
};


export default Map;