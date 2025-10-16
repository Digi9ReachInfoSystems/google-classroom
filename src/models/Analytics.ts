import { Schema, model, models } from 'mongoose';

export interface IAnalytics {
	district?: string;
	schoolId?: string;
	courseId?: string;
	userId?: string;
	userRole?: 'student' | 'teacher' | 'district-admin' | 'super-admin';
	metricType: 'enrollment' | 'attendance' | 'performance' | 'completion' | 'engagement';
	metricValue: number;
	metricUnit: 'count' | 'percentage' | 'score' | 'hours';
	timeframe: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly';
	period: string; // e.g., "2024-01", "2024-Q1", "2024"
	metadata?: {
		totalStudents?: number;
		activeStudents?: number;
		averageGrade?: number;
		completionRate?: number;
		attendanceRate?: number;
		engagementScore?: number;
	};
	calculatedAt: Date;
}

const AnalyticsSchema = new Schema<IAnalytics>(
	{
		district: { type: String, index: true },
		schoolId: { type: String, index: true },
		courseId: { type: String, index: true },
		userId: { type: String, index: true },
		userRole: { type: String, enum: ['student', 'teacher', 'district-admin', 'super-admin'], index: true },
		metricType: { type: String, enum: ['enrollment', 'attendance', 'performance', 'completion', 'engagement'], required: true, index: true },
		metricValue: { type: Number, required: true },
		metricUnit: { type: String, enum: ['count', 'percentage', 'score', 'hours'], required: true },
		timeframe: { type: String, enum: ['daily', 'weekly', 'monthly', 'quarterly', 'yearly'], required: true, index: true },
		period: { type: String, required: true, index: true },
		metadata: {
			totalStudents: { type: Number },
			activeStudents: { type: Number },
			averageGrade: { type: Number },
			completionRate: { type: Number },
			attendanceRate: { type: Number },
			engagementScore: { type: Number }
		},
		calculatedAt: { type: Date, required: true, index: true }
	},
	{ timestamps: true }
);

AnalyticsSchema.index({ district: 1, metricType: 1, period: 1 });
AnalyticsSchema.index({ schoolId: 1, metricType: 1, period: 1 });
AnalyticsSchema.index({ courseId: 1, metricType: 1, period: 1 });
AnalyticsSchema.index({ timeframe: 1, period: 1, calculatedAt: -1 });

export const AnalyticsModel = models.Analytics || model<IAnalytics>('Analytics', AnalyticsSchema);
