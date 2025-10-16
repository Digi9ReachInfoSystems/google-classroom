import { NextRequest, NextResponse } from 'next/server';
import { verifyAuthToken } from '@/lib/auth';
import { connectToDatabase } from '@/lib/mongodb';
import { FilterOptionsModel, DEFAULT_FILTER_OPTIONS } from '@/models/FilterOptions';

// Initialize default filter options in database if they don't exist
async function initializeFilterOptions() {
  await connectToDatabase();

  for (const [category, options] of Object.entries(DEFAULT_FILTER_OPTIONS)) {
    await FilterOptionsModel.findOneAndUpdate(
      { category },
      { category, options },
      { upsert: true, new: true }
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    // Check authentication
    const token = req.cookies.get('token')?.value;
    if (!token) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const payload = verifyAuthToken(token);
    if (!payload) {
      return NextResponse.json({ message: 'Access denied' }, { status: 403 });
    }

    await connectToDatabase();

    // Initialize filter options if they don't exist
    await initializeFilterOptions();

    // Fetch all filter options
    const filterOptions = await FilterOptionsModel.find({});

    // Transform to a more usable format
    const filters: any = {};
    for (const filter of filterOptions) {
      filters[filter.category] = filter.options;
    }

    return NextResponse.json({
      success: true,
      filters
    });

  } catch (error) {
    console.error('Filter options API error:', error);
    return NextResponse.json({
      success: false,
      message: 'Internal server error',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

