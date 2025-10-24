"use client";

import { Badge } from "@/components/ui/badge";
import { Lock } from "lucide-react";
import Image from "next/image";
import { useState, useEffect } from "react";
import { useTeacherCourse } from "../../context/TeacherCourseContext";
import { getBadgeImage, getBadgeTitle, TOTAL_BADGES } from '@/lib/badge-utils';
import { BadgeType } from '@/models/Badge';

interface BadgeData {
  id: string;
  badgeType: BadgeType;
  badgeIdentifier: string;
  title: string;
  description: string;
  awardedAt: string;
}

interface TeacherBadgesSectionProps {
  studentEmail: string;
}

export default function TeacherBadgesSection({ studentEmail }: TeacherBadgesSectionProps) {
  const { selectedCourse } = useTeacherCourse();
  const [badges, setBadges] = useState<BadgeData[]>([]);
  const [loading, setLoading] = useState(true);
  const [earnedCount, setEarnedCount] = useState(0);

  useEffect(() => {
    if (selectedCourse?.id && studentEmail) {
      fetchBadges();
    }
  }, [selectedCourse, studentEmail]);

  const fetchBadges = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/teacher/student-badges?courseId=${selectedCourse?.id}&studentEmail=${studentEmail}`);
      const data = await response.json();

      if (data.success) {
        setBadges(data.badges || []);
        setEarnedCount(data.earnedCount || 0);
      }
    } catch (error) {
      console.error('Error fetching badges:', error);
    } finally {
      setLoading(false);
    }
  };

  const totalBadges = TOTAL_BADGES;
  const lockedCount = Math.max(0, totalBadges - earnedCount);

  return (
    <div className="space-y-2 p-4 md:p-6 rounded-lg bg-white">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-base md:text-lg">Badges</h3>
        <Badge className="bg-orange-500 text-white text-xs px-2 py-1">
          {loading ? '...' : `${earnedCount} Earned`}
        </Badge>
      </div>
      <div className="grid grid-cols-3 gap-4 md:gap-6">
        {/* Earned Badges */}
        {badges.map((badge) => (
          <div key={badge.id} className="relative group" title={badge.title || getBadgeTitle(badge.badgeType)}>
            <Image
              src={getBadgeImage(badge.badgeType)}
              alt={badge.title || getBadgeTitle(badge.badgeType)}
              width={120}
              height={120}
              className="w-24 h-24 md:w-28 md:h-28 lg:w-32 lg:h-32 mx-auto transition-transform group-hover:scale-105"
            />
            {/* Tooltip on hover */}
            <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-black text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-10">
              {badge.title || getBadgeTitle(badge.badgeType)}
            </div>
          </div>
        ))}
        {/* Locked Badges */}
        {[...Array(lockedCount)].map((_, i) => (
          <div key={`locked-${i}`} className="w-24 h-24 md:w-28 md:h-28 lg:w-32 lg:h-32 mx-auto bg-gray-100 rounded-full flex items-center justify-center opacity-60 border-2 border-gray-200">
            <Lock className="w-6 h-6 md:w-7 md:h-7 lg:w-8 lg:h-8 text-gray-400" />
          </div>
        ))}
      </div>
    </div>
  );
}
