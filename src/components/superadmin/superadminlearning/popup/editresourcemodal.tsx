"use client";
import React, { useState, useEffect } from "react";

type ResourceType = "Video" | "Document" | "Link" | "Image" | "Other";

export default function EditResourceModal({
  open,
  onClose,
  onSubmit,
  resource,
}: {
  open: boolean;
  onClose: () => void;
  onSubmit: (details: string, type: string, link: string) => void;
  resource: { details: string; type: string; link: string } | null;
}) {
  const [details, setDetails] = useState("");
  const [type, setType] = useState<ResourceType>("Video");
  const [link, setLink] = useState("");

  useEffect(() => {
    if (resource) {
      setDetails(resource.details);
      setType(resource.type as ResourceType);
      setLink(resource.link);
    }
  }, [resource]);

  if (!open || !resource) return null;

  const handleSubmit = () => {
    if (details.trim()) {
      onSubmit(details.trim(), type, link.trim());
      onClose();
    }
  };

  return (
    <div
      className="fixed inset-0 z-50"
      role="dialog"
      aria-modal="true"
      aria-labelledby="edit-resource-title"
    >
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />

      <div className="absolute inset-0 grid place-items-center p-4">
        <div className="w-[min(900px,95vw)] rounded-2xl bg-white shadow-lg p-6 md:p-8 relative">
          <button
            onClick={onClose}
            className="absolute right-4 top-4 h-8 w-8 grid place-items-center rounded-full ring-1 ring-[var(--neutral-200)] hover:bg-[var(--neutral-50)]"
            aria-label="Close"
          >
            <span className="text-[var(--neutral-900)] text-lg leading-none">×</span>
          </button>

          <div className="mb-6">
            <h2 
              id="edit-resource-title"
              className="text-2xl font-bold text-[var(--neutral-900)] mb-2"
            >
              Edit Resource
            </h2>
            <p className="text-[var(--neutral-600)] text-sm">
              You can add new resource by submitting details here
            </p>
          </div>

          <div className="space-y-6">
            {/* Details Field - First Row */}
            <div>
              <label 
                htmlFor="edit-details"
                className="block text-sm font-medium text-[var(--neutral-900)] mb-2"
              >
                Details<span className="text-red-500">*</span>
              </label>
              <input
                id="edit-details"
                type="text"
                value={details}
                onChange={(e) => setDetails(e.target.value)}
                placeholder="Please enter details"
                className="w-full h-12 px-4 rounded-xl border border-[var(--neutral-200)] bg-white text-[var(--neutral-900)] placeholder-[var(--neutral-600)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent"
                required
              />
            </div>

            {/* Type and Link Fields - Same Row */}
            <div className="flex gap-4">
              {/* Type Field */}
              <div className="flex-1">
                <label 
                  htmlFor="edit-type"
                  className="block text-sm font-medium text-[var(--neutral-900)] mb-2"
                >
                  Type<span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <select
                    id="edit-type"
                    value={type}
                    onChange={(e) => setType(e.target.value as ResourceType)}
                    className="w-full h-12 px-4 rounded-xl border border-[var(--neutral-200)] bg-white text-[var(--neutral-900)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent appearance-none pr-10"
                    required
                  >
                    <option value="Video">Video</option>
                    <option value="Document">Document</option>
                    <option value="Link">Link</option>
                    <option value="Image">Image</option>
                    <option value="Other">Other</option>
                  </select>
                  <svg
                    className="absolute right-4 top-1/2 transform -translate-y-1/2 h-4 w-4 text-[var(--neutral-700)] pointer-events-none"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="m6 9 6 6 6-6" />
                  </svg>
                </div>
              </div>

              {/* Link Field */}
              <div className="flex-1">
                <label 
                  htmlFor="edit-link"
                  className="block text-sm font-medium text-[var(--neutral-900)] mb-2"
                >
                  Link
                </label>
                <input
                  id="edit-link"
                  type="url"
                  value={link}
                  onChange={(e) => setLink(e.target.value)}
                  placeholder="Please enter the link"
                  className="w-full h-12 px-4 rounded-xl border border-[var(--neutral-200)] bg-white text-[var(--neutral-900)] placeholder-[var(--neutral-600)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent"
                />
              </div>
            </div>
          </div>

          <div className="mt-8 flex justify-end gap-3">
            <button
              onClick={onClose}
              className="h-10 px-5 rounded-full ring-1 ring-[var(--neutral-200)] text-[var(--neutral-900)] bg-white hover:bg-[var(--neutral-50)] transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={!details.trim()}
              className="h-10 px-6 rounded-full bg-[var(--primary)] text-white hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              Submit
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

