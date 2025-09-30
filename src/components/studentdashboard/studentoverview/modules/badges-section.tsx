"use client";

import { Badge } from "@/components/ui/badge";
import { Lock } from "lucide-react";
import Image from "next/image";

export function BadgesSection() {
  return (
    <div className="space-y-1 p-2 md:p-3 rounded-lg bg-white">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-base md:text-lg">Badges</h3>
        <Badge className="bg-orange-500 text-white text-xs px-2 py-1">
          3 Earned
        </Badge>
      </div>
      <div className="grid grid-cols-4  md:gap-2">
        {/* Earned Badges */}
        {[...Array(3)].map((_, i) => (
          <div key={i} className="relative group">
            <Image
              src="/student/badge-first.png"
              width={100}
              height={100}
              alt="Class First Badge"
              className="w-20 h-20 md:w-24 md:h-24 mx-auto transition-transform group-hover:scale-105"
         
            />
          </div>
        ))}
        {/* Locked Badges */}
        {[...Array(9)].map((_, i) => (
            <div key={`locked-${i}`} className="w-20 h-20 md:w-24 md:h-24 mx-auto bg-gray-100 rounded-full flex items-center justify-center opacity-60 border-2 border-gray-200">
            <Lock className="w-5 h-5 md:w-6 md:h-6 text-gray-400" />
          </div>
        ))}
      </div>
    </div>
  );
}
