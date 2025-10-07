import mongoose, { Schema, Document } from 'mongoose';

export interface IMeeting extends Document {
  meetLink: string;
  courseId?: string;
  courseName: string;
  description: string;
  createdBy: string;
  status: 'scheduled' | 'ongoing' | 'completed' | 'cancelled';
}

const MeetingSchema = new Schema<IMeeting>(
  {
    meetLink: { type: String, required: true, unique: true },
    courseId: { type: String, index: true },
    courseName: { type: String, required: true },
    description: { type: String, trim: true },
    createdBy: { type: String, required: true, index: true },
    status: { 
      type: String, 
      enum: ['scheduled', 'ongoing', 'completed', 'cancelled'], 
      default: 'scheduled' 
    }
  },
  { 
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// Index for efficient queries
MeetingSchema.index({ createdBy: 1, createdAt: -1 });
MeetingSchema.index({ courseId: 1, createdAt: -1 });
MeetingSchema.index({ status: 1, createdAt: -1 });

export const MeetingModel = mongoose.models.Meeting || mongoose.model<IMeeting>('Meeting', MeetingSchema);
