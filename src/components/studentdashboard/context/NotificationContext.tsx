"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useCourse } from './CourseContext';

interface NotificationContextType {
  hasUnreadAnnouncements: boolean;
  refreshNotifications: () => Promise<void>;
  markAnnouncementsAsRead: (courseId: string) => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export function NotificationProvider({ children }: { children: ReactNode }) {
  const { selectedCourse } = useCourse();
  const [hasUnreadAnnouncements, setHasUnreadAnnouncements] = useState(false);

  const refreshNotifications = async () => {
    if (selectedCourse?.id) {
      try {
        const response = await fetch(`/api/student/unread-announcements?courseId=${selectedCourse.id}`);
        const data = await response.json();
        if (data.success) {
          setHasUnreadAnnouncements(data.hasUnread);
        }
      } catch (error) {
        console.error('Error checking unread announcements:', error);
      }
    } else {
      setHasUnreadAnnouncements(false);
    }
  };

  const markAnnouncementsAsRead = async (courseId: string) => {
    try {
      await fetch('/api/student/unread-announcements', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ courseId })
      });
      // Refresh notification state after marking as read
      await refreshNotifications();
    } catch (error) {
      console.error('Error marking announcements as read:', error);
    }
  };

  // Check for unread announcements when course changes
  useEffect(() => {
    refreshNotifications();
    // Check every 60 seconds for new announcements
    const interval = setInterval(refreshNotifications, 60000);
    return () => clearInterval(interval);
  }, [selectedCourse]);

  return (
    <NotificationContext.Provider value={{ hasUnreadAnnouncements, refreshNotifications, markAnnouncementsAsRead }}>
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
}

