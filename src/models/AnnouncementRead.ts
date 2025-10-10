import { Schema, model, models } from 'mongoose';

export interface IAnnouncementRead {
  studentEmail: string;
  courseId: string;
  lastReadAt: Date;
}

const AnnouncementReadSchema = new Schema<IAnnouncementRead>(
  {
    studentEmail: { type: String, required: true, index: true },
    courseId: { type: String, required: true, index: true },
    lastReadAt: { type: Date, required: true, default: Date.now }
  },
  { timestamps: true }
);

// Compound index for unique constraint
AnnouncementReadSchema.index({ studentEmail: 1, courseId: 1 }, { unique: true });

export const AnnouncementReadModel = models.AnnouncementRead || model<IAnnouncementRead>('AnnouncementRead', AnnouncementReadSchema);

