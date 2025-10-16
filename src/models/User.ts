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
	photoUrl?: string;
	age?: string;
	grade?: string;
	schoolName?: string;
	disability?: string;
	customSchemas?: any;
	createdAt?: Date;
	updatedAt?: Date;
}

const UserSchema = new Schema<IUser>(
	{
		email: { type: String, required: true, index: true, unique: true },
		externalId: { type: String },
		role: { type: String, enum: ['student', 'teacher', 'district-admin', 'super-admin'], required: true, index: true },
		schoolId: { type: String, index: true },
		gender: { type: String, index: true },
		state: { type: String, index: true },
		district: { type: String, index: true },
		cohort: { type: String, index: true },
		givenName: { type: String },
		familyName: { type: String },
		fullName: { type: String },
		photoUrl: { type: String },
		age: { type: String, index: true },
		grade: { type: String, index: true },
		schoolName: { type: String, index: true },
		disability: { type: String, index: true },
		customSchemas: { type: Schema.Types.Mixed },
	},
	{ timestamps: true }
);

UserSchema.index({ state: 1, district: 1, gender: 1, role: 1 });
UserSchema.index({ age: 1, grade: 1, gender: 1, disability: 1 });
UserSchema.index({ schoolName: 1, district: 1 });

export const UserModel = models.User || model<IUser>('User', UserSchema);
