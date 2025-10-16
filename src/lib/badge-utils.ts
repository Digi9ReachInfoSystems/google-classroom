import { BadgeType } from '@/models/Badge';

// Map badge types to their corresponding SVG files
export const getBadgeImage = (badgeType: BadgeType): string => {
  const badgeImageMap: { [key in BadgeType]: string } = {
    'pre-survey': '/student/Pre_Survey.svg',
    'learning-module-1': '/student/Module_1.svg',
    'learning-module-2': '/student/Module_2.svg',
    'learning-module-3': '/student/Module_3.svg',
    'learning-module-4': '/student/Module_4.svg',
    'learning-module-5': '/student/Module_5.svg',
    'learning-module-6': '/student/Module_6.svg',
    'ideas': '/student/Idea_Submission.svg',
    'post-survey': '/student/Post_Survey.svg'
  };

  return badgeImageMap[badgeType] || '/student/badge-first.png'; // fallback
};

// Get badge display title
export const getBadgeTitle = (badgeType: BadgeType): string => {
  const badgeTitleMap: { [key in BadgeType]: string } = {
    'pre-survey': 'Pre-Survey Champion',
    'learning-module-1': 'Learning Module 1 Master',
    'learning-module-2': 'Learning Module 2 Master',
    'learning-module-3': 'Learning Module 3 Master',
    'learning-module-4': 'Learning Module 4 Master',
    'learning-module-5': 'Learning Module 5 Master',
    'learning-module-6': 'Learning Module 6 Master',
    'ideas': 'Idea Innovator',
    'post-survey': 'Post-Survey Champion'
  };

  return badgeTitleMap[badgeType] || 'Unknown Badge';
};

// Define the correct order for badges
export const BADGE_ORDER: BadgeType[] = [
  'pre-survey',
  'learning-module-1',
  'learning-module-2', 
  'learning-module-3',
  'learning-module-4',
  'learning-module-5',
  'learning-module-6',
  'ideas',
  'post-survey'
];

// Total number of badges
export const TOTAL_BADGES = 9;
