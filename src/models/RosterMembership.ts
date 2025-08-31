import { Schema, model, models, Types } from 'mongoose';

export interface IRosterMembership {
	courseId: string; // Google Classroom course id
	userEmail: string;
	role: 'student' | 'teacher';
}

const RosterMembershipSchema = new Schema<IRosterMembership>(
	{
		courseId: { type: String, required: true, index: true },
		userEmail: { type: String, required: true, index: true },
		role: { type: String, enum: ['student', 'teacher'], required: true, index: true },
	},
	{ timestamps: true }
);

RosterMembershipSchema.index({ courseId: 1, userEmail: 1 }, { unique: true });

export const RosterMembershipModel = models.RosterMembership || model<IRosterMembership>('RosterMembership', RosterMembershipSchema);
