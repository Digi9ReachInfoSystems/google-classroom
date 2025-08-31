import { Schema, model, models } from 'mongoose';

export interface ICourse {
	courseId: string; // Google Classroom course id
	name?: string;
	section?: string;
	descriptionHeading?: string;
	description?: string;
	room?: string;
	ownerId?: string;
	enrollmentCode?: string;
	courseState?: string;
	updateTime?: Date;
	createdTime?: Date;
}

const CourseSchema = new Schema<ICourse>(
	{
		courseId: { type: String, required: true, unique: true, index: true },
		name: String,
		section: String,
		descriptionHeading: String,
		description: String,
		room: String,
		ownerId: String,
		enrollmentCode: String,
		courseState: String,
		updateTime: Date,
		createdTime: Date,
	},
	{ timestamps: true }
);

export const CourseModel = models.Course || model<ICourse>('Course', CourseSchema);
