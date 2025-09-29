"use client";

import { Card, CardContent } from "@/components/ui/card";
import BadgesSection from "./BadgesSection";
import Image from "next/image";

interface UserProfileProps {
  rank: number;
  schoolRank: number;
  districtRank: number;
  certificates: number;
}

export default function UserProfile({ 
  rank, 
  schoolRank, 
  districtRank, 
  certificates 
}: UserProfileProps) {
  return (
    <Card className="w-full">
      <CardContent className="p-0">
        <div className="relative h-24 md:h-32 bg-gradient-to-r from-pink-300 via-purple-300 to-indigo-400 rounded-t-lg">
          <div className="absolute -bottom-6 md:-bottom-8 left-4 md:left-6">
            <Image
              src="/student/user.jpg"
              alt="Profile"
              className="w-24 h-24 md:w-35 md:h-35 rounded-full object-cover"
              width={96}
              height={96}
            />
          </div>
          <div className="absolute top-4 md:top-8 right-4 md:right-18">
            <div className="flex items-center justify-center">
              <div className="text-4xl md:text-7xl font-bold text-white">{rank}</div>
              <div className="text-lg md:text-3xl font-medium ml-1 -mt-1 mb-6 md:mb-9 text-white">Rank</div>
            </div>
          </div>
        </div>
        
        <div className="pt-6 md:pt-8 px-4 md:px-10 pb-4 md:pb-6 ml-28 md:ml-40">
          <div className="grid grid-cols-3 text-center gap-2 md:gap-0">
            <div className="border-r border-gray-400 pr-2 md:pr-4">
              <div className="text-lg md:text-2xl font-bold text-gray-900">{schoolRank}</div>
              <div className="text-xs md:text-sm text-gray-500 mt-1">School</div>
            </div>
            <div className="border-r border-gray-400 px-2 md:px-4">
              <div className="text-lg md:text-2xl font-bold text-gray-900">{districtRank}</div>
              <div className="text-xs md:text-sm text-gray-500 mt-1">District</div>
            </div>
            <div className="pl-2 md:pl-4">
              <div className="text-lg md:text-2xl font-bold text-gray-900">{certificates}</div>
              <div className="text-xs md:text-sm text-gray-500 mt-1">Certificates</div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
