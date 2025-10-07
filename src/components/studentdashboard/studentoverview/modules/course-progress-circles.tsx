"use client";
import { useState, useEffect } from "react";
import { useCourse } from "@/components/studentdashboard/context/CourseContext";
import { ProgressCircle } from "./progress-circle";

interface CourseWorkItem {
  id: string;
  title: string;
  state: string;
  workType: string;
  dueDate?: {
    year: number;
    month: number;
    day: number;
  };
}

interface SubmissionItem {
  id: string;
  courseWorkId: string;
  state: string;
  assignedGrade?: number | null;
  submitted: boolean;
  late: boolean;
}

interface ProgressData {
  preSurvey: "completed" | "due" | "pending";
  courseProgress: "completed" | "due" | "pending";
  ideas: "completed" | "due" | "pending";
  postSurvey: "completed" | "due" | "pending";
  courseProgressPercentage: number;
  totalAssignments: number;
  completedAssignments: number;
}

export function CourseProgressCircles() {
  const { selectedCourse } = useCourse();
  const [progressData, setProgressData] = useState<ProgressData>({
    preSurvey: "due",
    courseProgress: "pending",
    ideas: "due",
    postSurvey: "due",
    courseProgressPercentage: 0,
    totalAssignments: 0,
    completedAssignments: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCourseProgress = async () => {
      if (!selectedCourse) {
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        // Fetch course data including coursework and submissions
        const res = await fetch(`/api/student/course-data?courseId=${selectedCourse.id}`);
        const data = await res.json();

        if (data.success && data.data) {
          const { courseWork, submissions } = data.data;
          
          
          // Ensure courseWork is an array
          const safeCourseWork = Array.isArray(courseWork) ? courseWork : [];
          const safeSubmissions = Array.isArray(submissions) ? submissions : [];
          
          // Calculate course progress based on assignments
          const assignments = safeCourseWork.filter((cw: CourseWorkItem) => 
            cw && cw.workType === 'ASSIGNMENT' && cw.state === 'PUBLISHED'
          );
          
          const completedAssignments = assignments.filter((assignment: CourseWorkItem) => {
            const submission = safeSubmissions.find((sub: SubmissionItem) => 
              sub.courseWorkId === assignment.id
            );
            return submission && (submission.state === 'TURNED_IN' || submission.state === 'RETURNED');
          });

          const totalAssignments = assignments.length;
          const completedCount = completedAssignments.length;
          const courseProgressPercentage = totalAssignments > 0 ? (completedCount / totalAssignments) * 100 : 0;

          // Determine course progress status
          let courseProgressStatus: "completed" | "due" | "pending" = "pending";
          if (totalAssignments === 0) {
            courseProgressStatus = "pending";
          } else if (completedCount === totalAssignments) {
            courseProgressStatus = "completed";
          } else if (completedCount > 0) {
            courseProgressStatus = "due";
          }

          // Check for specific survey/idea assignments
          const preSurveyAssignment = assignments.find((a: CourseWorkItem) => 
            a.title.toLowerCase().includes('pre-survey') || 
            a.title.toLowerCase().includes('pre survey')
          );
          const postSurveyAssignment = assignments.find((a: CourseWorkItem) => 
            a.title.toLowerCase().includes('post-survey') || 
            a.title.toLowerCase().includes('post survey')
          );
          const ideasAssignment = assignments.find((a: CourseWorkItem) => 
            a.title.toLowerCase().includes('idea') || 
            a.title.toLowerCase().includes('ideas')
          );

          // Check completion status for surveys and ideas
          const checkAssignmentCompletion = (assignment: CourseWorkItem | undefined) => {
            if (!assignment) return "due";
            const submission = safeSubmissions.find((sub: SubmissionItem) => 
              sub.courseWorkId === assignment.id
            );
            return submission && (submission.state === 'TURNED_IN' || submission.state === 'RETURNED') 
              ? "completed" : "due";
          };

          setProgressData({
            preSurvey: checkAssignmentCompletion(preSurveyAssignment),
            courseProgress: courseProgressStatus,
            ideas: checkAssignmentCompletion(ideasAssignment),
            postSurvey: checkAssignmentCompletion(postSurveyAssignment),
            courseProgressPercentage: Math.round(courseProgressPercentage),
            totalAssignments,
            completedAssignments: completedCount
          });
        } else {
          console.error('API response error:', data);
          setError(data.message || "Failed to fetch course data");
        }
      } catch (err) {
        console.error('Error fetching course progress:', err);
        setError(err instanceof Error ? err.message : "Failed to fetch course progress");
      } finally {
        setLoading(false);
      }
    };

    fetchCourseProgress();
  }, [selectedCourse]);

  if (loading) {
    return (
      <div className="flex items-center justify-start gap-4 md:gap-8 lg:gap-20 mb-8 md:mb-12 overflow-x-auto pb-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="animate-pulse">
            <div className="w-20 h-20 bg-gray-200 rounded-full"></div>
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="mb-8 md:mb-12 p-4 bg-red-50 border border-red-200 rounded-lg">
        <p className="text-red-600 text-sm">Error loading course progress: {error}</p>
      </div>
    );
  }

  // Safety check to ensure progressData is valid
  const safeProgressData = {
    preSurvey: progressData?.preSurvey || "due",
    courseProgress: progressData?.courseProgress || "pending", 
    ideas: progressData?.ideas || "due",
    postSurvey: progressData?.postSurvey || "due",
    courseProgressPercentage: typeof progressData?.courseProgressPercentage === 'number' ? progressData.courseProgressPercentage : 0,
    totalAssignments: typeof progressData?.totalAssignments === 'number' ? progressData.totalAssignments : 0,
    completedAssignments: typeof progressData?.completedAssignments === 'number' ? progressData.completedAssignments : 0
  };

  return (
    <div className="flex items-center justify-start gap-4 md:gap-8 lg:gap-20 mb-8 md:mb-12 overflow-x-auto pb-2">
      <ProgressCircle 
        status={safeProgressData.preSurvey} 
        label="Pre-Survey" 
      />
      
      <div className="flex flex-col items-center">
        <ProgressCircle 
          status={safeProgressData.courseProgress} 
          label="Course Progress" 
        />
      </div>
      
      <ProgressCircle 
        status={safeProgressData.ideas} 
        label="Ideas" 
      />
      
      <ProgressCircle 
        status={safeProgressData.postSurvey} 
        label="Post-Survey" 
      />
    </div>
  );
}
