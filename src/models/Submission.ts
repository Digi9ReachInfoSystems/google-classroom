import { Schema, model, models } from 'mongoose';

export interface ISubmission {
	courseId: string;
	courseWorkId: string;
	submissionId: string;
	userEmail: string;
	state?: string; // NEW, CREATED, TURNED_IN, RETURNED, RECLAIMED_BY_STUDENT
	late?: boolean;
	uploadedTime?: Date;
	updateTime?: Date;
	assignedGrade?: number | null;
}

const SubmissionSchema = new Schema<ISubmission>(
	{
		courseId: { type: String, required: true, index: true },
		courseWorkId: { type: String, required: true, index: true },
		submissionId: { type: String, required: true, unique: true, index: true },
		userEmail: { type: String, required: true, index: true },
		state: { type: String },
		late: { type: Boolean },
		uploadedTime: { type: Date },
		updateTime: { type: Date },
		assignedGrade: { type: Number },
	},
	{ timestamps: true }
);

SubmissionSchema.index({ courseId: 1, courseWorkId: 1, userEmail: 1 });

export const SubmissionModel = models.Submission || model<ISubmission>('Submission', SubmissionSchema);
