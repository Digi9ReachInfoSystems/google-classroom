import { NextRequest, NextResponse } from 'next/server';
import { verifyAuthToken } from '@/lib/auth';
import { connectToDatabase } from '@/lib/mongodb';
import { SyncLogModel } from '@/models/SyncLog';

export async function GET(req: NextRequest) {
  try {
    // Check authentication
    const token = req.cookies.get('token')?.value;
    if (!token) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const payload = verifyAuthToken(token);
    if (!payload || (payload.role !== 'district-admin' && payload.role !== 'super-admin')) {
      return NextResponse.json({ message: 'Access denied' }, { status: 403 });
    }

    // Connect to database
    await connectToDatabase();

    // Get recent sync logs for the user
    const recentSyncs = await SyncLogModel.find({
      userId: payload.email
    })
    .sort({ startTime: -1 })
    .limit(10)
    .select('syncId syncType status startTime endTime duration recordsProcessed recordsSynced recordsFailed errorMessage');

    // Get overall sync statistics
    const [
      totalSyncs,
      successfulSyncs,
      failedSyncs,
      inProgressSyncs
    ] = await Promise.all([
      SyncLogModel.countDocuments({ userId: payload.email }),
      SyncLogModel.countDocuments({ userId: payload.email, status: 'completed' }),
      SyncLogModel.countDocuments({ userId: payload.email, status: 'failed' }),
      SyncLogModel.countDocuments({ userId: payload.email, status: 'in_progress' })
    ]);

    // Get the last successful sync
    const lastSuccessfulSync = await SyncLogModel.findOne({
      userId: payload.email,
      status: 'completed'
    })
    .sort({ startTime: -1 })
    .select('startTime endTime duration recordsSynced');

    // Calculate success rate
    const successRate = totalSyncs > 0 ? (successfulSyncs / totalSyncs) * 100 : 0;

    const status = {
      user: {
        email: payload.email,
        role: payload.role
      },
      summary: {
        totalSyncs,
        successfulSyncs,
        failedSyncs,
        inProgressSyncs,
        successRate: Math.round(successRate * 100) / 100,
        lastSuccessfulSync: lastSuccessfulSync ? {
          startTime: lastSuccessfulSync.startTime,
          endTime: lastSuccessfulSync.endTime,
          duration: lastSuccessfulSync.duration,
          recordsSynced: lastSuccessfulSync.recordsSynced
        } : null
      },
      recentSyncs: recentSyncs.map(sync => ({
        syncId: sync.syncId,
        syncType: sync.syncType,
        status: sync.status,
        startTime: sync.startTime,
        endTime: sync.endTime,
        duration: sync.duration,
        recordsProcessed: sync.recordsProcessed,
        recordsSynced: sync.recordsSynced,
        recordsFailed: sync.recordsFailed,
        errorMessage: sync.errorMessage
      }))
    };

    return NextResponse.json({
      success: true,
      data: status
    });

  } catch (error) {
    console.error('Sync status API error:', error);
    return NextResponse.json({
      success: false,
      message: 'Internal server error',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

