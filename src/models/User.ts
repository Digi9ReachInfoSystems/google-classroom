import { Schema, model, models } from 'mongoose';

export interface IUser {
	email: string;
	externalId?: string;
	role: 'student' | 'teacher' | 'district-admin' | 'super-admin';
	schoolId?: string;
	gender?: string;
	state?: string;
	district?: string;
	cohort?: string;
	givenName?: string;
	familyName?: string;
	fullName?: string;
	createdAt?: Date;
	updatedAt?: Date;
}

const UserSchema = new Schema<IUser>(
	{
		email: { type: String, required: true, index: true, unique: true },
		externalId: { type: String },
		role: { type: String, enum: ['student', 'teacher', 'district-admin', 'super-admin'], required: true, index: true },
		schoolId: { type: String },
		gender: { type: String, index: true },
		state: { type: String, index: true },
		district: { type: String, index: true },
		cohort: { type: String, index: true },
		givenName: { type: String },
		familyName: { type: String },
		fullName: { type: String },
	},
	{ timestamps: true }
);

UserSchema.index({ state: 1, district: 1, gender: 1, role: 1 });

export const UserModel = models.User || model<IUser>('User', UserSchema);
