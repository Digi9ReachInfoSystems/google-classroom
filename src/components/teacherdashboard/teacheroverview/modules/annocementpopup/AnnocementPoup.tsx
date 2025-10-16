"use client";
import Image from "next/image";
import React, { useState } from "react";
import { useTeacherCourse } from "../../../context/TeacherCourseContext";

type Audience = "All Students";

export default function AnnouncementModal({
  open,
  onClose,
  onPost,
}: {
  open: boolean;
  onClose: () => void;
  onPost: (text: string, audience: string) => void;
}) {
  const { selectedCourse } = useTeacherCourse();
  const [text, setText] = useState("");
  const [audience, setAudience] = useState<Audience>("All Students");

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50"
      role="dialog"
      aria-modal="true"
      aria-labelledby="announce-title"
    >
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />

      <div className="absolute inset-0 grid place-items-center p-4">
        <div className="w-[min(1040px,95vw)] rounded-2xl bg-white shadow-lg p-6 md:p-8 relative">
          <button
            onClick={onClose}
            className="absolute right-4 top-4 h-8 w-8 grid place-items-center rounded-full ring-1 ring-[var(--neutral-200)] hover:bg-[var(--neutral-50)]"
            aria-label="Close"
          >
            <span className="text-[var(--neutral-900)] text-lg leading-none">×</span>
          </button>

          <div className="mb-4">
            {selectedCourse ? (
              <div className="inline-flex items-center gap-2 rounded-full ring-1 ring-blue-200 bg-blue-50 h-10 px-4">
                <span className="text-sm font-medium text-blue-900">
                  Posting to: {selectedCourse.name}
                  {selectedCourse.section && ` (${selectedCourse.section})`}
                </span>
              </div>
            ) : (
              <div className="inline-flex items-center gap-2 rounded-full ring-1 ring-red-200 bg-red-50 h-10 px-4">
                <span className="text-sm font-medium text-red-900">
                  No course selected
                </span>
              </div>
            )}
          </div>

          <div className=" bg-white ">
            <textarea
              autoFocus
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Announce something to your class"
              className="w-full min-h-[260px] resize-none bg-neutral-50 outline-none p-6 text-[14px] text-[var(--neutral-1000)] placeholder-[var(--neutral-600)] rounded-xl"
            />
            <div className="h-px w-full bg-[var(--neutral-200)]" />
          </div>

          <div className="mt-6 flex justify-end gap-3">
            <button
              onClick={onClose}
              className="h-10 px-5 rounded-full ring-1 ring-[var(--neutral-200)] text-[var(--neutral-900)] bg-white hover:bg-[var(--neutral-50)]"
            >
              Cancel
            </button>
            <button
              onClick={() => {
                onPost(text.trim(), audience);
                setText("");
                onClose();
              }}
              disabled={!text.trim() || !selectedCourse}
              className="h-10 px-6 rounded-full bg-[var(--primary)] text-white hover:brightness-95 disabled:opacity-50"
            >
              Post
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}


