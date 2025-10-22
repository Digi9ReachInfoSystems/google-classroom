"use client";

import { useMemo, useState, useEffect } from "react";
import UserProfile from "./modules/UserProfile";
import BadgesSection from "./modules/BadgesSection";
import LeaderboardTable from "./modules/LeaderboardTable";
import { useCourse } from "@/components/studentdashboard/context/CourseContext";

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

export default function Leaderboardpage() {
  const { selectedCourse } = useCourse();
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedStudentIndex, setSelectedStudentIndex] = useState<number | null>(null);
  const [leaderboardData, setLeaderboardData] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const currentUser = leaderboardData.find(student => student.isCurrentUser);

  const selectedStudent = useMemo(() => {
    if (selectedStudentIndex === null) return null;
    return leaderboardData[selectedStudentIndex] ?? null;
  }, [selectedStudentIndex]);

  // Fetch leaderboard data when course changes
  useEffect(() => {
    const fetchLeaderboardData = async () => {
      if (!selectedCourse) {
        setLeaderboardData([]);
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const res = await fetch(`/api/student/leaderboard?courseId=${selectedCourse.id}`);
        const data = await res.json();

        if (data.success && data.students) {
          console.log('Received leaderboard data:', data.students.length, 'students');
          console.log('Student names:', data.students.map((s: any) => ({ name: s.name, email: s.email, isCurrentUser: s.isCurrentUser })));
          
          // Transform data with actual badge and certificate counts
          const transformedStudents = data.students.map((student: any) => ({
            ...student,
            badges: student.badges || 0,
            certificates: student.certificates || 0,
            completion: student.completionPercentage
          }));
          setLeaderboardData(transformedStudents);
        } else {
          setError(data.error || 'Failed to fetch leaderboard data');
          setLeaderboardData([]);
        }
      } catch (err) {
        console.error('Error fetching leaderboard data:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch leaderboard data');
        setLeaderboardData([]);
      } finally {
        setLoading(false);
      }
    };

    fetchLeaderboardData();
  }, [selectedCourse]);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  if (loading) {
    return (
      <div className="p-4 md:p-6 space-y-4 md:space-y-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-foreground">Leaderboard</h1>
        </div>
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          <span className="ml-2 text-gray-600">Loading leaderboard...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 md:p-6 space-y-4 md:space-y-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-foreground">Leaderboard</h1>
        </div>
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-600">Error: {error}</p>
        </div>
      </div>
    );
  }

  if (!selectedCourse) {
    return (
      <div className="p-4 md:p-6 space-y-4 md:space-y-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-foreground">Leaderboard</h1>
        </div>
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <p className="text-yellow-600">Please select a course to view the leaderboard.</p>
        </div>
      </div>
    );
  }

  const totalPages = Math.ceil(leaderboardData.length / 12);

  return (
    <div className="p-4 md:p-6 space-y-4 md:space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-foreground">Leaderboard</h1>
        {selectedCourse && (
          <p className="text-sm text-gray-600 mt-1">
            {selectedCourse.name} • {leaderboardData.length} students
          </p>
        )}
      </div>

      <div className="flex flex-col space-y-4 md:space-y-6">
        {/* Mobile: Stack vertically, Desktop: Side by side */}
        <div className="flex flex-col lg:grid lg:grid-cols-5 gap-4 md:gap-6">
          {/* Left Panel - User Profile and Badges */}
          <div className="lg:col-span-2 space-y-4 md:space-y-6 order-2 lg:order-1">
            <UserProfile 
              rank={selectedStudent?.rank ?? currentUser?.rank ?? 5}
              schoolRank={0}
              districtRank={0}
              certificates={selectedStudent?.certificates ?? currentUser?.certificates ?? 0}
            />
            <BadgesSection />
          </div>

          {/* Right Panel - Leaderboard Table */}
          <div className="lg:col-span-3 order-1 lg:order-2">
            <LeaderboardTable 
              students={leaderboardData}
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={handlePageChange}
              onSelectStudent={(student, index) => setSelectedStudentIndex(index)}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
