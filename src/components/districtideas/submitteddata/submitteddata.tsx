"use client";

import React, { useMemo, useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import type { IdeaRow } from "@/components/teacherdashboard/Ideas/modules/IdeasTable";
import { SearchBar } from "@/components/districtideas/submitteddata/seacrchBar";
import { useDistrictCourse } from "../../districtadmin/context/DistrictCourseContext";

export default function Submitteddata() {
  const { selectedCourse } = useDistrictCourse();
  const [q, setQ] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [ideas, setIdeas] = useState<IdeaRow[]>([]);
  const [loading, setLoading] = useState(false);

  // Fetch ideas data
  useEffect(() => {
    if (selectedCourse?.id) {
      fetchIdeasData();
    }
  }, [selectedCourse]);

  const fetchIdeasData = async () => {
    if (!selectedCourse?.id) return;

    try {
      setLoading(true);
      const params = new URLSearchParams();
      params.set('courseId', selectedCourse.id);

      const response = await fetch(`/api/districtadmin/ideas?${params.toString()}`);
      const data = await response.json();

      if (data.success) {
        const mappedIdeas: IdeaRow[] = (data.ideas || []).map((idea: any) => ({
          studentName: idea.studentName,
          ideaTitle: idea.ideaTitle,
          category: idea.category,
          dateSubmitted: idea.dateSubmitted,
          status: idea.status,
          fileUrl: idea.fileUrl,
        }));
        setIdeas(mappedIdeas);
      }
    } catch (error) {
      console.error('Error fetching ideas data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Filter ideas based on search and status
  const ideaRows: IdeaRow[] = useMemo(() => {
    const term = q.trim().toLowerCase();
    let filtered = ideas;

    // Apply search filter
    if (term) {
      filtered = filtered.filter(
        (r) =>
          r.studentName.toLowerCase().includes(term) ||
          r.ideaTitle.toLowerCase().includes(term) ||
          r.category.toLowerCase().includes(term)
      );
    }

    // Apply status filter
    if (statusFilter !== "all") {
      filtered = filtered.filter((r) => r.status === statusFilter);
    }

    return filtered;
  }, [ideas, q, statusFilter]);

  return (
    <section className="bg-white overflow-hidden mt-[20px] px-5 py-5">
      {/* Row 1: label + filters */}
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-[14px] font-medium text-[var(--neutral-1000)]">
          Student Ideas
        </h3>

        <div className="flex items-center gap-3">
          <select 
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="h-9 rounded-full border border-neutral-300 bg-white px-3 text-sm outline-none focus:ring-2 focus:ring-neutral-300"
          >
            <option value="all">All Status</option>
            <option value="completed">Completed</option>
            <option value="pending">Pending</option>
          </select>
          <SearchBar searchQuery={q} onSearchChange={setQ} />
        </div>
      </div>

      {/* HEADER with rounded corners (align look to IdeasTable) */}
      <div className="mt-4 rounded-t-xl overflow-hidden">
        <table className="w-full table-fixed border-0 [&_*]:!border-0 rounded-t-lg overflow-hidden border-collapse border-b border-neutral-200">
          <colgroup>
            <col className="w-[22%]" />
            <col className="w-[23%]" />
            <col className="w-[14%]" />
            <col className="w-[17%]" />
            <col className="w-[12%]" />
            <col className="w-[12%]" />
          </colgroup>
          <thead>
            <tr className="bg-[#F1F5F6]">
              <th className="px-6 py-4 text-left text-sm font-medium text-neutral-600 rounded-tl-lg">Student Name</th>
              <th className="px-6 py-4 text-left text-sm font-medium text-neutral-600">Idea Title</th>
              <th className="px-6 py-4 text-left text-sm font-medium text-neutral-600">Category</th>
              <th className="px-6 py-4 text-left text-sm font-medium text-neutral-600">Date Submitted</th>
              <th className="px-6 py-4 text-left text-sm font-medium text-neutral-600">Status</th>
              <th className="px-6 py-4 text-left text-sm font-medium text-neutral-600 rounded-tr-lg">File</th>
            </tr>
          </thead>
        </table>
      </div>

      {/* BODY: rectangular (no rounded corners) with scroll */}
      <div className="max-h-[680px] overflow-y-auto custom-scrollbar rounded-b-lg">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          </div>
        ) : (
          <table className="w-full table-fixed">
            <colgroup>
              <col className="w-[22%]" />
              <col className="w-[23%]" />
              <col className="w-[14%]" />
              <col className="w-[17%]" />
              <col className="w-[12%]" />
              <col className="w-[12%]" />
            </colgroup>
            <tbody>
              {ideaRows.map((r, idx) => (
              <tr key={`${r.studentName}-${idx}`} className="bg-white hover:bg-muted/50 transition-colors">
                <td className="py-3 px-6 text-sm text-card-foreground">{r.studentName}</td>
                <td className="py-3 px-6 text-sm text-card-foreground">{r.ideaTitle}</td>
                <td className="py-3 px-6 text-sm text-card-foreground">{r.category}</td>
                <td className="py-3 px-6 text-sm text-card-foreground">{r.dateSubmitted}</td>
                <td className="py-3 px-6">
                  <Badge
                    variant={r.status === "completed" ? "default" : "secondary"}
                    className={
                      r.status === "completed"
                        ? "bg-[var(--success-500)] text-white border-transparent"
                        : "bg-[var(--neutral-200)] text-[var(--neutral-1000)] border-transparent"
                    }
                  >
                    {r.status === "completed" ? "Completed" : "Pending"}
                  </Badge>
                </td>
                <td className="py-3 px-6 text-sm whitespace-nowrap">
                  {r.fileUrl ? (
                    <a 
                      className="text-[#10B981] hover:underline whitespace-nowrap inline-block font-medium" 
                      href={r.fileUrl.replace('/viewform', '/edit#responses')} 
                      target="_blank" 
                      rel="noreferrer"
                      title="View responses in Google Forms"
                    >
                      View Responses
                    </a>
                  ) : (
                    <span className="text-neutral-400">-</span>
                  )}
                </td>
              </tr>
            ))}

              {ideaRows.length === 0 && (
                <tr>
                  <td
                    colSpan={6}
                    className="px-5 py-8 text-center text-[var(--neutral-700)] border-t border-[var(--neutral-200)]"
                  >
                    No ideas found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>
    </section>
  );
}