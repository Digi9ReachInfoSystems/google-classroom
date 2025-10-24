"use client";
import { useState, useEffect } from "react";
import { useCourse } from "@/components/studentdashboard/context/CourseContext";
import { ProgressCircle } from "./progress-circle";


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
        // Fetch stage progress data (same as mycourses section)
        const res = await fetch(`/api/student/stage-progress?courseId=${selectedCourse.id}`);
        const data = await res.json();

        if (data.success && data.progress) {
          const progress = data.progress;
          
          // Map stage progress to our progress data format
          const preSurveyStatus = progress.preSurveyCompleted ? "completed" : "due";
          const ideasStatus = progress.ideasCompleted ? "completed" : "due";
          const postSurveyStatus = progress.postSurveyCompleted ? "completed" : "due";
          
          // Calculate course progress status
          let courseProgressStatus: "completed" | "due" | "pending" = "pending";
          if (progress.courseCompleted) {
            // Course is explicitly marked as completed
            courseProgressStatus = "completed";
          } else if (progress.regularCourseworkCount > 0) {
            const completionPercentage = (progress.completedCourseworkCount / progress.regularCourseworkCount) * 100;
            if (completionPercentage === 100) {
              courseProgressStatus = "completed";
            } else if (completionPercentage > 0) {
              courseProgressStatus = "due";
            } else {
              courseProgressStatus = "pending";
            }
          }

          setProgressData({
            preSurvey: preSurveyStatus,
            courseProgress: courseProgressStatus,
            ideas: ideasStatus,
            postSurvey: postSurveyStatus,
            courseProgressPercentage: progress.regularCourseworkCount > 0 
              ? Math.round((progress.completedCourseworkCount / progress.regularCourseworkCount) * 100) 
              : 0,
            totalAssignments: progress.regularCourseworkCount,
            completedAssignments: progress.completedCourseworkCount
          });
        } else {
          console.error('API response error:', data);
          setError(data.message || "Failed to fetch stage progress");
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
