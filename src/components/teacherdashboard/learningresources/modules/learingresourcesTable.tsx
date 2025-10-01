"use client";
import React, { useMemo, useState } from "react";
import { FiltersBar } from "./filterseachbar";

type ResourceRow = {
  id: number;
  name: string;
  details: "Course video link" | "PDF link";
  kind: "video" | "pdf";
};

const RESOURCES: ResourceRow[] = [
  { id: 1, name: "File Name", details: "Course video link", kind: "video" },
  { id: 2, name: "File Name", details: "Course video link", kind: "video" },
  { id: 3, name: "File Name", details: "PDF link",          kind: "pdf" },
  { id: 4, name: "File Name", details: "PDF link",          kind: "pdf" },
  { id: 5, name: "File Name", details: "Course video link", kind: "video" },
  { id: 6, name: "File Name", details: "Course video link", kind: "video" },
  { id: 7, name: "File Name", details: "Course video link", kind: "video" },
  { id: 8, name: "File Name", details: "PDF link",          kind: "pdf" },
  { id: 9, name: "File Name", details: "PDF link",          kind: "pdf" },
  { id: 10, name: "File Name", details: "PDF link",         kind: "pdf" },
];

export default function TeacherLearningResources() {
  const [searchQuery, setSearchQuery] = useState("");

  const rows = useMemo(() => {
    const term = searchQuery.trim().toLowerCase();
    if (!term) return RESOURCES;
    return RESOURCES.filter((r) =>
      r.name.toLowerCase().includes(term) || r.details.toLowerCase().includes(term)
    );
  }, [searchQuery]);

  return (
    <div className="bg-white rounded-lg mx-auto w-full max-w-[1600px]">
      <div className="px-5 pt-4 pb-4 flex justify-between md:justify-end">
        <FiltersBar searchQuery={searchQuery} onSearchChange={setSearchQuery} />
      </div>

      <div className="overflow-x-auto lg:overflow-hidden rounded-lg">
        <table className="w-full table-fixed border-0">
            <thead>
            <tr className="bg-[#F1F5F6] text-sm md:text-[14px] text-neutral-600 h-16">
              <th className="pl-4 pr-4 md:pl-6 md:pr-6 lg:pl-10 lg:pr-10 py-4 text-left font-medium rounded-tl-lg">No</th>
              <th className="pl-4 pr-4 md:pl-6 md:pr-6 lg:pl-10 lg:pr-10 py-4 text-left font-medium">Resource name</th>
              <th className="pl-4 pr-4 md:pl-6 md:pr-6 lg:pl-10 lg:pr-10 py-4 text-left font-medium">Details</th>
              <th className="pl-4 pr-4 md:pl-6 md:pr-6 lg:pl-10 lg:pr-10 py-4 text-left font-medium rounded-tr-lg">Attachment</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id} className="text-xs md:text-[12px] bg-white">
                <td className="pl-4 pr-4 md:pl-6 md:pr-6 lg:pl-10 lg:pr-10 py-4 border-b border-[var(--neutral-200)]">{r.id}</td>
                <td className="pl-4 pr-4 md:pl-6 md:pr-6 lg:pl-10 lg:pr-10 py-4 border-b border-[var(--neutral-200)]">{r.name}</td>
                <td className="pl-4 pr-4 md:pl-6 md:pr-6 lg:pl-10 lg:pr-10 py-4 border-b border-[var(--neutral-200)]">{r.details}</td>
                <td className="pl-4 pr-4 md:pl-6 md:pr-6 lg:pl-10 lg:pr-10 py-4 border-b border-[var(--neutral-200)]">
                  {r.kind === "video" ? (
                    <button className="h-8 md:h-8 lg:h-7 px-4 md:px-4 lg:px-3 rounded-full bg-[var(--primary)] text-white text-xs md:text-xs lg:text-[11px]">
                      Watch for video
                    </button>
                  ) : (
                    <button className="h-8 md:h-8 lg:h-7 px-4 md:px-4 lg:px-3 rounded-full bg-[var(--primary)] text-white text-xs md:text-xs lg:text-[11px]">
                      Download
                    </button>
                  )}
                </td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan={4} className="px-5 py-8 text-center text-[var(--neutral-700)]">
                  No resources found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}