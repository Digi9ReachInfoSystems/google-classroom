import mongoose, { Schema, Document } from 'mongoose';

export interface IReport extends Document {
  id: string;
  fileName: string;
  courseId: string;
  courseName: string;
  teacherEmail: string;
  reportType: 'student-progress' | 'analytics' | 'completion';
  filePath: string;
  fileSize: number;
  focalPoints: string[];
  filters: {
    age?: string;
    grade?: string;
    gender?: string;
    disability?: string;
  };
  generatedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const ReportSchema = new Schema<IReport>(
  {
    fileName: { type: String, required: true },
    courseId: { type: String, required: true, index: true },
    courseName: { type: String, required: true },
    teacherEmail: { type: String, required: true, index: true },
    reportType: { 
      type: String, 
      enum: ['student-progress', 'analytics', 'completion'], 
      required: true 
    },
    filePath: { type: String, required: true },
    fileSize: { type: Number, required: true },
    focalPoints: [{ type: String }],
    filters: {
      age: { type: String },
      grade: { type: String },
      gender: { type: String },
      disability: { type: String }
    }
  },
  { 
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// Virtual for id field
ReportSchema.virtual('id').get(function() {
  return (this as any)._id.toHexString();
});

// Index for efficient queries
ReportSchema.index({ courseId: 1, teacherEmail: 1 });
ReportSchema.index({ generatedAt: -1 });

export const ReportModel = mongoose.models.Report || mongoose.model<IReport>('Report', ReportSchema);
