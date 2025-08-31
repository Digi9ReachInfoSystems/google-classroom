import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI as string;

if (!MONGODB_URI) {
	throw new Error('Please define the MONGODB_URI environment variable in .env.local');
}

interface GlobalMongooseCache {
	conn: typeof mongoose | null;
	promise: Promise<typeof mongoose> | null;
}

declare global {
	var mongoose: GlobalMongooseCache | undefined;
}

const cached: GlobalMongooseCache = globalThis.mongoose || { conn: null, promise: null };

if (!globalThis.mongoose) {
	globalThis.mongoose = cached;
}

export async function connectToDatabase(): Promise<typeof mongoose> {
	if (cached.conn) {
		return cached.conn;
	}

	if (!cached.promise) {
		cached.promise = mongoose.connect(MONGODB_URI, {
			dbName: 'google-classroom-analytics',
		});
	}

	cached.conn = await cached.promise;
	return cached.conn;
}
