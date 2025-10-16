import { Schema, model, models } from 'mongoose';

export interface IStageCompletion {
  courseId: string;
  studentEmail: string;
  stageId: string;
  completedAt: Date;
}

const StageCompletionSchema = new Schema<IStageCompletion>(
  {
    courseId: { type: String, required: true, index: true },
    studentEmail: { type: String, required: true, index: true },
    stageId: { type: String, required: true },
    completedAt: { type: Date, default: Date.now }
  },
  { timestamps: true }
);

// Compound index for unique constraint
StageCompletionSchema.index({ courseId: 1, studentEmail: 1, stageId: 1 }, { unique: true });

export const StageCompletionModel = models.StageCompletion || model<IStageCompletion>('StageCompletion', StageCompletionSchema);

