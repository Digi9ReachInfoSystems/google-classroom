import { Schema, model, models } from 'mongoose';

export interface ICertificate {
  studentEmail: string;
  courseId: string;
  courseName: string;
  studentName: string;
  issuedAt: Date;
  certificateNumber: string;
  completionData: {
    preSurveyCompleted: boolean;
    postSurveyCompleted: boolean;
    ideasCompleted: boolean;
    assignmentsCompleted: boolean;
    totalAssignments: number;
    completedAssignments: number;
  };
}

const CertificateSchema = new Schema<ICertificate>(
  {
    studentEmail: { type: String, required: true, index: true },
    courseId: { type: String, required: true, index: true },
    courseName: { type: String, required: true },
    studentName: { type: String, required: true },
    issuedAt: { type: Date, required: true, default: Date.now },
    certificateNumber: { type: String, required: true, unique: true },
    completionData: {
      preSurveyCompleted: { type: Boolean, required: true },
      postSurveyCompleted: { type: Boolean, required: true },
      ideasCompleted: { type: Boolean, required: true },
      assignmentsCompleted: { type: Boolean, required: true },
      totalAssignments: { type: Number, required: true },
      completedAssignments: { type: Number, required: true }
    }
  },
  { timestamps: true }
);

// Compound index for unique constraint - one certificate per student per course
CertificateSchema.index({ studentEmail: 1, courseId: 1 }, { unique: true });

export const CertificateModel = models.Certificate || model<ICertificate>('Certificate', CertificateSchema);

