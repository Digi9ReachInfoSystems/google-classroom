"use client";

import React from "react";
import { Download } from "lucide-react";
import Pagination from "@/components/ui/pagination";
import { useFilters } from "./FilterContext";
import { useTeacherCourse } from "../../context/TeacherCourseContext";

/* ---------- types & fake data ---------- */
type Row = {
  no: number;
  file: string;
  focal: string[]; // chips
  course: string;
  range: string;
  age?: string;
  grade?: string;
  gender?: string;
  disability?: string;
};

const ALL_ROWS: Row[] = Array.from({ length: 87 }).map((_, i) => ({
  no: i + 1,
  file: [
    "Report Name",
    "Report Name", 
    "Report Name",
    "Report Name",
    "Report Name",
    "Report Name",
    "Report Name",
    "Report Name",
    "Report Name",
    "Report Name"
  ][i % 10],
  focal:
    i % 4 === 1
      ? ["Age"]
      : i % 4 === 2
      ? ["Gender", "Disability", "Grade"]
      : i % 4 === 3
      ? ["Gender", "Grade"]
      : ["Age", "Gender", "Disability", "Grade"],
  course: ["Biology", "Maths", "Physics"][i % 3],
  range: "10 Jun – 12 Sep",
  age: ["10–12", "13–15", "16–18"][i % 3],
  grade: ["6", "7", "8", "9", "10", "11", "12"][i % 7],
  gender: ["Male", "Female", "Other"][i % 3],
  disability: ["None", "Hearing", "Vision", "Learning", "Mobility"][i % 5],
}));


/* ---------- small chip (better padding) ---------- */
function Chip({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center rounded-full bg-[var(--primary)] text-white text-[11px] px-2.5 py-[5px] leading-none">
      {children}
    </span>
  );
}

