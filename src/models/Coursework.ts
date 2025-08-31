import { Schema, model, models } from 'mongoose';

export interface ICoursework {
	courseId: string;
	courseWorkId: string;
	title?: string;
	description?: string;
	dueDate?: Date | null;
	state?: string;
	maxPoints?: number | null;
	updateTime?: Date;
	creationTime?: Date;
}

const CourseworkSchema = new Schema<ICoursework>(
	{
		courseId: { type: String, required: true, index: true },
		courseWorkId: { type: String, required: true, unique: true, index: true },
		title: String,
		description: String,
		dueDate: Date,
		state: String,
		maxPoints: Number,
		updateTime: Date,
		creationTime: Date,
	},
	{ timestamps: true }
);

export const CourseworkModel = models.Coursework || model<ICoursework>('Coursework', CourseworkSchema);
