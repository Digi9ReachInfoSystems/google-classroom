"use client";
import React, { useState, useEffect } from "react";
import CircleProgressRow from "./modules/circleprogessrow";
import TeacherclassProgressCard from "./modules/ClassProgressCard";
import TeacherstudentsTable from "./modules/StudentsTable";
import TeacherMeetCard from "./modules/MeetCard";
import TeacherAnnouncementsCard from "./modules/AnnouncementsCard";
import { useTeacherCourse } from "../context/TeacherCourseContext";

export default function TeacherOverview() {
  const { selectedCourse } = useTeacherCourse();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch user info and profile
    const fetchUserData = async () => {
      try {
        // First get basic user info
        const userRes = await fetch('/api/auth/me');
        const userData = await userRes.json();
        
        if (userData.success && userData.user?.email) {
          // Then get detailed profile from Google
          const profileRes = await fetch('/api/auth/profile');
          const profileData = await profileRes.json();
          
          if (profileData.success) {
            setUser({
              ...userData.user,
              ...profileData.profile
            });
          } else {
            // Fallback to basic user data
            setUser(userData.user);
          }
        }
      } catch (err) {
        console.error('Failed to fetch user info:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-semibold">
            Welcome, {loading ? '...' : (
              user?.teacherProfile?.preferredName || 
              user?.teacherProfile?.firstName || 
              user?.name || 
              user?.given_name || 
              (user?.email ? user.email.split('@')[0].charAt(0).toUpperCase() + user.email.split('@')[0].slice(1) : 'Teacher')
            )}!
          </h2>
          {user?.teacherProfile && (
            <div className="mt-1 text-sm text-gray-600">
              {user.teacherProfile.schoolname}
              {user.teacherProfile.district && ` • ${user.teacherProfile.district}`}
            </div>
          )}
        </div>
        {selectedCourse && (
          <div className="text-sm text-gray-600 bg-gray-100 px-3 py-1 rounded-full">
            Viewing: {selectedCourse.name}
            {selectedCourse.section && ` (${selectedCourse.section})`}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 lg:grid-cols-12 gap-6">
        <div className="md:col-span-7 lg:col-span-8 space-y-6">
          <CircleProgressRow />
          <TeacherclassProgressCard />
          <TeacherstudentsTable />
        </div>

        <aside className="md:col-span-5 lg:col-span-4 space-y-6">
          <TeacherMeetCard />
          <TeacherAnnouncementsCard />
        </aside>
      </div>
    </div>
  );
}
