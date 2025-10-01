"use client";

import React, { useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import type { IdeaRow } from "@/components/teacherdashboard/Ideas/modules/IdeasTable";
import { SearchBar } from "@/components/districtideas/submitteddata/seacrchBar";

type Row = {
  student: string;
  title: string;
  category: string;
  date: string;
  status: "Completed" | "Pending";
  fileHref?: string;
};

const DATA: Row[] = [
  { student: "Alice Smith", title: "Smart Recycling Bin", category: "STEM",  date: "Sep 10, 2025", status: "Completed", fileHref: "#" },
  { student: "Rahul P",     title: "Digital Art Showcase", category: "Arts", date: "Sep 1, 2025",  status: "Pending",   fileHref: "#" },
  { student: "Sneha M",     title: "—",                    category: "—",    date: "—",           status: "Pending" },
  { student: "Arjun T",     title: "—",                    category: "—",    date: "—",           status: "Pending" },
  { student: "Alice Smith", title: "Smart Recycling Bin",  category: "Arts", date: "Sep 10, 2025", status: "Completed", fileHref: "#" },
  { student: "Alice Smith", title: "—",                    category: "—",    date: "—",           status: "Pending" },
  { student: "Alice Smith", title: "Smart Recycling Bin",  category: "Arts", date: "Sep 10, 2025", status: "Pending",   fileHref: "#" },
  { student: "Alice Smith", title: "—",                    category: "—",    date: "—",           status: "Pending" },
  { student: "Alice Smith", title: "Smart Recycling Bin",  category: "STEM", date: "Sep 10, 2025", status: "Completed", fileHref: "#" },
  { student: "Rahul P",     title: "Digital Art Showcase", category: "Arts", date: "Sep 1, 2025",  status: "Pending",   fileHref: "#" },
  { student: "Sneha M",     title: "—",                    category: "—",    date: "—",           status: "Pending" },
  { student: "Arjun T",     title: "—",                    category: "—",    date: "—",           status: "Pending" },
  { student: "Alice Smith", title: "Smart Recycling Bin",  category: "Arts", date: "Sep 10, 2025", status: "Completed", fileHref: "#" },
  { student: "Alice Smith", title: "—",                    category: "—",    date: "—",           status: "Pending" },
  { student: "Alice Smith", title: "Smart Recycling Bin",  category: "Arts", date: "Sep 10, 2025", status: "Pending",   fileHref: "#" },
  { student: "Alice Smith", title: "—",                    category: "—",    date: "—",           status: "Pending" },
];

// Using shared IdeasTable component for consistent styling

export default function Submitteddata() {
  const [q, setQ] = useState("");

  // Filter and map local data to IdeasTable rows
  const ideaRows: IdeaRow[] = useMemo(() => {
    const term = q.trim().toLowerCase();
    const filtered = term
      ? DATA.filter(
          (r) =>
            r.student.toLowerCase().includes(term) ||
            r.title.toLowerCase().includes(term) ||
            r.category.toLowerCase().includes(term)
        )
      : DATA;

    return filtered.map<IdeaRow>((r) => ({
      studentName: r.student,
      ideaTitle: r.title,
      category: r.category,
      dateSubmitted: r.date,
      status: r.status === "Completed" ? "completed" : "pending",
      fileUrl: r.fileHref,
    }));
  }, [q]);

  return (
    <section className="bg-white overflow-hidden mt-[20px] px-5 py-5">
      {/* Row 1: label + search */}
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-[14px] font-medium text-[var(--neutral-1000)]">
          My submitted data
        </h3>

        <SearchBar searchQuery={q} onSearchChange={setQ} />
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
                    <a className="text-[#2E7CF6] hover:underline whitespace-nowrap inline-block" href={r.fileUrl} target="_blank" rel="noreferrer">
                      Google form link
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
      </div>
    </section>
  );
}