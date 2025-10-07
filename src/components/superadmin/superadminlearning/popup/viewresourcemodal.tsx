"use client";
import React from "react";

export default function ViewResourceModal({
  open,
  onClose,
  resource,
}: {
  open: boolean;
  onClose: () => void;
  resource: { details: string; type: string; link: string } | null;
}) {
  if (!open || !resource) return null;

  return (
    <div
      className="fixed inset-0 z-50"
      role="dialog"
      aria-modal="true"
      aria-labelledby="view-resource-title"
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
              id="view-resource-title"
              className="text-2xl font-bold text-[var(--neutral-900)] mb-2"
            >
              View Resource
            </h2>
            <p className="text-[var(--neutral-600)] text-sm">
              You can view add resource details here
            </p>
          </div>

          <div className="space-y-6">
            {/* Details Field - First Row */}
            <div>
              <label 
                htmlFor="view-details"
                className="block text-sm font-medium text-[var(--neutral-900)] mb-2"
              >
                Details<span className="text-red-500">*</span>
              </label>
              <input
                id="view-details"
                type="text"
                value={resource.details}
                readOnly
                className="w-full h-12 px-4 rounded-xl border border-[var(--neutral-200)] bg-[var(--neutral-50)] text-[var(--neutral-900)] cursor-not-allowed"
              />
            </div>

            {/* Type and Link Fields - Same Row */}
            <div className="flex gap-4">
              {/* Type Field */}
              <div className="flex-1">
                <label 
                  htmlFor="view-type"
                  className="block text-sm font-medium text-[var(--neutral-900)] mb-2"
                >
                  Type<span className="text-red-500">*</span>
                </label>
                <input
                  id="view-type"
                  type="text"
                  value={resource.type}
                  readOnly
                  className="w-full h-12 px-4 rounded-xl border border-[var(--neutral-200)] bg-[var(--neutral-50)] text-[var(--neutral-900)] cursor-not-allowed"
                />
              </div>

              {/* Link Field */}
              <div className="flex-1">
                <label 
                  htmlFor="view-link"
                  className="block text-sm font-medium text-[var(--neutral-900)] mb-2"
                >
                  Link
                </label>
                <input
                  id="view-link"
                  type="text"
                  value={resource.link}
                  readOnly
                  className="w-full h-12 px-4 rounded-xl border border-[var(--neutral-200)] bg-[var(--neutral-50)] text-[var(--neutral-900)] cursor-not-allowed"
                />
              </div>
            </div>
          </div>

          <div className="mt-8 flex justify-end">
            <button
              onClick={onClose}
              className="h-10 px-6 rounded-full ring-1 ring-[var(--neutral-200)] text-[var(--neutral-900)] bg-white hover:bg-[var(--neutral-50)] transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

