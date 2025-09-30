"use client";
import { Button } from "@/components/ui/button";

export default function TeacherMeetCard() {
  return (
    <div className="bg-white rounded-xl  p-5">
      <div className="text-[18px] font-bold text-[var(--neutral-1000)]">Meet</div>

      <div className="mt-6 h-24 rounded-md bg-[var(--neutral-100)] grid place-items-center text-[var(--neutral-400)] text-sm">
        No class schedule
      </div>

      <Button className="mt-6 w-full rounded-full" size="lg">
        Create Class
      </Button>
    </div>
  );
}
