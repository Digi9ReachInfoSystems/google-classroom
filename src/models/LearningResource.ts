import { Schema, model, models } from 'mongoose';

export interface ILearningResource {
  details: string;
  type: 'Video' | 'Document' | 'Link' | 'Image' | 'Other';
  link?: string;
  createdBy: string;
  createdByEmail: string;
  createdAt: Date;
  updatedAt: Date;
}

const LearningResourceSchema = new Schema<ILearningResource>(
  {
    details: { type: String, required: true },
    type: { 
      type: String, 
      required: true,
      enum: ['Video', 'Document', 'Link', 'Image', 'Other']
    },
    link: { type: String },
    createdBy: { type: String, required: true },
    createdByEmail: { type: String, required: true },
  },
  { 
    timestamps: true 
  }
);

// Index for faster queries
LearningResourceSchema.index({ createdAt: -1 });
LearningResourceSchema.index({ type: 1 });
LearningResourceSchema.index({ createdByEmail: 1 });

export const LearningResourceModel = models.LearningResource || model<ILearningResource>('LearningResource', LearningResourceSchema);
