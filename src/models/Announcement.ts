import mongoose, { Schema, Document } from 'mongoose';

export interface IAnnouncement extends Document {
  text: string;
  courseId: string;
  creatorUserId: string;
  creationTime: Date;
  updateTime: Date;
  state: 'DRAFT' | 'PUBLISHED' | 'DELETED';
}

const AnnouncementSchema = new Schema<IAnnouncement>(
  {
    text: { type: String, required: true, trim: true },
    courseId: { type: String, required: true, index: true },
    creatorUserId: { type: String, required: true, index: true },
    creationTime: { type: Date, required: true, default: Date.now },
    updateTime: { type: Date, required: true, default: Date.now },
    state: { 
      type: String, 
      enum: ['DRAFT', 'PUBLISHED', 'DELETED'], 
      default: 'PUBLISHED' 
    }
  },
  { 
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// Index for efficient queries
AnnouncementSchema.index({ courseId: 1, creationTime: -1 });
AnnouncementSchema.index({ creatorUserId: 1, creationTime: -1 });

export const AnnouncementModel = mongoose.models.Announcement || mongoose.model<IAnnouncement>('Announcement', AnnouncementSchema);
