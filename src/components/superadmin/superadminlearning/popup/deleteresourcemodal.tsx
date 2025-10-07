"use client";
import React from "react";

export default function DeleteResourceModal({
  open,
  onClose,
  onConfirm,
}: {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
}) {
  if (!open) return null;

  const handleConfirm = () => {
    onConfirm();
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50"
      role="dialog"
      aria-modal="true"
      aria-labelledby="delete-resource-title"
    >
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />

      <div className="absolute inset-0 grid place-items-center p-4">
        <div className="w-[min(600px,95vw)] rounded-2xl bg-white shadow-lg p-6 md:p-8 relative">
          <button
            onClick={onClose}
            className="absolute right-4 top-4 h-8 w-8 grid place-items-center rounded-full ring-1 ring-[var(--neutral-200)] hover:bg-[var(--neutral-50)]"
            aria-label="Close"
          >
            <span className="text-[var(--neutral-900)] text-lg leading-none">×</span>
          </button>

          <div className="mb-6 text-center">
            <h2 
              id="delete-resource-title"
              className="text-2xl font-bold text-[var(--neutral-900)] mb-3"
            >
              Delete Resource
            </h2>
            <p className="text-[var(--neutral-600)] text-sm">
              Are you sure you want to delete this resource file. This action cannot be undone.
            </p>
          </div>

          <div className="mt-8 flex justify-center gap-3">
            <button
              onClick={onClose}
              className="h-10 px-6 rounded-full ring-1 ring-[var(--neutral-200)] text-[var(--neutral-900)] bg-white hover:bg-[var(--neutral-50)] transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleConfirm}
              className="h-10 px-6 rounded-full bg-[var(--primary)] text-white hover:opacity-90 transition-all"
            >
              Delete resource
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

