"use client";
import Image from "next/image";
import React, { useMemo, useState, useEffect } from "react";
import { useDistrictCourse } from "../context/DistrictCourseContext";
import { useSchoolFilter } from "@/app/(districtadmin)/districtadmin/overview/page";

/* ✓ / ? using your assets */
function StatusIcon({ type }: { type: "ok" | "warn" }) {
  const src = type === "ok" ? "/checkcircle.png" : "/questioncircle.png";
  return (
    <Image
      src={src}
      alt=""
      width={24}
      height={24}
      className="h-6 w-6 inline-block"
      draggable={false}
    />
  );
}

/* Orange progress with centered knob; red dot at extreme start */
function LessonProgress({ value }: { value: number }) {
  const v = Math.max(0, Math.min(100, value));
  const TRACK_H = 8;
  const KNOB = 14;
  const EXTREME = 6; // <= show red dot
  const isStart = v <= EXTREME;

  return (
    <div className="relative w-full max-w-[11rem] min-w-[8rem]" style={{ height: KNOB }}>
      {/* gray track (centered vertically) */}
      <div
        className="absolute left-0 right-0 rounded-full bg-[var(--neutral-300)]"
        style={{ height: TRACK_H, top: "50%", transform: "translateY(-50%)" }}
      />
      {/* filled orange */}
      {!isStart && (
        <div
          className="absolute left-0 rounded-full bg-[var(--primary)]"
          style={{ height: TRACK_H, width: `${v}%`, top: "50%", transform: "translateY(-50%)" }}
        />
      )}
      {/* knob / red start dot */}
      {isStart ? (
        <span
          className="absolute rounded-full bg-[var(--error-400)]"
          style={{ width: 12, height: 12, left: 4, top: "50%", transform: "translateY(-50%)" }}
          aria-hidden
        />
      ) : (
        <span
          className="absolute rounded-full bg-white border border-[var(--neutral-300)] shadow-sm"
          style={{ width: KNOB, height: KNOB, left: `${v}%`, top: "50%", transform: "translate(-50%, -50%)" }}
          aria-hidden
        />
      )}
    </div>
  );
}

type Row = {
  name: string;
  pre: "ok" | "warn";
  lesson: number;
  idea: "ok" | "warn";
  post: "ok" | "warn";
  cert: "ok" | "warn";
};

export default function StudentsTable() {
  const { selectedCourse } = useDistrictCourse();
  const { selectedSchool } = useSchoolFilter();
  const [q, setQ] = useState("");
  const [students, setStudents] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch students from API
  useEffect(() => {
    const fetchStudents = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Build URL with courseId and schoolName filters
        const params = new URLSearchParams();
        if (selectedCourse) params.set('courseId', selectedCourse.id);
        if (selectedSchool && selectedSchool !== 'all') params.set('schoolName', selectedSchool);
        
        const url = `/api/districtadmin/students?${params.toString()}`;
        
        console.log('Fetching students:', url);
        const response = await fetch(url);
        
        if (!response.ok) {
          throw new Error(`Failed to fetch students: ${response.status}`);
        }
        
        const data = await response.json();
        
        if (data.success && data.students) {
          setStudents(data.students);
        } else {
          throw new Error(data.message || 'Failed to load students');
        }
      } catch (err) {
        console.error('Error fetching students:', err);
        setError(err instanceof Error ? err.message : 'Failed to load students');
        setStudents([]);
      } finally {
        setLoading(false);
      }
    };

    fetchStudents();
  }, [selectedCourse, selectedSchool]); // Re-fetch when course or school changes

  const rows = useMemo(() => {
    const term = q.trim().toLowerCase();
    return term ? students.filter(r => r.name.toLowerCase().includes(term)) : students;
  }, [q, students]);

  const headers = [
    "Student Name",
    "Pre survey",
    "Lesson progress",
    "Idea submission",
    "Post survey",
    "Course certificate",
  ];

  if (loading) {
    return (
      <div className="bg-white rounded-lg border-neutral-200 p-6">
        <div className="flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          <span className="ml-2 text-gray-600">Loading students...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg border-neutral-200 p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-600 text-sm">Error loading students: {error}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="mt-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg  border-neutral-200">
      {/* search pill */}
      <div className="px-5 pt-4 pb-4 flex justify-end">
        <label className="flex items-center gap-2 rounded-full border border-[var(--neutral-300)] bg-white pl-4 pr-4 h-10 w-full sm:w-[300px] md:w-[360px] max-w-full shadow-[0_1px_2px_rgba(16,24,40,0.05)] focus-within:ring-2 focus-within:ring-[var(--neutral-200)]">
          <svg width="16" height="16" viewBox="0 0 24 24" className="text-black">
            <path
              d="M21 21l-4.35-4.35m1.35-5.65a7 7 0 11-14 0 7 7 0 0114 0z"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            className="bg-transparent outline-none flex-1 text-sm text-[var(--neutral-900)] placeholder-[var(--neutral-500)]"
            placeholder="Search..."
          />
        </label>
      </div>

      {/* HEADER (separate table so body can scroll) */}
      <div className="pr-2">
        <table className="w-full table-fixed border-0 [&_*]:!border-0">
          <thead>
            <tr className="bg-[#F1F5F6] text-[12px] text-neutral-600">
              {headers.map((h, idx) => (
                <th
                  key={h}
                  className={`px-5 py-3 text-left font-medium border-0 ${idx === 0 ? "rounded-tl-lg" : ""} ${idx === headers.length - 1 ? "rounded-tr-lg" : ""}`}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
        </table>
      </div>

      {/* BODY: scrollable only, header remains static */}
      <div className="max-h-[224px] overflow-y-auto rounded-b-lg custom-scrollbar pr-2">
        <table className="w-full table-fixed">
          <tbody>
            {rows.map((r) => (
              <tr key={r.name} className="text-[12px] bg-white hover:bg-muted/50 transition-colors">
                <td className="px-5 py-4 font-light text-[var(--neutral-1000)] border-r border-b border-[var(--neutral-200)] last:border-r-0">
                  {r.name}
                </td>
                <td className="px-5 py-4 border-r border-b border-[var(--neutral-200)] last:border-r-0">
                  <StatusIcon type={r.pre} />
                </td>
                <td className="px-5 py-4 border-r border-b border-[var(--neutral-200)] last:border-r-0">
                  <LessonProgress value={r.lesson} />
                </td>
                <td className="px-5 py-4 border-r border-b border-[var(--neutral-200)] last:border-r-0">
                  <StatusIcon type={r.idea} />
                </td>
                <td className="px-5 py-4 border-r border-b border-[var(--neutral-200)] last:border-r-0">
                  <StatusIcon type={r.post} />
                </td>
                <td className="px-5 py-4 border-b border-[var(--neutral-200)] last:border-r-0">
                  <StatusIcon type={r.cert} />
                </td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td
                  colSpan={headers.length}
                  className="px-5 py-8 text-center text-[var(--neutral-700)]"
                >
                  No students found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}