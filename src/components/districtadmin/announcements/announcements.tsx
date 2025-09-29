"use client";
import React, { useState } from "react";

/* ========================= helpers ========================= */
function StatusBell() {
  return (
    <span
      className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full
                 ring-1 ring-[var(--neutral-300)] bg-white"
    >
      <img src="/notification.png" alt="Notification" className="h-6 w-6" />
    </span>
  );
}

/* ========================= modal ========================= */
function CommentModal({
  open,
  onClose,
  onPost,
}: {
  open: boolean;
  onClose: () => void;
  onPost: (text: string, audience: string) => void;
}) {
  const [text, setText] = useState("");
  const [audience, setAudience] = useState<"All Students" | "Class A" | "Class B">(
    "All Students"
  );

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50"
      role="dialog"
      aria-modal="true"
      aria-labelledby="announce-title"
    >
      {/* backdrop */}
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />

      {/* panel */}
      <div className="absolute inset-0 grid place-items-center p-4">
        <div className="w-[min(1040px,95vw)] rounded-2xl bg-white shadow-xl p-6 md:p-8 relative">
          {/* close button */}
          <button
            onClick={onClose}
            className="absolute right-4 top-4 h-8 w-8 grid place-items-center rounded-full ring-1 ring-[var(--neutral-300)] hover:bg-[var(--neutral-100)]"
            aria-label="Close"
          >
            <span className="text-[var(--neutral-900)] text-lg leading-none">×</span>
          </button>

          {/* audience pill */}
          <div className="mb-4">
            <div className="inline-flex items-center gap-2 rounded-full ring-1 ring-[var(--neutral-300)] bg-white h-10 pl-4 pr-3">
              <select
                value={audience}
                onChange={(e) => setAudience(e.target.value as any)}
                className="appearance-none bg-transparent outline-none text-sm text-[var(--neutral-900)] pr-6"
              >
                <option>All Students</option>
                <option>Class A</option>
                <option>Class B</option>
              </select>
              <svg
                className="h-4 w-4 text-[var(--neutral-700)] -ml-5 pointer-events-none"
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

          {/* editor area */}
          <div
            className=" bg-white "
          >
            <textarea
              autoFocus
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Announce something to your class"
              className="w-full min-h-[260px] resize-none bg-transparent outline-none p-6 text-[14px] text-[var(--neutral-1000)] placeholder-[var(--neutral-600)]"
            />
            {/* bottom border like the mock */}
            <div className="h-px w-full bg-[var(--neutral-300)]" />
          </div>

          {/* footer actions */}
          <div className="mt-6 flex justify-end gap-3">
            <button
              onClick={onClose}
              className="h-10 px-5 rounded-full ring-1 ring-[var(--neutral-300)] text-[var(--neutral-900)] bg-white hover:bg-[var(--neutral-100)]"
            >
              Cancel
            </button>
            <button
              onClick={() => {
                onPost(text.trim(), audience);
                setText("");
                onClose();
              }}
              disabled={!text.trim()}
              className="h-10 px-6 rounded-full bg-[var(--warning-400)] text-white  disabled:opacity-50"
            >
              Post
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ========================= list card ========================= */
type Item = { id: number; text: string };

const demo: Item[] = Array.from({ length: 5 }).map((_, i) => ({
  id: i + 1,
  text:
    "Lorem ipsum dolor sit amet consectetur. Voluptate purus amet tincidunt nibh mauris interdum imperdiet elit in.",
}));

/* input that triggers the modal */
function CommentInput({ onOpen }: { onOpen: () => void }) {
  return (
    <button
      type="button"
      onClick={onOpen}
      className="relative w-full h-8 rounded-full bg-white border border-[var(--neutral-300)]
                 pl-3 pr-10 text-left text-[12px] text-[var(--neutral-600)] hover:bg-[var(--neutral-100)]"
    >
      Add comment…
      <span className="absolute right-1 top-1/2 -translate-y-1/2 h-6 w-8 grid place-items-center bg-[var(--neutral-100)] rounded-full">
        <img src="/send.png" alt="" className="h-3.5 w-3.5" />
      </span>
    </button>
  );
}

export default function AnnouncementsCard() {
  const [open, setOpen] = useState(false);

  const handlePost = (text: string, audience: string) => {
    // TODO: hook up to your API
    console.log("POST announcement:", { audience, text });
  };

  return (
    <>
      <div className="bg-white rounded-xl p-5">
        <h3 className="text-[14px] font-medium text-[var(--neutral-1000)] mb-4">
          Announcements
        </h3>

        <div className="space-y-3 max-h-[420px] overflow-y-auto pr-1 scroll-thin">
          {demo.map((item) => (
            <div key={item.id} className="rounded-lg bg-[var(--neutral-100)] p-3">
              <div className="flex items-start gap-3">
                <StatusBell />
                <p className="text-[12px] leading-5 text-[var(--neutral-900)]">
                  {item.text}
                </p>
              </div>

              <div className="mt-3">
                <CommentInput onOpen={() => setOpen(true)} />
              </div>
            </div>
          ))}
        </div>

        <button className="mt-4 w-full rounded-full bg-[var(--warning-400)] hover:bg-[var(--warning-500)] text-white py-3 text-sm">
          Post Announcement
        </button>
      </div>

      {/* the modal */}
      <CommentModal
        open={open}
        onClose={() => setOpen(false)}
        onPost={handlePost}
      />
    </>
  );
}
