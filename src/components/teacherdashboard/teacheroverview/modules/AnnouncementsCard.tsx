"use client";
import React, { useState } from "react";
import { Bell, Send } from "lucide-react";
import AnnouncementModal from "./annocementpopup/AnnocementPoup";

/* ========================= helpers ========================= */
function StatusBell() {
  return (
    <div className="w-8 h-8 rounded-full border-2 border-neutral-200 flex items-center justify-center flex-shrink-0">
      <Bell className="w-4 h-4 text-primary fill-primary stroke-none" />
    </div>
  );
}

/* modal now imported from ./annocementpopup/AnnocementPoup */

/* ========================= list card ========================= */
type Item = { id: number; text: string };

const demo: Item[] = Array.from({ length: 5 }).map((_, i) => ({
  id: i + 1,
  text:
    "Lorem ipsum dolor sit amet consectetur. Voluptate purus amet tincidunt nibh mauris interdum imperdiet elit in.",
}));

/* student-style comment input (opens modal on click) */
function CommentInput({ onOpen }: { onOpen: () => void }) {
  return (
    <div className="relative" onClick={onOpen}>
      <input
        type="text"
        placeholder="Add comment..."
        readOnly
        className="w-full px-4 py-2 text-sm border border-neutral-200 rounded-full bg-neutral-100 placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary pr-10"
      />
      <button className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-primary transition-colors" aria-label="Send comment">
        <Send className="w-4 h-4" />
      </button>
    </div>
  );
}

export default function TeacherAnnouncementsCard() {
  const [open, setOpen] = useState(false);

  const handlePost = (text: string, audience: string) => {
    // TODO: hook up to your API
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
                <CommentInput onOpen={() => setOpen(true)} />
              </div>
            </div>
          ))}
        </div>

        <button onClick={() => setOpen(true)} className="mt-4 w-full rounded-full bg-[var(--primary)] hover:brightness-95 text-white py-3 text-sm">
          Create Announcement
        </button>
      </div>

      {/* the modal */}
      <AnnouncementModal
        open={open}
        onClose={() => setOpen(false)}
        onPost={handlePost}
      />
    </>
  );
}
