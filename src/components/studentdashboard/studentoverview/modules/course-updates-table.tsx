"use client";
import { Badge } from "@/components/ui/badge";
import { useCourse } from "@/components/studentdashboard/context/CourseContext";
import { useState, useEffect } from "react";

interface CourseUpdate {
  module: string
  score: string
  dateOfSubmission: string
  status: "completed" | "pending"
}

export function CourseUpdatesTable() {
  const { selectedCourse } = useCourse();
  const [courseData, setCourseData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCourseData = async () => {
      if (!selectedCourse?.id) {
        setCourseData(null);
        return;
      }
      
      setLoading(true);
      setError(null);
      try {
        console.log('Fetching course data for:', selectedCourse.id);
        const res = await fetch(`/api/student/course-data?courseId=${selectedCourse.id}`);
        const data = await res.json();
        
        if (data.success) {
          setCourseData(data.data);
          console.log('Course data loaded:', data.data);
        } else {
          throw new Error(data.error || 'Failed to load course data');
        }
      } catch (err) {
        console.error('Failed to fetch course data:', err);
        setError(err instanceof Error ? err.message : 'Failed to load course data');
        setCourseData(null);
      } finally {
        setLoading(false);
      }
    };

    fetchCourseData();
  }, [selectedCourse?.id]);

  // Transform course work and submissions into course updates
  const courseUpdates: CourseUpdate[] = courseData ? 
    courseData.courseWork.map((work: any) => {
      const submission = courseData.submissions.find((sub: any) => sub.courseWorkId === work.id);
      const isCompleted = submission?.state === 'TURNED_IN' || submission?.state === 'RETURNED' || submission?.submitted;
      const score = submission?.assignedGrade ? 
        `${submission.assignedGrade}${work.maxPoints ? `/${work.maxPoints}` : ''}` : 
        (submission?.draftGrade ? `${submission.draftGrade}${work.maxPoints ? `/${work.maxPoints}` : ''} (Draft)` : 'N/A');
      const dateOfSubmission = submission?.updateTime ? 
        new Date(submission.updateTime).toLocaleDateString() : 
        (submission?.creationTime ? new Date(submission.creationTime).toLocaleDateString() : 'N/A');
      
      return {
        module: work.title || 'Untitled Assignment',
        score: score,
        dateOfSubmission: dateOfSubmission,
        status: isCompleted ? "completed" : "pending"
      };
    }) : [];

  if (loading) {
    return (
      <div className="bg-white rounded-lg border-neutral-200 p-6">
        <h2 className="text-lg font-semibold text-neutral-900 mb-4">Course updates</h2>
        <div className="flex items-center justify-center py-8">
          <div className="text-gray-500">Loading course data...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg border-neutral-200 p-6">
        <h2 className="text-lg font-semibold text-neutral-900 mb-4">Course updates</h2>
        <div className="p-4 bg-red-50 border border-red-200 rounded-md">
          <p className="text-red-700 text-sm">{error}</p>
        </div>
      </div>
    );
  }

  if (!selectedCourse) {
    return (
      <div className="bg-white rounded-lg border-neutral-200 p-6">
        <h2 className="text-lg font-semibold text-neutral-900 mb-4">Course updates</h2>
        <div className="flex items-center justify-center py-8">
          <div className="text-gray-500">Please select a course to view updates</div>
        </div>
      </div>
    );
  }

  if (courseUpdates.length === 0) {
    return (
      <div className="bg-white rounded-lg border-neutral-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-neutral-900">Course updates</h2>
          <div className="text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded">
            {selectedCourse.name}
          </div>
        </div>
        <div className="flex items-center justify-center py-8">
          <div className="text-gray-500">No course work found for {selectedCourse.name}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border-neutral-200">
      <div className="flex items-center justify-between p-6 border-neutral-200">
        <h2 className="text-lg font-semibold text-neutral-900">
          Course updates
        </h2>
        <div className="text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded">
          {selectedCourse.name}
        </div>
      </div>
      <div className="overflow-x-auto">
        {/* Header table (not scrollable) */}
        <table className="w-full table-fixed rounded-t-lg overflow-hidden border-collapse border-b border-neutral-200">
          <colgroup>
            <col className="w-[40%]" />
            <col className="w-[15%]" />
            <col className="w-[25%]" />
            <col className="w-[20%]" />
          </colgroup>
          <thead>
            <tr className="bg-[#F1F5F6]">
              <th scope="col" className="px-6 py-3 text-left text-sm font-medium text-neutral-600 border-0 rounded-tl-lg capitalize">Module/Quiz</th>
              <th scope="col" className="px-6 py-3 text-left text-sm font-medium text-neutral-600 border-0 capitalize">Score</th>
              <th scope="col" className="px-6 py-3 text-left text-sm font-medium text-neutral-600 border-0 capitalize">Date of Submission</th>
              <th scope="col" className="px-6 py-3 text-left text-sm font-medium text-neutral-600 border-0 rounded-tr-lg capitalize">Status</th>
            </tr>
          </thead>
        </table>

        {/* Scrollable body only (shows ~10 rows) */}
        <div className="max-h-[680px] overflow-y-auto rounded-b-lg custom-scrollbar">
          <table className="w-[100%] table-fixed">
            <colgroup>
              <col className="w-[40%]" />
              <col className="w-[15%]" />
              <col className="w-[25%]" />
              <col className="w-[20%]" />
            </colgroup>
            <tbody>
              {courseUpdates.map((item, index) => (
                <tr
                  key={index}
                  className={`bg-white hover:bg-muted/50 transition-colors`}
                >
                  <td className="py-3 px-6 text-sm text-card-foreground">{item.module}</td>
                  <td className="py-3 px-6 text-sm text-card-foreground tabular-nums">{item.score}</td>
                  <td className="py-3 px-6 text-sm text-card-foreground">{item.dateOfSubmission}</td>
                  <td className="py-3 px-6">
                    <Badge
                      variant={item.status === "completed" ? "default" : "secondary"}
                      className={
                        item.status === "completed"
                          ? "bg-[var(--success-500)] text-white border-transparent"
                          : "bg-[var(--neutral-200)] text-[var(--neutral-1000)] border-transparent"
                      }
                    >
                      {item.status === "completed" ? "Completed" : "Pending"}
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}