"use client";

import { Card, CardContent } from "@/components/ui/card";
import BadgesSection from "./BadgesSection";

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
    <Card className="lg:col-span-1">
      <CardContent className="p-0">
        <div className="relative h-32 bg-gradient-to-r from-pink-300 via-purple-300 to-indigo-400 rounded-t-lg">
          <div className="absolute -bottom-8 left-6">
            <img
              src="/student/user.jpg"
              alt="Profile"
              className="w-35 h-35 rounded-full  object-cover"
            />
          </div>
          <div className="absolute top-8 right-18">
          <div className="flex items-center justify-center">
                <div className="text-7xl font-bold text-white">{rank}</div>
                <div className="text-3xl font-medium ml-1 -mt-1 mb-9 text-white">Rank</div>
              </div>
          </div>
        </div>
        
        <div className="pt-8 px-10 pb-6 ml-40">
          <div className="grid grid-cols-3 text-center">
            <div className="border-r border-gray-400 pr-4">
              <div className="text-2xl font-bold text-gray-900">{schoolRank}</div>
              <div className="text-sm text-gray-500 mt-1">School</div>
            </div>
            <div className="border-r border-gray-400 px-4">
              <div className="text-2xl font-bold text-gray-900">{districtRank}</div>
              <div className="text-sm text-gray-500 mt-1">District</div>
            </div>
            <div className="pl-4">
              <div className="text-2xl font-bold text-gray-900">{certificates}</div>
              <div className="text-sm text-gray-500 mt-1">Certificates</div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
