"use client";

import { Badge } from "@/components/ui/badge";
import { Lock } from "lucide-react";
import Image from "next/image";
import { useState, useEffect } from "react";
import { useCourse } from "../../context/CourseContext";
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

export function BadgesSection() {
  const { selectedCourse } = useCourse();
  const [badges, setBadges] = useState<BadgeData[]>([]);
  const [loading, setLoading] = useState(true);
  const [earnedCount, setEarnedCount] = useState(0);

  useEffect(() => {
    if (selectedCourse?.id) {
      fetchBadges();
    }
  }, [selectedCourse]);

  const fetchBadges = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/student/badges?courseId=${selectedCourse?.id}`);
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
  const lockedCount = totalBadges - earnedCount;

  return (
    <div className="space-y-2 p-4 md:p-6 rounded-lg bg-white">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-base md:text-lg">Badges</h3>
        <Badge className="bg-orange-500 text-white text-xs px-2 py-1">
          {loading ? '...' : `${earnedCount} Earned`}
        </Badge>
      </div>
      <div className="grid grid-cols-3 gap-3 md:gap-4">
        {/* Earned Badges */}
        {badges.map((badge) => (
          <div key={badge.id} className="relative group" title={badge.title || getBadgeTitle(badge.badgeType)}>
            <Image
              src={getBadgeImage(badge.badgeType)}
              width={100}
              height={100}
              alt={badge.title || getBadgeTitle(badge.badgeType)}
              className="w-20 h-20 md:w-24 md:h-24 mx-auto transition-transform group-hover:scale-105"
            />
            {/* Tooltip on hover */}
            <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-black text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-10">
              {badge.title || getBadgeTitle(badge.badgeType)}
            </div>
          </div>
        ))}
        {/* Locked Badges */}
        {[...Array(lockedCount)].map((_, i) => (
          <div key={`locked-${i}`} className="w-20 h-20 md:w-24 md:h-24 mx-auto bg-gray-100 rounded-full flex items-center justify-center opacity-60 border-2 border-gray-200">
            <Lock className="w-5 h-5 md:w-6 md:h-6 text-gray-400" />
          </div>
        ))}
      </div>
    </div>
  );
}
