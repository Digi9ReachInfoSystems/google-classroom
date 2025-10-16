import { Schema, model, models } from 'mongoose';

export interface ISyncLog {
	syncId: string;
	userId: string;
	userRole: 'district-admin' | 'super-admin';
	syncType: 'full' | 'incremental' | 'courses' | 'users' | 'submissions';
	status: 'started' | 'in_progress' | 'completed' | 'failed';
	startTime: Date;
	endTime?: Date;
	duration?: number; // in milliseconds
	recordsProcessed: number;
	recordsSynced: number;
	recordsFailed: number;
	errorMessage?: string;
	metadata?: {
		coursesCount?: number;
		usersCount?: number;
		submissionsCount?: number;
		lastSyncTime?: Date;
	};
}

const SyncLogSchema = new Schema<ISyncLog>(
	{
		syncId: { type: String, required: true, unique: true, index: true },
		userId: { type: String, required: true, index: true },
		userRole: { type: String, enum: ['district-admin', 'super-admin'], required: true, index: true },
		syncType: { type: String, enum: ['full', 'incremental', 'courses', 'users', 'submissions'], required: true },
		status: { type: String, enum: ['started', 'in_progress', 'completed', 'failed'], required: true, index: true },
		startTime: { type: Date, required: true, index: true },
		endTime: { type: Date, index: true },
		duration: { type: Number },
		recordsProcessed: { type: Number, default: 0 },
		recordsSynced: { type: Number, default: 0 },
		recordsFailed: { type: Number, default: 0 },
		errorMessage: { type: String },
		metadata: {
			coursesCount: { type: Number },
			usersCount: { type: Number },
			submissionsCount: { type: Number },
			lastSyncTime: { type: Date }
		}
	},
	{ timestamps: true }
);

SyncLogSchema.index({ userId: 1, startTime: -1 });
SyncLogSchema.index({ userRole: 1, status: 1, startTime: -1 });

export const SyncLogModel = models.SyncLog || model<ISyncLog>('SyncLog', SyncLogSchema);
