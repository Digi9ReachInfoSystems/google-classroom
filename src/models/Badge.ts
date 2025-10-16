import { Schema, model, models } from 'mongoose';

export type BadgeType = 'pre-survey' | 'learning-module-1' | 'learning-module-2' | 'learning-module-3' | 'learning-module-4' | 'learning-module-5' | 'learning-module-6' | 'ideas' | 'post-survey';

export interface IBadge {
  courseId: string;
  studentEmail: string;
  badgeType: BadgeType;
  badgeIdentifier: string; // courseWorkId for learning modules, stage name for stages
  title?: string; // Display title for the badge
  description?: string; // Optional description
  awardedAt: Date;
}

const BadgeSchema = new Schema<IBadge>(
  {
    courseId: { type: String, required: true, index: true },
    studentEmail: { type: String, required: true, index: true },
    badgeType: { 
      type: String, 
      required: true, 
      enum: ['pre-survey', 'learning-module-1', 'learning-module-2', 'learning-module-3', 'learning-module-4', 'learning-module-5', 'learning-module-6', 'ideas', 'post-survey'] 
    },
    badgeIdentifier: { type: String, required: true },
    title: { type: String },
    description: { type: String },
    awardedAt: { type: Date, default: Date.now }
  },
  { timestamps: true }
);

// Compound index for unique constraint - one badge per student per identifier in a course
BadgeSchema.index(
  { courseId: 1, studentEmail: 1, badgeIdentifier: 1 }, 
  { unique: true }
);

// Index for efficient queries
BadgeSchema.index({ courseId: 1, studentEmail: 1 });

export const BadgeModel = models.Badge || model<IBadge>('Badge', BadgeSchema);

