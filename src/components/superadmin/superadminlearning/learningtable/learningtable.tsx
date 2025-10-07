// LearningResourcesTable.tsx
"use client";

import React, { useMemo, useState, useEffect } from "react";
import { Eye, PencilLine, Trash, Search } from "lucide-react";
import Pagination from "@/components/ui/pagination";
import AddResourceModal from "../popup/addresourcesmodal";

type Row = { 
  id: string; 
  details: string; 
  type: "Video" | "Document" | "Link" | "Image" | "Other";
  link?: string;
  createdBy: string;
  createdAt: string;
};

export default function LearningResourcesTable() {
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [resources, setResources] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const pageSize = 10;

  // Fetch resources from API
  useEffect(() => {
    const fetchResources = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const response = await fetch('/api/superadmin/learning-resources');
        
        if (!response.ok) {
          throw new Error(`Failed to fetch resources: ${response.status}`);
        }
        
        const data = await response.json();
        
        if (data.success && data.resources) {
          setResources(data.resources);
        } else {
          throw new Error(data.message || 'Failed to load resources');
        }
      } catch (err) {
        console.error('Error fetching resources:', err);
        setError(err instanceof Error ? err.message : 'Failed to load resources');
        setResources([]);
      } finally {
        setLoading(false);
      }
    };

    fetchResources();
  }, []);

  // Filter then paginate
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return resources;
    return resources.filter(
      (r) =>
        r.details.toLowerCase().includes(q) ||
        r.type.toLowerCase().includes(q) ||
        r.id.toLowerCase().includes(q)
    );
  }, [query, resources]);

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

  const handleResourceSubmit = async (details: string, type: string, link: string) => {
    try {
      const response = await fetch('/api/superadmin/learning-resources', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ details, type, link }),
      });

      if (!response.ok) {
        throw new Error(`Failed to create resource: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.success) {
        // Add the new resource to the list
        setResources(prev => [data.resource, ...prev]);
        console.log('Resource created successfully:', data.resource);
      } else {
        throw new Error(data.message || 'Failed to create resource');
      }
    } catch (err) {
      console.error('Error creating resource:', err);
      setError(err instanceof Error ? err.message : 'Failed to create resource');
    }
  };

  const handleDeleteResource = async (resourceId: string) => {
    if (!confirm('Are you sure you want to delete this resource?')) {
      return;
    }

    try {
      const response = await fetch(`/api/superadmin/learning-resources/${resourceId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error(`Failed to delete resource: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.success) {
        // Remove the resource from the list
        setResources(prev => prev.filter(r => r.id !== resourceId));
        console.log('Resource deleted successfully');
      } else {
        throw new Error(data.message || 'Failed to delete resource');
      }
    } catch (err) {
      console.error('Error deleting resource:', err);
      setError(err instanceof Error ? err.message : 'Failed to delete resource');
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg mx-auto w-full max-w-[1600px] p-8">
        <div className="flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          <span className="ml-2 text-gray-600">Loading resources...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg mx-auto w-full max-w-[1600px] p-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-600 text-sm">Error: {error}</p>
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
            {pageRows.map((r, index) => (
              <tr key={r.id} className="text-sm md:text-[14px] bg-white">
                <td className="pl-4 pr-4 md:pl-6 md:pr-6 lg:pl-10 lg:pr-10 py-4 border-b border-[var(--neutral-200)]">
                  {start + index + 1}
                </td>
                <td className="pl-4 pr-4 md:pl-6 md:pr-6 lg:pl-10 lg:pr-10 py-4 border-b border-[var(--neutral-200)]">
                  <div className="flex flex-col">
                    <span className="font-medium">{r.details}</span>
                    {r.link && (
                      <a 
                        href={r.link} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-blue-600 text-xs hover:underline"
                      >
                        {r.link}
                      </a>
                    )}
                  </div>
                </td>
                <td className="pl-4 pr-4 md:pl-6 md:pr-6 lg:pl-10 lg:pr-10 py-4 border-b border-[var(--neutral-200)]">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    {r.type}
                  </span>
                </td>
                <td className="pl-4 pr-4 md:pl-6 md:pr-6 lg:pl-10 lg:pr-10 py-4 border-b border-[var(--neutral-200)]">
                  <div className="flex gap-4">
                    {r.link && (
                      <a
                        href={r.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="rounded-full p-2 transition-colors hover:bg-[var(--neutral-200)]"
                        aria-label="View"
                        title="View"
                      >
                        <Eye size={20} />
                      </a>
                    )}
                    <button
                      onClick={handleEditClick}
                      className="rounded-full p-2 transition-colors hover:bg-[var(--neutral-200)]"
                      aria-label="Edit"
                      title="Edit"
                    >
                      <PencilLine size={20} />
                    </button>
                    <button
                      onClick={() => handleDeleteResource(r.id)}
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

            {/* Empty state when no resources */}
            {pageRows.length === 0 && (
              <tr>
                <td
                  colSpan={4}
                  className="px-6 py-10 text-center"
                >
                  <div className="flex flex-col items-center space-y-2">
                    <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center">
                      <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </div>
                    <p className="text-gray-500 text-sm">No learning resources found</p>
                    <p className="text-gray-400 text-xs">Click the "Add Resource" button to create your first resource</p>
                  </div>
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
