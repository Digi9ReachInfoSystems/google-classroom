"use client";
import React, { useState } from "react";
import { Bell, Send } from "lucide-react";
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
    <div className="w-8 h-8 rounded-full border-2 border-neutral-200 flex items-center justify-center shrink-0 bg-white">
      <Bell className="w-4 h-4 text-primary fill-primary stroke-none" />
    </div>
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

/* student-style comment input (opens modal on click) */
function CommentInput() {
  return (
    <div className="relative">
      <input
        type="text"
        placeholder="Add comment..."
        readOnly
        className="w-full px-4 py-2 text-sm border border-neutral-200 rounded-full bg-neutral-100 placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary pr-10"
      />
      <button className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400" aria-label="Send comment" type="button">
        <Send className="w-4 h-4" />
      </button>
    </div>
  );
}

export default function AnnouncementsCard() {
  const [open, setOpen] = useState(false);

  const handlePost = (text: string, audience: string) => {
    console.log("POST announcement:", { audience, text });
  };

  return (
    <>
      <div className="bg-white rounded-xl p-5">
        <h3 className="text-[18px] font-bold text-[var(--neutral-1000)] mb-4">
          Announcements
        </h3>

        <div className="p-1 space-y-6 max-h-[30rem] overflow-y-auto custom-scrollbar pr-3">
          {demo.map((item) => (
            <div key={item.id} className="space-y-3">
              <div className="flex items-start space-x-3">
                <StatusBell />
                <p className="text-sm text-neutral-700 leading-relaxed flex-1 line-clamp-2">{item.text}</p>
              </div>

              <div className="ml-11">
                <CommentInput />
              </div>
            </div>
          ))}
        </div>

        <button onClick={() => setOpen(true)} className="mt-4 w-full rounded-full bg-[var(--primary)] hover:brightness-95 text-white py-3 text-sm">
          Create Announcement
        </button>
      </div>

      <CommentModal open={open} onClose={() => setOpen(false)} onPost={handlePost} />
    </>
  );
}
