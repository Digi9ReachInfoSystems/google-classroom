import mongoose, { Schema, Document } from 'mongoose';

export interface ILearningResource extends Document {
  id: string;
  details: string;
  type: 'Video' | 'Document' | 'Link' | 'Image' | 'Other';
  link?: string;
  createdBy: string; // superadmin email
  createdAt: Date;
  updatedAt: Date;
}

const LearningResourceSchema = new Schema<ILearningResource>(
  {
    details: { type: String, required: true, trim: true },
    type: { 
      type: String, 
      enum: ['Video', 'Document', 'Link', 'Image', 'Other'], 
      required: true 
    },
    link: { type: String, trim: true },
    createdBy: { type: String, required: true, index: true }
  },
  { 
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// Virtual for id field
LearningResourceSchema.virtual('id').get(function() {
  return this._id.toHexString();
});

// Index for efficient queries
LearningResourceSchema.index({ createdBy: 1, createdAt: -1 });

export const LearningResourceModel = mongoose.models.LearningResource || mongoose.model<ILearningResource>('LearningResource', LearningResourceSchema);
