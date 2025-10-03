// LearningResourcesTable.tsx
"use client";

import React, { useMemo, useState } from "react";
import { Eye, PencilLine, Trash, Search } from "lucide-react";
import Pagination from "@/components/ui/pagination";
import AddResourceModal from "../popup/addresourcesmodal";

type Row = { id: number; name: string; type: "Course video" | "PDF" };

/** Demo data (30 rows so you can see pagination working).
 * Replace with your own data source.
 */
const seed: Row[] = Array.from({ length: 30 }, (_, i) => ({
  id: i + 1,
  name: "File Name",
  type: (i % 3 === 0 ? "PDF" : "Course video") as Row["type"],
}));

export default function LearningResourcesTable() {
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const pageSize = 10;

  // Filter then paginate
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return seed;
    return seed.filter(
      (r) =>
        r.name.toLowerCase().includes(q) ||
        r.type.toLowerCase().includes(q) ||
        String(r.id).includes(q)
    );
  }, [query]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const currentPage = Math.min(page, totalPages); // guard if filter shrinks pages
  const start = (currentPage - 1) * pageSize;
  const pageRows = filtered.slice(start, start + pageSize);

  const handlePageChange = (newPage: number) => {
    setPage(Math.min(Math.max(1, newPage), totalPages));
  };

  const handleEditClick = () => {
    setIsModalOpen(true);
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
  };

  const handleResourceSubmit = (details: string, type: string, link: string) => {
    console.log("Resource submitted:", { details, type, link });
    // TODO: Implement actual resource submission logic
    // This could involve API calls to save the resource
  };

  return (
    <div className="bg-white rounded-lg mx-auto w-full max-w-[1600px]">
      {/* Header */}
      <div className="px-5 pt-4 pb-4 flex justify-between items-center">
        <h1 className="text-3xl font-semibold text-gray-900">
          Learning Resources
        </h1>

        <div className="relative w-full max-w-[520px]">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2"
            size={18}
            stroke="var(--neutral-700)"
          />
          <input
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setPage(1); // reset to first page when searching
            }}
            type="text"
            placeholder="Search..."
            className="w-full rounded-full border border-[var(--neutral-300)] bg-[var(--neutral-100)] py-2 pl-9 pr-4 text-sm text-[var(--neutral-900)] outline-none focus:border-[var(--blue-400)]"
          />
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto lg:overflow-hidden rounded-lg flex justify-center">
        <table className="w-[1140px] table-fixed border-0 ">
          <thead>
            <tr className="bg-[#F1F5F6] text-sm md:text-[14px] text-neutral-600 h-20">
              <th className="pl-4 pr-4 md:pl-6 md:pr-6 lg:pl-10 lg:pr-10 py-4 text-left font-medium rounded-tl-lg">No</th>
              <th className="pl-4 pr-4 md:pl-6 md:pr-6 lg:pl-10 lg:pr-10 py-4 text-left font-medium">Details</th>
              <th className="pl-4 pr-4 md:pl-6 md:pr-6 lg:pl-10 lg:pr-10 py-4 text-left font-medium">File type</th>
              <th className="pl-4 pr-4 md:pl-6 md:pr-6 lg:pl-10 lg:pr-10 py-4 text-left font-medium rounded-tr-lg">Actions</th>
            </tr>
          </thead>

          <tbody>
            {pageRows.map((r) => (
              <tr key={r.id} className="text-sm md:text-[14px] bg-white">
                <td className="pl-4 pr-4 md:pl-6 md:pr-6 lg:pl-10 lg:pr-10 py-4 border-b border-[var(--neutral-200)]">{r.id}</td>
                <td className="pl-4 pr-4 md:pl-6 md:pr-6 lg:pl-10 lg:pr-10 py-4 border-b border-[var(--neutral-200)]">{r.name}</td>
                <td className="pl-4 pr-4 md:pl-6 md:pr-6 lg:pl-10 lg:pr-10 py-4 border-b border-[var(--neutral-200)]">{r.type}</td>
                <td className="pl-4 pr-4 md:pl-6 md:pr-6 lg:pl-10 lg:pr-10 py-4 border-b border-[var(--neutral-200)]">
                  <div className="flex gap-4">
                    <button
                      className="rounded-full p-2 transition-colors hover:bg-[var(--neutral-200)]"
                      aria-label="View"
                      title="View"
                    >
                      <Eye size={20} />
                    </button>
                    <button
                      onClick={handleEditClick}
                      className="rounded-full p-2 transition-colors hover:bg-[var(--neutral-200)]"
                      aria-label="Edit"
                      title="Edit"
                    >
                      <PencilLine size={20} />
                    </button>
                    <button
                      className="rounded-full p-2 transition-colors hover:bg-[var(--neutral-200)]"
                      aria-label="Delete"
                      title="Delete"
                    >
                      <Trash size={20} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}

            {/* Empty state when search has no matches */}
            {pageRows.length === 0 && (
              <tr>
                <td
                  colSpan={4}
                  className="px-6 py-10 text-center text-sm text-[var(--neutral-700)]"
                >
                  No resources found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex justify-center">
        <div className="w-[1140px]">
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={filtered.length}
            itemsPerPage={pageSize}
            onPageChange={handlePageChange}
            className="border-t border-gray-200 "
          />
        </div>
      </div>

      {/* Add Resource Modal */}
      <AddResourceModal
        open={isModalOpen}
        onClose={handleModalClose}
        onSubmit={handleResourceSubmit}
      />
    </div>
  );
}
