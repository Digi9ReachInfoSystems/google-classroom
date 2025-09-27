"use client";

import { Badge } from "@/components/ui/badge";
import { Lock } from "lucide-react";

export default function BadgesSection() {
  return (
    <div className="space-y-2 p-6  rounded-lg bg-white ">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-lg">Badges</h3>
        <Badge className="bg-orange-500 text-white text-xs px-2 py-1">
          3 Earned
        </Badge>
      </div>
      <div className="grid grid-cols-3 ">
        {/* Earned Badges */}
        {[...Array(3)].map((_, i) => (
          <div key={i} className="relative group">
            <img
              src="/student/badge-first.png"
              alt="Class First Badge"
              className="w-40 h-40 mx-auto transition-transform group-hover:scale-105"
            />
          </div>
        ))}
        {/* Locked Badges */}
        {[...Array(3)].map((_, i) => (
          <div key={`locked-${i}`} className="w-30 h-30 mx-auto bg-gray-100 rounded-full flex items-center justify-center opacity-60 border-2 border-gray-200 ">
            <Lock className="w-6 h-6 text-gray-400" />
          </div>
        ))}
      </div>
    </div>
  );
}
