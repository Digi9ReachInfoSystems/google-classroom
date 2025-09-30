"use client";
import Image from "next/image";
import React, { useState } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

/* ========================= helpers ========================= */
function StatusBell() {
  return (
    <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full ring-1 ring-[var(--neutral-300)] bg-white">
      <Image src="/notification.png" alt="Notification" width={24} height={24} className="h-6 w-6" />
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
  const [audience, setAudience] = useState<"All Students" | "Class A" | "Class B">("All Students");

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50" role="dialog" aria-modal="true" aria-labelledby="announce-title">
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

          {/* audience pill (shadcn Select) */}
          <div className="mb-4">
            <Select value={audience} onValueChange={(v) => setAudience(v as any)}>
              <SelectTrigger
                className="
                  h-10 w-[240px] rounded-full bg-white
                  ring-1 ring-[var(--neutral-300)]
                  px-4 text-sm
                  data-[state=open]:ring-2 data-[state=open]:ring-[var(--primary)]
                  focus:outline-none
                "
              >
                <SelectValue placeholder="Select audience" />
              </SelectTrigger>

              {/* add custom scrollbar to dropdown content */}
              <SelectContent
                className="
                  rounded-xl overflow-auto bg-white z-[60]
                  ring-1 ring-[var(--neutral-300)]
                  custom-scrollbar
                "
              >
                {["All Students", "Class A", "Class B"].map((opt) => (
                  <SelectItem
                    key={opt}
                    value={opt}
                    className="
                      text-sm
                      data-[highlighted]:bg-[var(--primary)]
                      data-[highlighted]:text-white
                      focus:bg-[var(--primary)] focus:text-white
                    "
                  >
                    {opt}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* editor area */}
          <div className="bg-white">
            <textarea
              autoFocus
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Announce something to your class"
              className="w-full min-h-[260px] resize-none bg-transparent outline-none p-6 text-[14px] text-[var(--foreground)] placeholder-[var(--neutral-600)]"
            />
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
                const t = text.trim();
                if (!t) return;
                onPost(t, audience);
                setText("");
                onClose();
              }}
              disabled={!text.trim()}
              className="h-10 px-6 rounded-full bg-[var(--primary)] text-white  disabled:opacity-50"
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

const demo: Item[] = Array.from({ length: 12 }).map((_, i) => ({
  id: i + 1,
  text:
    "Lorem ipsum dolor sit amet consectetur. Voluptate purus amet tincidunt nibh mauris interdum imperdiet elit in.",
}));

/* Inline comment box (no modal) */
function CommentInput({ onSubmit }: { onSubmit: (text: string) => void }) {
  const [val, setVal] = useState("");

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        const t = val.trim();
        if (!t) return;
        onSubmit(t);
        setVal("");
      }}
      className="relative w-full h-8"
    >
      <input
        value={val}
        onChange={(e) => setVal(e.target.value)}
        placeholder="Add comment…"
        className="w-full h-8 rounded-full bg-white border border-[var(--neutral-300)]
                   pl-3 pr-10 text-[12px] text-[var(--neutral-900)] placeholder-[var(--neutral-600)]
                   outline-none hover:bg-[var(--neutral-100)]"
      />
      <button
        type="submit"
        className="absolute right-1 top-1/2 -translate-y-1/2 h-6 w-8 grid place-items-center bg-[var(--neutral-100)] rounded-full"
        aria-label="Send comment"
      >
        <Image src="/send.png" alt="" width={14} height={14} className="h-3.5 w-3.5" />
      </button>
    </form>
  );
}

export default function AnnouncementsCard() {
  const [open, setOpen] = useState(false);

  const handlePost = (text: string, audience: string) => {
    console.log("POST announcement:", { audience, text });
  };

  const handleInlineComment = (cardId: number, text: string) => {
    console.log("ADD comment:", { cardId, text });
  };

  return (
    <>
      <div className="bg-white rounded-xl p-5">
        <h3 className="text-[14px] font-medium text-[var(--neutral-1000)] mb-4">
          Announcements
        </h3>

        {/* apply custom-scrollbar here */}
        <div className="space-y-3 max-h-[420px] overflow-y-auto pr-1 custom-scrollbar">
          {demo.map((item) => (
            <div key={item.id} className="rounded-lg bg-[var(--neutral-100)] p-3">
              <div className="flex items-start gap-3">
                <StatusBell />
                <p className="text-[12px] leading-5 text-[var(--foreground)]">
                  {item.text}
                </p>
              </div>

              <div className="mt-3">
                <CommentInput onSubmit={(text) => handleInlineComment(item.id, text)} />
              </div>
            </div>
          ))}
        </div>

        {/* Open MODAL only from this button */}
        <button
          onClick={() => setOpen(true)}
          className="mt-4 w-full rounded-full bg-[var(--primary)] text-white py-3 text-sm"
        >
          Post Announcement
        </button>
      </div>

      <CommentModal open={open} onClose={() => setOpen(false)} onPost={handlePost} />
    </>
  );
}