/* ---------- main ---------- */
export default function TeacherPidata() {
  const itemsPerPage = 10;
  const [currentPage, setCurrentPage] = React.useState(1);
  const [generatedReports, setGeneratedReports] = React.useState<Row[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  
  // Use shared filter context and course context
  const { filters } = useFilters();
  const { selectedCourse } = useTeacherCourse();

  // Fetch report data from API
  React.useEffect(() => {
    const fetchReports = async () => {
      if (!selectedCourse) {
        setGeneratedReports([]);
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const response = await fetch(`/api/teacher/reports/list?courseId=${selectedCourse.id}`);
        
        if (!response.ok) {
          throw new Error(`Failed to fetch reports: ${response.status}`);
        }
        
        const data = await response.json();
        
        if (data.success && data.reports) {
          // Transform API data to table format
          const reportEntries: Row[] = data.reports.map((report: any, index: number) => ({
            no: index + 1,
            file: report.fileName,
            focal: report.focalPoints,
            course: report.courseName,
            range: formatDate(new Date(report.generatedAt)),
            age: report.filters.age,
            grade: report.filters.grade,
            gender: report.filters.gender,
            disability: report.filters.disability,
          }));
          
          setGeneratedReports(reportEntries);
        } else {
          throw new Error(data.error || 'Failed to load reports');
        }
      } catch (err) {
        console.error('Error fetching reports:', err);
        setError(err instanceof Error ? err.message : 'Failed to load reports');
        setGeneratedReports([]);
      } finally {
        setLoading(false);
      }
    };

    fetchReports();
  }, [selectedCourse, filters]);

  // Helper function to get focal points based on filters
  const getFocalPoints = (filters: any) => {
    const points = [];
    if (filters.age) points.push('Age');
    if (filters.grade) points.push('Grade');
    if (filters.gender) points.push('Gender');
    if (filters.disability) points.push('Disability');
    return points.length > 0 ? points : ['Age', 'Gender', 'Disability', 'Grade'];
  };

  // Helper function to format date in DD-MM-YYYY format
  const formatDate = (date: Date) => {
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    return `${day}-${month}-${year}`;
  };

  const totalItems = generatedReports.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / itemsPerPage));
  
  // Reset to first page when filters change
  React.useEffect(() => {
    setCurrentPage(1);
  }, [filters]);

  const start = (currentPage - 1) * itemsPerPage;
  const rows = generatedReports.slice(start, start + itemsPerPage);

  // Handle Excel download
  const handleDownload = async (report: Row) => {
    if (!selectedCourse) {
      setError('No course selected');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/teacher/reports/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          courseId: selectedCourse.id,
          filters: {
            age: filters.age,
            grade: filters.grade,
            gender: filters.gender,
            disability: filters.disability,
          }
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate report');
      }

      // Create blob and download
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = report.file.replace(/[^a-zA-Z0-9]/g, '-') + '.xlsx';
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      console.error('Error downloading report:', err);
      setError(err instanceof Error ? err.message : 'Failed to download report');
    } finally {
      setLoading(false);
    }
  };


  return (
    <section className="w-full px-4 md:px-5 py-5 mt-5">
      {error && (
        <div className="mb-4 bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-600 text-sm">Error: {error}</p>
        </div>
      )}
      
      {!selectedCourse && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <p className="text-yellow-600 text-sm">Please select a course to view reports.</p>
        </div>
      )}

      {loading && (
        <div className="bg-white rounded-lg border border-neutral-200 p-6">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            <span className="ml-2 text-gray-600">Loading reports...</span>
          </div>
        </div>
      )}
      
      {!loading && selectedCourse && (
        <div className="bg-white rounded-lg border-neutral-200">
        {/* fixed header like student table */}
        <div className="overflow-x-auto">
          <table className="w-full table-fixed rounded-t-lg overflow-hidden border-collapse border-b border-neutral-200">
            <colgroup>
              <col className="w-[56px]" />
              <col className="w-[200px]" />
              <col className="w-[280px]" />
              <col className="w-[160px]" />
              <col className="w-[170px]" />
              <col className="w-[90px]" />
            </colgroup>
            <thead className="bg-[#F1F5F6]">
              <tr className="text-[12px] text-[var(--neutral-900)]">
                <th className="px-4 md:px-5 py-4 text-left font-normal w-[56px]">No</th>
                <th className="px-4 md:px-5 py-4 text-left font-normal w-[200px]">File name</th>
                <th className="px-4 md:px-5 py-4 text-left font-normal w-[280px]">Focal points</th>
                <th className="px-4 md:px-5 py-4 text-left font-normal w-[160px]">Course name</th>
                <th className="px-4 md:px-5 py-4 text-left font-normal w-[90px]">Action</th>
              </tr>
            </thead>
          </table>
        </div>

        {/* scrollable body only */}
        <div className="max-h-[520px] overflow-y-auto rounded-b-lg custom-scrollbar">
          <table className="w-full table-fixed">
            <colgroup>
              <col className="w-[56px]" />
              <col className="w-[200px]" />
              <col className="w-[280px]" />
              <col className="w-[160px]" />
              <col className="w-[170px]" />
              <col className="w-[90px]" />
            </colgroup>
            <tbody>
              {rows.map((r) => (
                <tr key={r.no} className="text-[12px]">
                  <td className="px-4 md:px-5 py-4 border-t border-[var(--neutral-200)] text-[var(--neutral-1000)]">
                    {r.no}
                  </td>
                  <td className="px-4 md:px-5 py-4 border-t border-[var(--neutral-200)]">
                    {r.file}
                  </td>
                  <td className="px-4 md:px-5 py-4 border-t border-[var(--neutral-200)]">
                    <div className="flex flex-wrap gap-2">
                      {r.focal.map((t) => (
                        <Chip key={t}>{t}</Chip>
                      ))}
                    </div>
                  </td>
                  <td className="px-4 md:px-5 py-4 border-t border-[var(--neutral-200)]">
                    {r.course}
                  </td>
                  <td className="px-4 md:px-5 py-4 border-t border-[var(--neutral-200)]">
                    {r.range}
                  </td>
                  <td className="px-4 md:px-5 py-4 border-t border-[var(--neutral-200)]">
                    <button
                      type="button"
                      onClick={() => handleDownload(r)}
                      disabled={loading}
                      className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-[var(--neutral-300)] hover:bg-[var(--neutral-100)] disabled:opacity-50 disabled:cursor-not-allowed"
                      aria-label={`Download ${r.file}`}
                    >
                      <Download className="h-4 w-4 text-[var(--neutral-800)]" />
                    </button>
                  </td>
                </tr>
              ))}
              {rows.length === 0 && !loading && (
                <tr>
                  <td
                    colSpan={6}
                    className="px-5 py-10 text-center border-t border-[var(--neutral-200)]"
                  >
                    <div className="flex flex-col items-center space-y-2">
                      <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center">
                        <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                      </div>
                      <p className="text-gray-500 text-sm">No reports generated yet</p>
                      <p className="text-gray-400 text-xs">Generate your first report using the download button above</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination (shared component) */}
        <div className="px-4 md:px-5 py-3">
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={totalItems}
            itemsPerPage={itemsPerPage}
            onPageChange={setCurrentPage}
          />
        </div>
        </div>
      )}
    </section>
  );
}

/* (custom pagination UI removed in favor of shared Pagination component) */
