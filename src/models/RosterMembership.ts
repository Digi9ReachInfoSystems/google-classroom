import mongoose, { Schema } from 'mongoose';

export interface IRosterMembership {
	courseId: string; // Google Classroom course id
	userEmail: string;
	role: 'student' | 'teacher';
}

const rosterMembershipSchema = new Schema<IRosterMembership>({
	courseId: { type: String, required: true },
	userEmail: { type: String, required: true },
	role: { type: String, enum: ['student', 'teacher'], required: true },
}, {
	timestamps: true,
});

// Compound index to ensure unique course-user-role combinations
rosterMembershipSchema.index({ courseId: 1, userEmail: 1, role: 1 }, { unique: true });

export const RosterMembershipModel = mongoose.models.RosterMembership || mongoose.model<IRosterMembership>('RosterMembership', rosterMembershipSchema);
