"use client";

import { useState } from "react";
import Pagination from "@/components/ui/pagination";

interface Student {
  rank: number;
  id: string;
  name: string;
  email: string;
  profilePicture?: string;
  completionPercentage: number;
  totalAssignments: number;
  completedAssignments: number;
  averageGrade?: number;
  isCurrentUser?: boolean;
  // Legacy fields for compatibility
  badges: number;
  certificates: number;
  completion: number;
}

interface LeaderboardTableProps {
  students: Student[];
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  onSelectStudent?: (student: Student, index: number) => void;
}

export default function TeacherLeaderboardTable({ 
  students, 
  currentPage, 
  totalPages, 
  onPageChange,
  onSelectStudent,
}: LeaderboardTableProps) {
  const itemsPerPage = 12;
  const totalItems = students.length;
  const [selectedRowIndex, setSelectedRowIndex] = useState<number | null>(null);
  
  const handleRowClick = (index: number) => {
    // Always select the clicked row, clearing any previous selection
    setSelectedRowIndex(index);
    const student = students[index];
    if (onSelectStudent && student) {
      onSelectStudent(student, index);
    }
  };

  return (
    <div className="bg-white rounded-lg border-neutral-200 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[600px]">
          <colgroup>
            <col className="w-[12%] md:w-[15%]" />
            <col className="w-[28%] md:w-[35%]" />
            <col className="w-[15%] md:w-[15%]" />
            <col className="w-[15%] md:w-[15%]" />
            <col className="w-[20%] md:w-[20%]" />
          </colgroup>
          <thead>
            <tr className="bg-[#F1F5F6]">
              <th scope="col" className="px-3 md:px-6 py-4 md:py-6 text-left text-xs md:text-sm font-medium text-neutral-600 border-0 rounded-tl-lg capitalize">Rank</th>
              <th scope="col" className="px-3 md:px-6 py-4 md:py-6 text-left text-xs md:text-sm font-medium text-neutral-600 border-0 capitalize">Student Name</th>
              <th scope="col" className="px-3 md:px-6 py-4 md:py-6 text-left text-xs md:text-sm font-medium text-neutral-600 border-0 capitalize">Badges</th>
              <th scope="col" className="px-3 md:px-6 py-4 md:py-6 text-left text-xs md:text-sm font-medium text-neutral-600 border-0 capitalize">Certificates</th>
              <th scope="col" className="px-3 md:px-6 py-4 md:py-6 text-left text-xs md:text-sm font-medium text-neutral-600 border-0 rounded-tr-lg capitalize">Completion %</th>
            </tr>
          </thead>
          <tbody className="space-y-2">
            {students.map((student, index) => {
              const isSelected = selectedRowIndex === index;
              const isCurrentUser = student.isCurrentUser;
              
              return (
                <tr
                  key={`${student.rank}-${student.name}-${index}`}
                  onClick={() => handleRowClick(index)}
                  className={`hover:bg-muted/50 transition-colors cursor-pointer ${
                    isCurrentUser 
                      ? "text-white hover:opacity-90" 
                      : isSelected
                      ? "text-white hover:opacity-90"
                      : "bg-white my-1"
                  }`}
                  style={ 
                    isCurrentUser 
                      ? { backgroundColor: '#FF9A02' } 
                      : isSelected 
                      ? { backgroundColor: '#FF9A02' }
                      : {}
                  }
                >
                <td className={`py-3 md:py-4 px-3 md:px-6 text-xs md:text-sm ${
                  isCurrentUser 
                    ? "rounded-l-[4rem] text-white" 
                    : isSelected 
                    ? "rounded-l-[4rem] text-white" 
                    : "text-card-foreground"
                }`}>
                  <span className="font-medium">{student.rank}</span>
                </td>
                <td className={`py-3 md:py-4 px-3 md:px-6 text-xs md:text-sm font-medium ${
                  isCurrentUser 
                    ? "text-white" 
                    : isSelected 
                    ? "text-white" 
                    : "text-card-foreground"
                }`}>
                  <span className="truncate block">{student.name}</span>
                </td>
                <td className={`py-3 md:py-4 px-3 md:px-6 text-xs md:text-sm ${
                  isCurrentUser 
                    ? "text-white" 
                    : isSelected 
                    ? "text-white" 
                    : "text-card-foreground"
                }`}>
                  {student.badges}
                </td>
                <td className={`py-3 md:py-4 px-3 md:px-6 text-xs md:text-sm ${
                  isCurrentUser 
                    ? "text-white" 
                    : isSelected 
                    ? "text-white" 
                    : "text-card-foreground"
                }`}>
                  {student.certificates}
                </td>
                <td className={`py-3 md:py-4 px-3 md:px-6 text-xs md:text-sm ${
                  isCurrentUser 
                    ? "rounded-r-[4rem] text-white" 
                    : isSelected 
                    ? "rounded-r-[4rem] text-white" 
                    : "text-card-foreground"
                }`}>
                  {student.completion}%
                </td>
              </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        totalItems={totalItems}
        itemsPerPage={itemsPerPage}
        onPageChange={onPageChange}
      />
    </div>
  );
}
