"use client";
import React, { useState, useEffect } from "react";
import { Bell, Send } from "lucide-react";
import AnnouncementModal from "./annocementpopup/AnnocementPoup";
import { useTeacherCourse } from "../../context/TeacherCourseContext";

/* ========================= helpers ========================= */
function StatusBell() {
  return (
    <div className="w-8 h-8 rounded-full border-2 border-neutral-200 flex items-center justify-center flex-shrink-0">
      <Bell className="w-4 h-4 text-primary fill-primary stroke-none" />
    </div>
  );
}

/* modal now imported from ./annocementpopup/AnnocementPoup */

/* ========================= list card ========================= */
interface Announcement {
  id: string;
  courseId: string;
  text: string;
  state: string;
  creationTime: string;
  updateTime: string;
  creatorUserId: string;
}

/* student-style comment input (opens modal on click) */
function CommentInput({ onOpen }: { onOpen: () => void }) {
  return (
    <div className="relative" onClick={onOpen}>
      <input
        type="text"
        placeholder="Add comment..."
        readOnly
        className="w-full px-4 py-2 text-sm border border-neutral-200 rounded-full bg-neutral-100 placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary pr-10"
      />
      <button className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-primary transition-colors" aria-label="Send comment">
        <Send className="w-4 h-4" />
      </button>
    </div>
  );
}

export default function TeacherAnnouncementsCard() {
  const { selectedCourse } = useTeacherCourse();
  const [open, setOpen] = useState(false);
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

        const response = await fetch(`/api/teacher/announcements?courseId=${selectedCourse.id}`);
        
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

  const handlePost = async (text: string, audience: string) => {
    if (!selectedCourse?.id) {
      setError('No course selected');
      return;
    }

    try {
      setError(null);

      const response = await fetch('/api/teacher/announcements', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          courseId: selectedCourse.id,
          text: text
        })
      });

      if (!response.ok) {
        throw new Error('Failed to post announcement');
      }

      const data = await response.json();
      
      if (data.success) {
        // Add the new announcement to the list
        setAnnouncements(prev => [data.announcement, ...prev]);
        console.log('Announcement posted successfully');
      } else {
        throw new Error(data.error || 'Failed to post announcement');
      }
    } catch (err) {
      console.error('Error posting announcement:', err);
      setError(err instanceof Error ? err.message : 'Failed to post announcement');
    }
  };

  return (
    <>
      <div className="bg-white rounded-xl p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-[18px] font-bold text-[var(--neutral-1000)]">
            Announcements
          </h3>
          {selectedCourse && (
            <div className="text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded">
              {selectedCourse.name}
            </div>
          )}
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
            <p className="text-red-700 text-sm">{error}</p>
          </div>
        )}

        {loading ? (
          <div className="p-1 space-y-6 max-h-[30rem] overflow-y-auto custom-scrollbar pr-3">
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
          <div className="p-1 space-y-6 max-h-[30rem] overflow-y-auto custom-scrollbar pr-3">
            {announcements.map((announcement) => (
              <div key={announcement.id} className="space-y-3">
                <div className="flex items-start space-x-3">
                  <StatusBell />
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
          <div className="p-1 space-y-6 max-h-[30rem] overflow-y-auto custom-scrollbar pr-3">
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

        <button 
          onClick={() => setOpen(true)} 
          disabled={!selectedCourse}
          className="mt-4 w-full rounded-full bg-[var(--primary)] hover:brightness-95 text-white py-3 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {selectedCourse ? 'Create Announcement' : 'Select Course to Announce'}
        </button>
      </div>

      {/* the modal */}
      <AnnouncementModal
        open={open}
        onClose={() => setOpen(false)}
        onPost={handlePost}
      />
    </>
  );
}
