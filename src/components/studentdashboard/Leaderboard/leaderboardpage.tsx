"use client";

import { useState } from "react";
import UserProfile from "./modules/UserProfile";
import BadgesSection from "./modules/BadgesSection";
import LeaderboardTable from "./modules/LeaderboardTable";

interface Student {
  rank: number;
  name: string;
  badges: number;
  certificates: number;
  completion: number;
  isCurrentUser?: boolean;
}

const leaderboardData: Student[] = [
  { rank: 1, name: "Alex Johnson", badges: 15, certificates: 4, completion: 98 },
  { rank: 2, name: "Sarah Chen", badges: 14, certificates: 3, completion: 97 },
  { rank: 3, name: "Michael Brown", badges: 13, certificates: 3, completion: 96 },
  { rank: 4, name: "Emma Wilson", badges: 12, certificates: 3, completion: 95 },
  { rank: 5, name: "Sneha M", badges: 12, certificates: 3, completion: 96, isCurrentUser: true },
  { rank: 6, name: "David Lee", badges: 11, certificates: 2, completion: 94 },
  { rank: 7, name: "Lisa Garcia", badges: 10, certificates: 2, completion: 93 },
  { rank: 8, name: "James Taylor", badges: 9, certificates: 2, completion: 92 },
  { rank: 9, name: "Anna Martinez", badges: 8, certificates: 1, completion: 91 },
  { rank: 10, name: "Chris Anderson", badges: 7, certificates: 1, completion: 90 },
  
];

export default function Leaderboardpage() {
  const [currentPage, setCurrentPage] = useState(1);
  const currentUser = leaderboardData.find(student => student.isCurrentUser);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Leaderboard</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Left Panel - User Profile and Badges */}
        <div className="lg:col-span-2 space-y-6">
          <UserProfile 
            rank={currentUser?.rank || 5}
            schoolRank={18}
            districtRank={120}
            certificates={2}
          />
          <BadgesSection />
        </div>

        {/* Right Panel - Leaderboard Table (60% width) */}
        <div className="lg:col-span-3">
          <LeaderboardTable 
            students={leaderboardData}
            currentPage={currentPage}
            totalPages={3}
            onPageChange={handlePageChange}
          />
        </div>
      </div>
    </div>
  );
}
