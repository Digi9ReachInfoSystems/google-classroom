import { Schema, model, models } from 'mongoose';

export interface ISchool {
	schoolId: string;
	name: string;
	district: string;
	state: string;
	principalEmail?: string;
	principalName?: string;
	address?: string;
	phone?: string;
	enrollmentCount?: number;
	teacherCount?: number;
	activeCourses?: number;
	lastSyncTime?: Date;
	metadata?: {
		establishedYear?: number;
		schoolType?: 'primary' | 'secondary' | 'high' | 'combined';
		boardAffiliation?: string;
		mediumOfInstruction?: string;
	};
}

const SchoolSchema = new Schema<ISchool>(
	{
		schoolId: { type: String, required: true, unique: true, index: true },
		name: { type: String, required: true, index: true },
		district: { type: String, required: true, index: true },
		state: { type: String, required: true, index: true },
		principalEmail: { type: String, index: true },
		principalName: { type: String },
		address: { type: String },
		phone: { type: String },
		enrollmentCount: { type: Number, default: 0 },
		teacherCount: { type: Number, default: 0 },
		activeCourses: { type: Number, default: 0 },
		lastSyncTime: { type: Date, index: true },
		metadata: {
			establishedYear: { type: Number },
			schoolType: { type: String, enum: ['primary', 'secondary', 'high', 'combined'] },
			boardAffiliation: { type: String },
			mediumOfInstruction: { type: String }
		}
	},
	{ timestamps: true }
);

SchoolSchema.index({ district: 1, state: 1 });
SchoolSchema.index({ name: 1, district: 1 });

export const SchoolModel = models.School || model<ISchool>('School', SchoolSchema);
