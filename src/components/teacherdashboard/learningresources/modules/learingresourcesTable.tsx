"use client";
import React, { useMemo, useState, useEffect } from "react";
import { FiltersBar } from "./filterseachbar";

type ResourceRow = {
  id: string;
  details: string;
  type: "Video" | "Document" | "Link" | "Image" | "Other";
  link?: string;
  createdBy: string;
  createdAt: string;
};

export default function TeacherLearningResources() {
  const [searchQuery, setSearchQuery] = useState("");
  const [resources, setResources] = useState<ResourceRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch resources from API
  useEffect(() => {
    const fetchResources = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const response = await fetch('/api/teacher/learning-resources');
        
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

  const rows = useMemo(() => {
    const term = searchQuery.trim().toLowerCase();
    if (!term) return resources;
    return resources.filter((r) =>
      r.details.toLowerCase().includes(term) || 
      r.type.toLowerCase().includes(term) ||
      r.id.toLowerCase().includes(term)
    );
  }, [searchQuery, resources]);

  if (loading) {
    return (
      <div className="bg-white rounded-lg mx-auto w-full max-w-[1600px] p-8">
        <div className="flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          <span className="ml-2 text-gray-600">Loading learning resources...</span>
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
            {rows.map((r, index) => (
              <tr key={r.id} className="text-xs md:text-[12px] bg-white">
                <td className="pl-4 pr-4 md:pl-6 md:pr-6 lg:pl-10 lg:pr-10 py-4 border-b border-[var(--neutral-200)]">
                  {index + 1}
                </td>
                <td className="pl-4 pr-4 md:pl-6 md:pr-6 lg:pl-10 lg:pr-10 py-4 border-b border-[var(--neutral-200)]">
                  <div className="flex flex-col">
                    <span className="font-medium">{r.details}</span>
                    <span className="text-xs text-gray-500">Type: {r.type}</span>
                  </div>
                </td>
                <td className="pl-4 pr-4 md:pl-6 md:pr-6 lg:pl-10 lg:pr-10 py-4 border-b border-[var(--neutral-200)]">
                  <div className="flex flex-col">
                    <span className="text-sm">{r.details}</span>
                    {r.link && (
                      <a 
                        href={r.link} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-blue-600 text-xs hover:underline mt-1"
                      >
                        {r.link}
                      </a>
                    )}
                  </div>
                </td>
                <td className="pl-4 pr-4 md:pl-6 md:pr-6 lg:pl-10 lg:pr-10 py-4 border-b border-[var(--neutral-200)]">
                  {r.link ? (
                    <a
                      href={r.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="h-8 md:h-8 lg:h-7 px-4 md:px-4 lg:px-3 rounded-full bg-[var(--primary)] text-white text-xs md:text-xs lg:text-[11px] inline-flex items-center justify-center hover:bg-blue-700 transition-colors"
                    >
                      {r.type === "Video" ? "Watch Video" : 
                       r.type === "Document" ? "Download" : 
                       r.type === "Link" ? "Open Link" : 
                       r.type === "Image" ? "View Image" : "Open"}
                    </a>
                  ) : (
                    <span className="text-gray-500 text-xs">No link available</span>
                  )}
                </td>
              </tr>
            ))}
            {rows.length === 0 && !loading && (
              <tr>
                <td colSpan={4} className="px-5 py-10 text-center">
                  <div className="flex flex-col items-center space-y-2">
                    <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center">
                      <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </div>
                    <p className="text-gray-500 text-sm">No learning resources found</p>
                    <p className="text-gray-400 text-xs">Resources will appear here when created by superadmin</p>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}