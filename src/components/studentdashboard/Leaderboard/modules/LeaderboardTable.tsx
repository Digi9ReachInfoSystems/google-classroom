"use client";

import Pagination from "@/components/ui/pagination";

interface Student {
  rank: number;
  name: string;
  badges: number;
  certificates: number;
  completion: number;
  isCurrentUser?: boolean;
}

interface LeaderboardTableProps {
  students: Student[];
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export default function LeaderboardTable({ 
  students, 
  currentPage, 
  totalPages, 
  onPageChange 
}: LeaderboardTableProps) {
  const itemsPerPage = 12;
  const totalItems = students.length;
  
  // Force refresh - current user highlighting

  return (
    <div className="bg-white rounded-lg  border-neutral-200 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <colgroup>
            <col className="w-[15%]" />
            <col className="w-[35%]" />
            <col className="w-[15%]" />
            <col className="w-[15%]" />
            <col className="w-[20%]" />
          </colgroup>
          <thead>
            <tr className="bg-[#F1F5F6]">
              <th scope="col" className="px-6 py-6 text-left text-sm font-medium text-neutral-600 border-0 rounded-tl-lg capitalize">Rank</th>
              <th scope="col" className="px-6 py-6 text-left text-sm font-medium text-neutral-600 border-0 capitalize">Student Name</th>
              <th scope="col" className="px-6 py-6 text-left text-sm font-medium text-neutral-600 border-0 capitalize">Badges</th>
              <th scope="col" className="px-6 py-6 text-left text-sm font-medium text-neutral-600 border-0 capitalize">Certificates</th>
              <th scope="col" className="px-6 py-6 text-left text-sm font-medium text-neutral-600 border-0 rounded-tr-lg capitalize">Completion %</th>
            </tr>
          </thead>
          <tbody>
            {students.map((student, index) => (
              <tr
                key={`${student.rank}-${student.name}-${index}`}
                className={`hover:bg-muted/50 transition-colors ${
                  student.isCurrentUser 
                    ? "text-white hover:opacity-90 rounded-lg shadow-lg" 
                    : "bg-white"
                }`}
                style={ student.isCurrentUser ? { backgroundColor: '#FF9A02' } : {}}
              >
                <td className={`py-4 px-6 text-sm ${student.isCurrentUser ? "rounded-l-lg text-white" : "text-card-foreground"}`}>
                  <span className="font-medium">{student.rank}</span>
                </td>
                <td className={`py-4 px-6 text-sm font-medium ${student.isCurrentUser ? "text-white" : "text-card-foreground"}`}>
                  {student.name}
                </td>
                <td className={`py-4 px-6 text-sm ${student.isCurrentUser ? "text-white" : "text-card-foreground"}`}>
                  {student.badges}
                </td>
                <td className={`py-4 px-6 text-sm ${student.isCurrentUser ? "text-white" : "text-card-foreground"}`}>
                  {student.certificates}
                </td>
                <td className={`py-4 px-6 text-sm ${student.isCurrentUser ? "text-white rounded-r-lg" : "text-card-foreground"}`}>
                  {student.completion}%
                </td>
              </tr>
            ))}
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
