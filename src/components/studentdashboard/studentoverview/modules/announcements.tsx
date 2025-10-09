"use client";

import { Send, Bell } from "lucide-react"
import { useEffect, useState } from "react"
import { useCourse } from "@/components/studentdashboard/context/CourseContext"

interface Announcement {
  id: string;
  courseId: string;
  text: string;
  state: string;
  creationTime: string;
  updateTime: string;
  creatorUserId: string;
}

export function Announcements() {
  const { selectedCourse } = useCourse();
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch announcements when selected course changes
  useEffect(() => {
    const fetchAnnouncements = async () => {
      if (!selectedCourse?.id) {
        setAnnouncements([]);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        const response = await fetch(`/api/student/announcements?courseId=${selectedCourse.id}`);
        
        if (!response.ok) {
          throw new Error('Failed to fetch announcements');
        }
        
        const data = await response.json();
        
        if (data.success) {
          setAnnouncements(data.announcements);
        } else {
          throw new Error(data.error || 'Failed to load announcements');
        }
      } catch (err) {
        console.error('Error fetching announcements:', err);
        setError(err instanceof Error ? err.message : 'Failed to load announcements');
        setAnnouncements([]);
      } finally {
        setLoading(false);
      }
    };

    fetchAnnouncements();
  }, [selectedCourse]);
  return (
    <>
      <div className="bg-white rounded-lg border-neutral-200">
        <div className="flex items-center justify-between p-6 border-neutral-200">
          <h2 className="text-lg font-semibold text-neutral-900">Announcements</h2>
        </div>

        {error && (
          <div className="mx-6 mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
            <p className="text-red-700 text-sm">{error}</p>
          </div>
        )}

        {loading ? (
          <div className="p-6 space-y-6 max-h-[30rem] overflow-y-auto custom-scrollbar pr-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="space-y-3 animate-pulse">
                <div className="flex items-start space-x-3">
                  <div className="w-8 h-8 rounded-full bg-gray-200"></div>
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                    <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : announcements.length > 0 ? (
          <div className="p-6 space-y-6 max-h-[30rem] overflow-y-auto custom-scrollbar pr-3">
            {announcements.map((announcement) => (
              <div key={announcement.id} className="space-y-3">
                <div className="flex items-start space-x-3">
                  <div className="w-8 h-8 rounded-full border-2 border-neutral-200 flex items-center justify-center flex-shrink-0">
                    <Bell className="w-4 h-4 text-primary fill-primary stroke-none" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-neutral-700 leading-relaxed line-clamp-3">
                      {announcement.text}
                    </p>
                    <div className="text-xs text-neutral-500 mt-2">
                      {new Date(announcement.creationTime).toLocaleDateString()} at{' '}
                      {new Date(announcement.creationTime).toLocaleTimeString('en-US', {
                        hour: 'numeric',
                        minute: '2-digit',
                        hour12: true
                      })}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-6 space-y-6 max-h-[30rem] overflow-y-auto custom-scrollbar pr-3">
            <div className="text-center py-8">
              <div className="w-8 h-8 rounded-full border-2 border-neutral-200 flex items-center justify-center mx-auto mb-3">
                <Bell className="w-4 h-4 text-neutral-400" />
              </div>
              <p className="text-sm text-neutral-500">
                {selectedCourse ? 'No announcements yet' : 'Select a course to view announcements'}
              </p>
            </div>
          </div>
        )}
      </div>
    </>
  )
}
