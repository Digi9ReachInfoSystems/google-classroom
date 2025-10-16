"use client";
import React, { useEffect, useState, useMemo } from "react";
import { useDistrictCourse } from "../../districtadmin/context/DistrictCourseContext";

/* ---------- 72px ring ---------- */
function RingProgress({
  size = 72,
  stroke = 6,
  percent = 0,
  text,
}: {
  size?: number;
  stroke?: number;
  percent: number;
  text: string;
}) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const dash = (percent / 100) * c;

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="shrink-0">
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="var(--neutral-300)" strokeWidth={stroke} strokeLinecap="round" />
      <circle
        cx={size/2} cy={size/2} r={r} fill="none"
        stroke="var(--primary)" strokeWidth={stroke} strokeLinecap="round"
        strokeDasharray={`${dash} ${c-dash}`} transform={`rotate(-90 ${size/2} ${size/2})`}
      />
      <text x="50%" y="50%" dominantBaseline="middle" textAnchor="middle" fontSize="14"
            fill="var(--neutral-1000)" style={{fontWeight: 400}}>
        {text}
      </text>
    </svg>
  );
}

/* ---------- KPI card (112 x 280) ---------- */
function KPI({ valueText, label, percentArc }: { valueText: string; label: string; percentArc: number }) {
  return (
    <div className="h-[112px] w-[280px] bg-white px-5 py-4 flex items-center gap-4">
      <RingProgress percent={percentArc} text={valueText} size={72} />
      <p className="text-[14px] leading-5 text-[var(--neutral-1000)] whitespace-nowrap">{label}</p>
    </div>
  );
}

const IdeasKPI: React.FC = () => {
  const { selectedCourse } = useDistrictCourse();
  const [schools, setSchools] = useState<string[]>([]);
  const [selectedDistrict, setSelectedDistrict] = useState<string>('All');
  const [selectedSchool, setSelectedSchool] = useState<string>('All');
  const [totalStudents, setTotalStudents] = useState(0);
  const [totalIdeasSubmitted, setTotalIdeasSubmitted] = useState(0);
  const [submittedPercentage, setSubmittedPercentage] = useState(0);
  const [loading, setLoading] = useState(false);

  // Fetch schools
  useEffect(() => {
    const fetchSchools = async () => {
      try {
        const schoolsRes = await fetch('/api/districtadmin/schools');
        if (schoolsRes.ok) {
          const schoolsData = await schoolsRes.json();
          if (schoolsData.success) {
            setSchools(['All', ...schoolsData.schools.map((s: any) => s.name)]);
          }
        }
      } catch (error) {
        console.error('Error fetching schools:', error);
        setSchools(['All']);
      }
    };

    fetchSchools();
  }, []);

  // Fetch ideas data when filters change
  useEffect(() => {
    if (selectedCourse?.id) {
      fetchIdeasData();
    }
  }, [selectedCourse, selectedDistrict, selectedSchool]);

  const fetchIdeasData = async () => {
    if (!selectedCourse?.id) return;

    try {
      setLoading(true);
      const params = new URLSearchParams();
      params.set('courseId', selectedCourse.id);
      if (selectedDistrict && selectedDistrict !== 'All') params.set('district', selectedDistrict);
      if (selectedSchool && selectedSchool !== 'All') params.set('schoolName', selectedSchool);

      const response = await fetch(`/api/districtadmin/ideas?${params.toString()}`);
      const data = await response.json();

      if (data.success) {
        setTotalStudents(data.totalStudents || 0);
        setTotalIdeasSubmitted(data.totalIdeasSubmitted || 0);
        setSubmittedPercentage(data.submittedPercentage || 0);
      }
    } catch (error) {
      console.error('Error fetching ideas data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!selectedCourse) {
    return (
      <div className="min-h-screen bg-white p-6 flex items-center justify-center">
        <p className="text-muted-foreground">Please select a course to view ideas</p>
      </div>
    );
  }

  return (
    <section className="w-full space-y-5 px-5">
      {/* Row 1: Title + dropdowns */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-3xl font-semibold">Ideas</h2>

        <div className="flex items-center gap-3">
          <select 
            value={selectedDistrict}
            onChange={(e) => setSelectedDistrict(e.target.value)}
            className="h-9 rounded-full border border-neutral-300 bg-white px-3 text-sm outline-none focus:ring-2 focus:ring-neutral-300"
          >
            <option value="All">All Districts</option>
          </select>

          <select 
            value={selectedSchool}
            onChange={(e) => setSelectedSchool(e.target.value)}
            className="h-9 rounded-full border border-neutral-300 bg-white px-3 text-sm outline-none focus:ring-2 focus:ring-neutral-300"
          >
            {schools.map((school) => (
              <option key={school} value={school}>{school === 'All' ? 'All Schools' : school}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Row 2: KPI cards */}
      <div className="flex gap-6 mb-8">
        <KPI 
          valueText={loading ? "..." : totalStudents.toString()} 
          label="Total no of students" 
          percentArc={100} 
        />
        <KPI 
          valueText={loading ? "..." : totalIdeasSubmitted.toString()} 
          label="Total no of idea submitted" 
          percentArc={submittedPercentage} 
        />
      </div>
    </section>
  );
};

export default IdeasKPI;
